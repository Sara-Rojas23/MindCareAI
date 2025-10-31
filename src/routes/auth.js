const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)

// Registro de usuario
router.post('/register', 
    AuthController.getRegisterValidation(),
    AuthController.register
);

// Inicio de sesión
router.post('/login', 
    AuthController.getLoginValidation(),
    AuthController.login
);

// Refrescar token
router.post('/refresh-token', AuthMiddleware.refreshToken);

// Verificar token (para validación desde frontend)
router.get('/verify', 
    AuthMiddleware.authenticate,
    AuthController.verifyToken
);

// Rutas protegidas (requieren autenticación)

// Obtener perfil del usuario actual
router.get('/profile', 
    AuthMiddleware.authenticate,
    AuthController.getProfile
);

// Actualizar perfil
router.put('/profile', 
    AuthMiddleware.authenticate,
    AuthController.updateProfile
);

// Cambiar contraseña
router.put('/change-password', 
    AuthMiddleware.authenticate,
    AuthController.changePassword
);

// Cerrar sesión
router.post('/logout', 
    AuthMiddleware.authenticate,
    AuthController.logout
);

// Eliminar cuenta
router.delete('/account', 
    AuthMiddleware.authenticate,
    AuthController.deleteAccount
);

module.exports = router;