const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Importar o mongoose para usar transações
const Produto = require("../models/Produto");
const Prato = require("../models/Prato");
const Historico = require("../models/Historico"); // Supondo que você tenha um modelo para o histórico de uso

// ---------------------------------------------------------------
// ROTA 1: CRIAR UMA NOVA RECEITA DE PRATO (sem mexer no estoque)
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
    try {
        const { nome, ingredientes } = req.body;

        if (!nome || !ingredientes || ingredientes.length === 0) {
            return res.status(400).json({ error: "Nome e ingredientes são obrigatórios." });
        }

        // Validação para garantir que os ingredientes têm todos os campos necessários
        for (const ing of ingredientes) {
            if (!ing.produtoId || !ing.nome || !ing.quantidade || !ing.unidade || ing.valorUnitario === undefined) {
                return res.status(400).json({ error: `Ingrediente inválido: ${ing.nome || 'desconhecido'}. Verifique os campos.` });
            }
        }

        const novoPrato = new Prato({ nome, ingredientes });
        await novoPrato.save();
        res.status(201).json(novoPrato);

    } catch (error) {
        if (error.code === 11000) { // Código de erro para chave duplicada (nome único)
            return res.status(409).json({ error: `O prato com nome "${req.body.nome}" já existe.` });
        }
        console.error("Erro ao criar prato:", error);
        res.status(500).json({ error: "Erro interno do servidor ao criar prato." });
    }
});


// ---------------------------------------------------------------
// ROTA 2: "FAZER" UM PRATO EXISTENTE (dando baixa no estoque)
// ---------------------------------------------------------------
router.post("/:id/fazer", async (req, res) => {
    const session = await mongoose.startSession(); // Iniciar uma sessão para a transação

    try {
        await session.withTransaction(async () => {
            const prato = await Prato.findById(req.params.id).session(session);
            if (!prato) {
                throw new Error("Prato não encontrado."); // Lança erro para abortar a transação
            }

            const historicosDeUso = [];

            // Debitar ingredientes do estoque (agora de forma atômica)
            for (const ing of prato.ingredientes) {
                const produtoEstoque = await Produto.findOneAndUpdate(
                    {
                        _id: ing.produtoId,
                        quantidade: { $gte: ing.quantidade } // Condição atômica: só atualiza se a quantidade for suficiente
                    },
                    { $inc: { quantidade: -ing.quantidade } },
                    { new: true, session } // 'new: true' retorna o documento atualizado, 'session' garante que faz parte da transação
                );

                if (!produtoEstoque) {
                    // Se o produto não for encontrado ou não tiver estoque, a transação será abortada.
                    throw new Error(`Estoque insuficiente para ${ing.nome}`);
                }

                // Preparar registro no histórico de uso para cada ingrediente
                historicosDeUso.push({
                    tipo: 'uso',
                    produto: ing.nome,
                    produtoId: ing.produtoId,
                    quantidade: ing.quantidade,
                    unidade: ing.unidade,
                    valorUnitario: ing.valorUnitario, // Salva o custo do ingrediente no momento do uso
                    origem: prato.nome, // Indica que foi usado para fazer este prato
                    data: new Date()
                });
            }

            // Se todos os ingredientes foram debitados com sucesso, insere os registros no histórico
            await Historico.insertMany(historicosDeUso, { session });
        });

        res.status(200).json({ message: "Prato feito com sucesso e estoque atualizado." });

    } catch (error) {
        console.error("Erro na transação ao fazer prato:", error);
        // Retorna a mensagem de erro específica (ex: "Estoque insuficiente")
        res.status(400).json({ error: error.message || "Não foi possível fazer o prato." });
    } finally {
        await session.endSession(); // Sempre fechar a sessão no final
    }
});


// ---------------------------------------------------------------
// ROTA 3: LISTAR TODAS AS RECEITAS DE PRATOS
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const pratos = await Prato.find().sort({ nome: 1 });
        res.json(pratos);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar pratos." });
    }
});

// Adicionar rota de exclusão também é uma boa prática
router.delete("/:id", async (req, res) => {
    try {
        const prato = await Prato.findByIdAndDelete(req.params.id);
        if (!prato) {
            return res.status(404).json({ message: "Prato não encontrado." });
        }
        res.status(200).json({ message: `Prato "${prato.nome}" removido.` });
    } catch (err) {
        res.status(500).json({ message: "Erro ao remover prato." });
    }
});


module.exports = router;