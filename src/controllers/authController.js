const User = require('../models/User');
const AuthMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

class AuthController {

    // Validaciones para registro
    static getRegisterValidation() {
        return [
            body('name')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
            
            body('email')
                .isEmail()
                .withMessage('Debe ser un email válido')
                .normalizeEmail(),
            
            body('password')
                .isLength({ min: 6, max: 100 })
                .withMessage('La contraseña debe tener entre 6 y 100 caracteres')
        ];
    }

    // Validaciones para login
    static getLoginValidation() {
        return [
            body('email')
                .isEmail()
                .withMessage('Debe ser un email válido')
                .normalizeEmail(),
            
            body('password')
                .notEmpty()
                .withMessage('La contraseña es requerida')
        ];
    }

    // Registro de usuario
    static async register(req, res) {
        try {
            // Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de entrada inválidos',
                    details: errors.array()
                });
            }

            const { name, email, password } = req.body;

            // Crear usuario
            const newUser = await User.create({ name, email, password });

            // Generar token JWT
            const token = AuthMiddleware.generateToken(newUser);

            console.log(`✅ Nuevo usuario registrado: ${newUser.email}`);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    user: newUser,
                    token: token
                }
            });

        } catch (error) {
            console.error('❌ Error en registro:', error.message);
            
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Inicio de sesión
    static async login(req, res) {
        try {
            // Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de entrada inválidos',
                    details: errors.array()
                });
            }

            const { email, password } = req.body;

            // Autenticar usuario
            const user = await User.authenticate(email, password);

            // Generar token JWT
            const token = AuthMiddleware.generateToken(user);

            // Obtener estadísticas del usuario
            const userStats = await User.getUserStats(user.id);

            console.log(`✅ Usuario inició sesión: ${user.email}`);

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    user: user,
                    token: token,
                    stats: userStats
                }
            });

        } catch (error) {
            console.error('❌ Error en login:', error.message);
            
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    // Obtener perfil del usuario actual
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            
            // Obtener información completa del usuario
            const user = await User.findById(userId);
            const userStats = await User.getUserStats(userId);

            res.json({
                success: true,
                data: {
                    user: user.toSafeObject(),
                    stats: userStats
                }
            });

        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // Actualizar perfil
    static async updateProfile(req, res) {
        try {
            // Validaciones básicas
            const { name, email } = req.body;

            if (!name || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre debe tener al menos 2 caracteres'
                });
            }

            if (!User.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'El formato del email no es válido'
                });
            }

            const userId = req.user.id;

            // Verificar si el nuevo email ya existe (excepto el usuario actual)
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe un usuario con este email'
                });
            }

            const updatedUser = await User.update(userId, { name, email });

            console.log(`✅ Usuario actualizado: ${updatedUser.email}`);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    user: updatedUser
                }
            });

        } catch (error) {
            console.error('❌ Error actualizando perfil:', error.message);
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Cambiar contraseña
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Validaciones
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos de contraseña son requeridos'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Las nuevas contraseñas no coinciden'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            const userId = req.user.id;
            await User.changePassword(userId, currentPassword, newPassword);

            console.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error.message);
            
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Cerrar sesión (opcional - principalmente para logging)
    static async logout(req, res) {
        try {
            console.log(`📝 Usuario cerró sesión: ${req.user.email}`);

            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error cerrando sesión'
            });
        }
    }

    // Eliminar cuenta
    static async deleteAccount(req, res) {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña requerida para eliminar la cuenta'
                });
            }

            // Verificar contraseña antes de eliminar
            const user = await User.findById(req.user.id);
            await User.authenticate(user.email, password);

            // Eliminar usuario (esto también eliminará sus datos relacionados por CASCADE)
            await User.delete(req.user.id);

            console.log(`🗑️ Usuario eliminado: ${user.email}`);

            res.json({
                success: true,
                message: 'Cuenta eliminada exitosamente'
            });

        } catch (error) {
            console.error('❌ Error eliminando cuenta:', error.message);
            
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Verificar token (para validar autenticación desde frontend)
    static async verifyToken(req, res) {
        try {
            // El middleware de auth ya verificó el token y agregó req.user
            const user = req.user;

            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        createdAt: user.created_at
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error verificando token:', error.message);
            
            res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
    }
}

module.exports = AuthController;