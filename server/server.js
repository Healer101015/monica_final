import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from 'url';
import fs from 'fs'; // Módulo 'File System' do Node.js

// Importação dos Models
import Produto from "./models/Produto.js";
import Historico from "./models/Historico.js";
import Prato from "./models/Prato.js";
import Order from "./models/Order.js";

// Importação de Middlewares e Rotas de Autenticação
import authRoutes from './routes/auth.js';
import { verifyToken } from './middleware/auth.js';
import { isAdmin } from './middleware/admin.js';

// --- CONFIGURAÇÃO DE CAMINHO E DIRETÓRIO ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- SERVIR ARQUIVOS ESTÁTICOS (IMAGENS) ---
// Torna a pasta 'public' acessível publicamente pela URL
app.use('/public', express.static(path.join(__dirname, 'public')));

mongoose.connect("mongodb://127.0.0.1:27017/estoque");

// --- VERIFICA E CRIA A PASTA PARA UPLOADS SE NÃO EXISTIR ---
const uploadDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- CONFIGURAÇÃO DO MULTER PARA UPLOAD DE IMAGENS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Onde salvar as imagens
    },
    filename: function (req, file, cb) {
        // Cria um nome de arquivo único para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// --- ROTAS PÚBLICAS ---
app.use('/api/auth', authRoutes);

// ===================================================================
//                        NOVA ROTA PÚBLICA PARA O CARDÁPIO
// ===================================================================
// Esta rota não usa o 'verifyToken', permitindo acesso público.
app.get("/api/public/cardapio", async (req, res) => {
    try {
        // Busca todos os pratos no banco de dados e ordena por nome
        const pratos = await Prato.find().sort({ nome: 1 });
        res.json(pratos);
    } catch (error) {
        console.error("Erro ao buscar cardápio público:", error);
        res.status(500).json({ error: "Erro ao buscar o cardápio." });
    }
});


// --- ROTAS PROTEGIDAS ---
// A partir daqui, todas as rotas exigirão um token válido.

// --- ROTAS DE PRODUTOS ---
app.get("/api/produtos/:local", verifyToken, async (req, res) => {
    const produtos = await Produto.find({ local: req.params.local });
    res.json(produtos);
});

app.post("/api/produtos", verifyToken, isAdmin, async (req, res) => {
    const { nome, quantidade, unidade, valorUnitario } = req.body;
    try {
        const produto = await Produto.create({ nome, quantidade, unidade, local: "superior", valorUnitario });
        await Historico.create({
            tipo: "entrada",
            produto: nome,
            quantidade,
            unidade,
            valorUnitario,
            para: "superior"
        });
        res.json(produto);
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ error: "Erro ao criar produto." });
    }
});

app.post("/api/mover/:id", verifyToken, isAdmin, async (req, res) => {
    const { quantidade } = req.body;
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    if (quantidade > produto.quantidade || quantidade <= 0) {
        return res.status(400).json({ error: "Quantidade inválida" });
    }
    const destinoLocal = produto.local === "superior" ? "inferior" : "superior";
    produto.quantidade -= quantidade;
    await produto.save();
    let destino = await Produto.findOne({ nome: produto.nome, unidade: produto.unidade, local: destinoLocal });
    if (destino) {
        destino.quantidade += quantidade;
        await destino.save();
    } else {
        await Produto.create({
            nome: produto.nome,
            quantidade,
            unidade: produto.unidade,
            local: destinoLocal,
            valorUnitario: produto.valorUnitario
        });
    }
    await Historico.create({
        tipo: "transferencia",
        produto: produto.nome,
        quantidade,
        unidade: produto.unidade,
        de: produto.local,
        para: destinoLocal,
        valorUnitario: produto.valorUnitario
    });
    res.json({ message: `Movimentado para ${destinoLocal} com sucesso` });
});

app.put("/api/produtos/:id", verifyToken, isAdmin, async (req, res) => {
    const { quantidade } = req.body;
    const produto = await Produto.findByIdAndUpdate(req.params.id, { quantidade }, { new: true });
    await Historico.create({
        tipo: "edicao",
        produto: produto.nome,
        quantidade,
        unidade: produto.unidade,
        para: produto.local
    });
    res.json(produto);
});

