import jwt from 'jsonwebtoken';

// O segredo do JWT deve ser o mesmo usado na criação do token.
const JWT_SECRET = 'seu-segredo-super-secreto-aqui';

export const verifyToken = (req, res, next) => {
    // O token é esperado no formato "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        // Verifica se o token é válido
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adiciona os dados do usuário à requisição
        next(); // Continua para a próxima rota
    } catch (error) {
        res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
};