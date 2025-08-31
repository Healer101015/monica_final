// Arquivo: models/Historico.js
import mongoose from "mongoose";

const HistoricoSchema = new mongoose.Schema({
    data: { type: Date, default: Date.now },
    tipo: String, // ex: 'uso', 'consumo_prato', 'transferencia', 'entrada'
    produto: String,
    quantidade: Number,
    unidade: String,

    // Essencial para registrar o custo no momento da operação
    valorUnitario: { type: Number, default: 0 },

    de: String,
    para: String,
    origem: String, // ex: nome do prato ou ID do pedido
});

// CORREÇÃO: Trocado 'module.exports' por 'export default' para compatibilidade com ES Modules
export default mongoose.model("Historico", HistoricoSchema);