app.delete("/api/produtos/:id", verifyToken, isAdmin, async (req, res) => {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    await Historico.create({
        tipo: "remocao",
        produto: produto.nome,
        quantidade: produto.quantidade,
        unidade: produto.unidade,
        de: produto.local
    });
    res.json({ message: "Removido" });
});

app.post("/api/remover-quantidade/:id", verifyToken, isAdmin, async (req, res) => {
    const { quantidade } = req.body;
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    if (produto.local !== "inferior") return res.status(400).json({ error: "Só é possível remover do estoque inferior" });
    if (quantidade > produto.quantidade || quantidade <= 0) {
        return res.status(400).json({ error: "Quantidade maior que disponível ou inválida" });
    }
    produto.quantidade -= quantidade;
    await produto.save();
    await Historico.create({
        tipo: "saida",
        produto: produto.nome,
        quantidade,
        unidade: produto.unidade,
        de: "inferior"
    });
    res.json({ message: "Quantidade removida com sucesso" });
});

// --- ROTAS DE HISTÓRICO ---
app.get("/api/historico", verifyToken, isAdmin, async (req, res) => {
    const hist = await Historico.find({ tipo: { $ne: 'consumo_prato' } }).sort({ data: -1 });
    res.json(hist);
});

app.get("/api/historico/uso", verifyToken, isAdmin, async (req, res) => {
    const histUso = await Historico.find({ tipo: 'consumo_prato' }).sort({ data: -1 });
    res.json(histUso);
});

// --- ROTAS DE PRATOS (COM ALTERAÇÕES) ---
app.get("/api/pratos", verifyToken, async (req, res) => {
    try {
        const pratos = await Prato.find();
        res.json(pratos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pratos." });
    }
});

app.post("/api/pratos", verifyToken, isAdmin, upload.single('imagem'), async (req, res) => {
    try {
        const { nome, ingredientes, precoVenda } = req.body;
        const ingredientesParsed = JSON.parse(ingredientes);

        if (!nome || !ingredientesParsed || ingredientesParsed.length === 0 || precoVenda === undefined || isNaN(Number(precoVenda))) {
            return res.status(400).json({ error: "Nome, ingredientes e um preço de venda válido são obrigatórios." });
        }

        const dadosPrato = {
            nome,
            ingredientes: ingredientesParsed,
            precoVenda,
            imagem: req.file ? path.join('public/images', req.file.filename).replace(/\\/g, "/") : ''
        };

        const novoPrato = await Prato.create(dadosPrato);
        res.status(201).json(novoPrato);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Um prato com este nome já existe." });
        }
        console.error("Erro ao criar prato:", error)
        res.status(500).json({ error: "Erro ao criar o prato." });
    }
});


app.delete("/api/pratos/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const prato = await Prato.findByIdAndDelete(req.params.id);
        if (!prato) {
            return res.status(404).json({ error: "Prato não encontrado." });
        }
        if (prato.imagem) {
            const imagePath = path.join(__dirname, prato.imagem);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        res.json({ message: `Prato "${prato.nome}" removido com sucesso!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao remover o prato." });
    }
});

app.post("/api/pratos/:id/fazer", verifyToken, async (req, res) => {
    try {
        const prato = await Prato.findById(req.params.id);
        if (!prato) return res.status(404).json({ error: "Prato não encontrado" });
        for (const ingrediente of prato.ingredientes) {
            const produtoEmEstoque = await Produto.findOne({
                _id: ingrediente.produtoId,
                local: "inferior",
            });
            if (!produtoEmEstoque || produtoEmEstoque.quantidade < ingrediente.quantidade) {
                return res.status(400).json({ message: `Estoque insuficiente para: ${ingrediente.nome}` });
            }
        }
        for (const ingrediente of prato.ingredientes) {
            const produtoEmEstoque = await Produto.findById(ingrediente.produtoId);
            produtoEmEstoque.quantidade -= ingrediente.quantidade;
            await produtoEmEstoque.save();
            await Historico.create({
                tipo: 'consumo_prato',
                produto: ingrediente.nome,
                quantidade: ingrediente.quantidade,
                unidade: ingrediente.unidade,
                valorUnitario: produtoEmEstoque.valorUnitario,
                de: 'inferior',
                origem: prato.nome,
            });
        }
        res.json({ message: `Prato "${prato.nome}" feito com sucesso!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ocorreu um erro no servidor ao processar o prato." });
    }
});

// --- ROTAS DE PEDIDOS ---
app.post("/api/orders", verifyToken, async (req, res) => {
    const { itens } = req.body;
    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: "O pedido precisa conter pelo menos um item." });
    }
    try {
        let totalVenda = 0;
        let totalCusto = 0;
        const itensProcessados = [];
        for (const item of itens) {
            const prato = await Prato.findById(item.pratoId);
            if (!prato) {
                return res.status(404).json({ error: `Prato com ID ${item.pratoId} não encontrado.` });
            }
            const custoUnitario = prato.ingredientes.reduce((acc, ing) => acc + (ing.valorUnitario * ing.quantidade), 0);
            totalVenda += prato.precoVenda * item.quantidade;
            totalCusto += custoUnitario * item.quantidade;
            itensProcessados.push({
                pratoId: prato._id,
                nome: prato.nome,
                precoVenda: prato.precoVenda,
                quantidade: item.quantidade,
                custoUnitario: custoUnitario,
            });
        }
        const novoPedido = new Order({
            itens: itensProcessados,
            totalVenda,
            totalCusto,
            status: 'pendente',
        });
        await novoPedido.save();
        res.status(201).json(novoPedido);
    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        res.status(500).json({ error: "Erro interno do servidor ao criar pedido." });
    }
});

