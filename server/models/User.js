// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    // NOVO CAMPO ADICIONADO
    role: {
        type: String,
        enum: ['admin', 'funcionario'], // Apenas estes valores são permitidos
        default: 'funcionario'         // O padrão para novos usuários será 'funcionario'
    }
});

module.exports = mongoose.model("User", UserSchema);