import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
    pratoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prato', required: true },
    nome: { type: String, required: true },
    precoVenda: { type: Number, required: true }, // Preço unitário no momento da venda
    quantidade: { type: Number, required: true },
    custoUnitario: { type: Number, required: true }, // Custo unitário no momento da venda
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['pendente', 'pago', 'finalizado', 'cancelado'], // Controla os status possíveis
        default: 'pendente',
    },
    totalVenda: { type: Number, required: true }, // Valor total da venda (receita)
    totalCusto: { type: Number, required: true }, // Valor total do custo (despesa)
    itens: [OrderItemSchema],
}, { timestamps: true }); // O campo 'createdAt' é adicionado automaticamente

// CORREÇÃO: Trocado 'module.exports' por 'export default'
export default mongoose.model("Order", OrderSchema);