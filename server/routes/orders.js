const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Prato = require("../models/Prato");
const Produto = require("../models/Produto");
const Historico = require("../models/Historico");
const { verifyToken } = require("../middleware/auth");

// ROTA 1: CRIAR UM NOVO PEDIDO (Backend calcula tudo)
// O frontend envia apenas: { itens: [{ pratoId: "...", quantidade: 1 }, ...] }
router.post("/", verifyToken, async (req, res) => {
    const { itens } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: "O pedido precisa conter pelo menos um item." });
    }

    try {
        let totalVenda = 0;
        let totalCusto = 0;
        const itensProcessados = [];

        // 1. O backend busca cada prato no DB para obter seus dados REAIS (preço, custo, etc)
        for (const item of itens) {
            const prato = await Prato.findById(item.pratoId);
            if (!prato) {
                return res.status(404).json({ error: `Prato com ID ${item.pratoId} não encontrado.` });
            }

            // Calcula o custo real do prato com base nos ingredientes
            const custoUnitario = prato.ingredientes.reduce((acc, ing) => acc + (ing.valorUnitario * ing.quantidade), 0);

            // Calcula os totais de forma segura
            totalVenda += prato.precoVenda * item.quantidade;
            totalCusto += custoUnitario * item.quantidade;

            itensProcessados.push({
                pratoId: prato._id,
                nome: prato.nome,
                precoVenda: prato.precoVenda, // Preço de venda do DB
                quantidade: item.quantidade,
                custoUnitario: custoUnitario, // Custo calculado do DB
            });
        }

        // 2. Cria o novo pedido com os dados calculados e status inicial 'pendente'
        const novoPedido = new Order({
            itens: itensProcessados,
            totalVenda,
            totalCusto,
            status: 'pendente', // Status inicial padrão
        });

        await novoPedido.save();
        res.status(201).json(novoPedido);

    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        res.status(500).json({ error: "Erro interno do servidor ao criar pedido." });
    }
});

// ROTA 2: ATUALIZAR STATUS E DAR BAIXA NO ESTOQUE (A ser chamada após confirmação de pagamento)
router.patch("/:id/status", verifyToken, async (req, res) => {
    const { status } = req.body;
    const validStatus = ['pendente', 'pago', 'finalizado', 'cancelado'];

    if (!status || !validStatus.includes(status)) {
        return res.status(400).json({ error: "Status inválido." });
    }

    const session = await mongoose.startSession();

    try {
        let pedidoAtualizado;
        await session.withTransaction(async () => {
            const pedido = await Order.findById(req.params.id).session(session);
            if (!pedido) throw new Error("Pedido não encontrado.");

            // A baixa de estoque só ocorre ao mover para 'pago' ou 'finalizado'
            // E se o pedido ainda estiver 'pendente' (para evitar baixas duplicadas)
            if ((status === 'pago' || status === 'finalizado') && pedido.status === 'pendente') {
                for (const item of pedido.itens) {
                    const prato = await Prato.findById(item.pratoId).session(session);
                    if (!prato) throw new Error(`Receita para ${item.nome} não encontrada.`);

                    for (const ing of prato.ingredientes) {
                        const quantidadeNecessaria = ing.quantidade * item.quantidade;
                        const produtoEstoque = await Produto.findOneAndUpdate(
                            { _id: ing.produtoId, quantidade: { $gte: quantidadeNecessaria } },
                            { $inc: { quantidade: -quantidadeNecessaria } },
                            { session }
                        );

                        if (!produtoEstoque) {
                            throw new Error(`Estoque insuficiente para ${ing.nome}.`);
                        }
                    }
                }
            }

            // Finalmente, atualiza o status do pedido
            pedido.status = status;
            pedidoAtualizado = await pedido.save({ session });
        });

        res.status(200).json(pedidoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar status do pedido:", error);
        res.status(400).json({ error: error.message });
    } finally {
        await session.endSession();
    }
});


// ROTA 3: Listar todos os pedidos (para histórico)
router.get("/", verifyToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
});

module.exports = router;