app.get("/api/orders", verifyToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
});

app.patch("/api/orders/:id/status", verifyToken, async (req, res) => {
    const { status } = req.body;
    const validStatus = ['pendente', 'pago', 'finalizado', 'cancelado'];

    if (!status || !validStatus.includes(status)) {
        return res.status(400).json({ error: "Status inválido." });
    }

    try {
        const pedido = await Order.findById(req.params.id);
        if (!pedido) {
            return res.status(404).json({ error: "Pedido não encontrado." });
        }

        if ((status === 'pago' || status === 'finalizado') && pedido.status === 'pendente') {
            for (const item of pedido.itens) {
                const prato = await Prato.findById(item.pratoId);
                if (!prato) {
                    throw new Error(`Receita para ${item.nome} não encontrada.`);
                }

                for (const ing of prato.ingredientes) {
                    const quantidadeNecessaria = ing.quantidade * item.quantidade;
                    const produtoEstoque = await Produto.findOneAndUpdate(
                        { _id: ing.produtoId, quantidade: { $gte: quantidadeNecessaria } },
                        { $inc: { quantidade: -quantidadeNecessaria } },
                        { new: true }
                    );

                    if (!produtoEstoque) {
                        throw new Error(`Estoque insuficiente para ${ing.nome}.`);
                    }

                    await Historico.create({
                        tipo: 'uso_venda',
                        produto: ing.nome,
                        produtoId: ing.produtoId,
                        quantidade: quantidadeNecessaria,
                        unidade: ing.unidade,
                        valorUnitario: ing.valorUnitario,
                        origem: `Pedido ${pedido._id.toString().slice(-6)}`,
                        data: new Date()
                    });
                }
            }
        }

        pedido.status = status;
        const pedidoAtualizado = await pedido.save();
        res.status(200).json(pedidoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar status do pedido:", error);
        res.status(400).json({ error: error.message });
    }
});


// --- ROTA DE ESTATÍSTICAS DE LUCRO ---
app.get("/api/stats/lucro", verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['pago', 'finalizado'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalVenda: { $sum: "$totalVenda" },
                    totalCusto: { $sum: "$totalCusto" }
                }
            }
        ]);

        if (result.length > 0) {
            const { totalVenda, totalCusto } = result[0];
            const lucro = totalVenda - totalCusto;
            res.json({ totalVenda, totalCusto, lucro });
        } else {
            res.json({ totalVenda: 0, totalCusto: 0, lucro: 0 });
        }
    } catch (error) {
        console.error("Erro ao calcular lucro:", error);
        res.status(500).json({ error: "Erro ao calcular estatísticas de lucro." });
    }
});


app.listen(3001, () => console.log("Servidor rodando na porta 3001"));
