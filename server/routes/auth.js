import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();
const JWT_SECRET = 'seu-segredo-super-secreto-aqui';

/**
 * @route   GET /api/auth/setup-status
 * @desc    Verifica se a configuração inicial (criação do admin) é necessária
 * @access  Public
 */
router.get('/setup-status', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.status(200).json({ setupNeeded: userCount === 0 });
    } catch (error) {
        console.error("Erro ao verificar status da configuração:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

/**
 * @route   POST /api/auth/setup-admin
 * @desc    Registra o primeiro usuário como administrador. Só funciona se não houver usuários no banco.
 * @access  Public
 */
router.post('/setup-admin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return res.status(403).json({ message: 'A configuração inicial já foi realizada. Um administrador já existe.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const adminUser = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'admin' // A primeira conta é definida como 'admin'
        });

        await adminUser.save();

        // Loga o novo admin automaticamente, retornando um token
        const userPayload = {
            id: adminUser._id,
            email: adminUser.email,
            role: adminUser.role
        };
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

        res.status(201).json({ token });

    } catch (error) {
        console.error("Erro ao registrar admin inicial:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Autentica um usuário (admin ou funcionário) e retorna um token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const userPayload = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({ token });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

/**
 * @route   POST /api/auth/register
 * @desc    Registra um novo funcionário (rota protegida, apenas para admins)
 * @access  Admin
 */
router.post('/register', verifyToken, isAdmin, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ message: 'Um usuário com este email já existe.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'funcionario' // Contas criadas por aqui são sempre 'funcionario'
        });

        await user.save();

        res.status(201).json({ message: `Funcionário ${user.email} registrado com sucesso!` });

    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

export default router;
