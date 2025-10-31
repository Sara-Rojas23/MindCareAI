const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
    
    // Generar JWT token
    static generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        return jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mindcare_default_secret_change_in_production',
            { expiresIn: '24h' }
        );
    }

    // Middleware para verificar JWT token
    static async authenticate(req, res, next) {
        try {
            // Obtener token del header Authorization
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de acceso requerido'
                });
            }

            // Formato esperado: "Bearer TOKEN"
            const token = authHeader.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Formato de token inválido'
                });
            }

            // Verificar y decodificar el token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'mindcare_default_secret_change_in_production'
            );

            // Verificar que el usuario aún existe
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no válido'
                });
            }

            // Agregar información del usuario a la request
            req.user = user.toSafeObject();
            next();

        } catch (error) {
            console.error('Error en autenticación:', error.message);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // Middleware opcional para rutas que pueden o no requerir autenticación
    static async optionalAuthenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                // No hay token, continuar sin usuario
                req.user = null;
                return next();
            }

            const token = authHeader.split(' ')[1];
            
            if (!token) {
                req.user = null;
                return next();
            }

            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'mindcare_default_secret_change_in_production'
            );

            const user = await User.findById(decoded.id);
            req.user = user ? user.toSafeObject() : null;
            
            next();

        } catch (error) {
            // En caso de error, continuar sin usuario
            req.user = null;
            next();
        }
    }

    // Verificar si el usuario es propietario del recurso
    static requireOwnership(resourceUserIdField = 'user_id') {
        return (req, res, next) => {
            try {
                const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
                const currentUserId = req.user.id;

                if (resourceUserId && parseInt(resourceUserId) !== currentUserId) {
                    return res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para acceder a este recurso'
                    });
                }

                next();
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Error verificando permisos'
                });
            }
        };
    }

    // Refrescar token
    static async refreshToken(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Token requerido para refrescar'
                });
            }

            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'mindcare_default_secret_change_in_production',
                { ignoreExpiration: true } // Permitir tokens expirados para refresh
            );

            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no válido'
                });
            }

            const newToken = AuthMiddleware.generateToken(user);

            res.json({
                success: true,
                data: {
                    token: newToken,
                    user: user.toSafeObject()
                }
            });

        } catch (error) {
            console.error('Error refrescando token:', error.message);
            
            res.status(401).json({
                success: false,
                error: 'Token inválido para refrescar'
            });
        }
    }
}

module.exports = AuthMiddleware;