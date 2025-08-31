// Arquivo: models/Produto.js
import mongoose from "mongoose";

const produtoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 0 },
    unidade: { type: String, required: true },
    local: { type: String, required: true, enum: ['superior', 'inferior'] },
    valorUnitario: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, default: 0 },
    categoria: { type: String, default: 'Outros' },
    fornecedor: { type: String },
    arquivado: { type: Boolean, default: false },
}, { timestamps: true });

produtoSchema.index({ nome: 1, unidade: 1, local: 1 }, { unique: true });

// CORREÇÃO: Trocado 'module.exports' por 'export default' para compatibilidade com ES Modules
export default mongoose.model("Produto", produtoSchema);