/**
 * Middleware para verificar se o usuário autenticado é um administrador.
 * Este middleware deve ser usado DEPOIS do middleware verifyToken,
 * pois ele depende do objeto `req.user` que o verifyToken cria.
 */
export const isAdmin = (req, res, next) => {
    // Verifica se o objeto 'user' existe na requisição e se a 'role' é 'admin'
    if (req.user && req.user.role === 'admin') {
        // Se for admin, permite que a requisição continue para a próxima rota
        next();
    } else {
        // Se não for admin, retorna um erro 403 (Forbidden), pois o acesso é proibido
        res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
};