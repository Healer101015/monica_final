// Arquivo: models/Prato.js
import mongoose from "mongoose";

const IngredienteSchema = new mongoose.Schema({
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true },
    unidade: { type: String, required: true },
    valorUnitario: { type: Number, required: true, default: 0 },
}, { _id: false });

const PratoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
    },
    precoVenda: {
        type: Number,
        required: true,
        min: 0,
    },
    // CORREÇÃO: Garantindo que o campo 'imagem' existe no Schema.
    // É por isso que ele não estava sendo salvo no banco de dados.
    imagem: {
        type: String,
        default: '',
    },
    ingredientes: [IngredienteSchema],
}, { timestamps: true });

export default mongoose.model("Prato", PratoSchema);
