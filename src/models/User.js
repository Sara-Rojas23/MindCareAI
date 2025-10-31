const bcrypt = require('bcryptjs');
const database = require('./database');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // Crear un nuevo usuario
    static async create(userData) {
        try {
            const { name, email, password } = userData;

            // Validaciones básicas
            if (!name || !email || !password) {
                throw new Error('Nombre, email y contraseña son requeridos');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('El formato del email no es válido');
            }

            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            // Verificar si el usuario ya existe
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('Ya existe un usuario con este email');
            }

            // Hashear la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insertar usuario en la base de datos
            const sql = `
                INSERT INTO users (name, email, password)
                VALUES (?, ?, ?)
            `;

            const result = await database.run(sql, [name, email, hashedPassword]);
            
            // Retornar el usuario creado (sin la contraseña)
            const newUser = await this.findById(result.id);
            delete newUser.password;

            return newUser;

        } catch (error) {
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM users WHERE id = ?';
            const user = await database.get(sql, [id]);
            
            return user ? new User(user) : null;
        } catch (error) {
            throw new Error(`Error al buscar usuario por ID: ${error.message}`);
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        try {
            const sql = 'SELECT * FROM users WHERE email = ?';
            const user = await database.get(sql, [email]);
            
            return user ? new User(user) : null;
        } catch (error) {
            throw new Error(`Error al buscar usuario por email: ${error.message}`);
        }
    }

    // Verificar credenciales para login
    static async authenticate(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }

            const user = await this.findByEmail(email);
            if (!user) {
                throw new Error('Credenciales inválidas');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Credenciales inválidas');
            }

            // Retornar usuario sin contraseña
            delete user.password;
            return user;

        } catch (error) {
            throw new Error(`Error en autenticación: ${error.message}`);
        }
    }

    // Actualizar información del usuario
    static async update(id, userData) {
        try {
            const { name, email } = userData;
            
            const sql = `
                UPDATE users 
                SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await database.run(sql, [name, email, id]);
            
            const updatedUser = await this.findById(id);
            delete updatedUser.password;
            
            return updatedUser;

        } catch (error) {
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
    }

    // Cambiar contraseña
    static async changePassword(id, currentPassword, newPassword) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('La contraseña actual es incorrecta');
            }

            if (newPassword.length < 6) {
                throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
            }

            // Hashear nueva contraseña
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            const sql = `
                UPDATE users 
                SET password = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await database.run(sql, [hashedNewPassword, id]);
            
            return { message: 'Contraseña actualizada exitosamente' };

        } catch (error) {
            throw new Error(`Error al cambiar contraseña: ${error.message}`);
        }
    }

    // Eliminar usuario
    static async delete(id) {
        try {
            const sql = 'DELETE FROM users WHERE id = ?';
            const result = await database.run(sql, [id]);
            
            if (result.changes === 0) {
                throw new Error('Usuario no encontrado');
            }

            return { message: 'Usuario eliminado exitosamente' };

        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }

    // Obtener estadísticas del usuario
    static async getUserStats(id) {
        try {
            const emotionEntriesCount = await database.get(
                'SELECT COUNT(*) as count FROM emotion_entries WHERE user_id = ?',
                [id]
            );

            const latestEntry = await database.get(
                'SELECT created_at FROM emotion_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
                [id]
            );

            return {
                totalEmotionEntries: emotionEntriesCount.count,
                lastAnalysis: latestEntry ? latestEntry.created_at : null,
                memberSince: (await this.findById(id)).created_at
            };

        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // Validar formato de email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Método de instancia para obtener datos seguros del usuario
    toSafeObject() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = User;