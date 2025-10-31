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

            // Verificar si el usuario está bloqueado
            const estaBloqueado = await this.isUserLocked(email);
            if (estaBloqueado) {
                const tiempoRestante = await this.getRemainingLockTime(email);
                throw new Error(`Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${tiempoRestante} segundos.`);
            }

            const user = await this.findByEmail(email);
            if (!user) {
                throw new Error('Credenciales inválidas');
            }

            const esPasswordValido = await bcrypt.compare(password, user.password);
            if (!esPasswordValido) {
                // Obtener intentos actuales y sumar 1
                const intentos = await this.getFailedAttempts(email) + 1;
                
                // Incrementar contador en la base de datos
                await this.incrementFailedAttempts(email);
                
                // Si llegó a 3 intentos, bloquear
                if (intentos >= 3) {
                    throw new Error('Demasiados intentos fallidos. Cuenta bloqueada por 30 segundos.');
                }
                
                // Mostrar advertencia según intentos restantes
                const restantes = 3 - intentos;
                if (restantes === 2) {
                    throw new Error('Credenciales inválidas. Te quedan 2 intentos antes de que tu cuenta se bloquee por 30 segundos.');
                } else if (restantes === 1) {
                    throw new Error('Credenciales inválidas. Te queda 1 intento antes de que tu cuenta se bloquee por 30 segundos.');
                }
                
                throw new Error('Credenciales inválidas');
            }

            // Login exitoso - resetear intentos fallidos
            await this.resetFailedAttempts(email);

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

    // Verificar si el usuario está bloqueado
    static async isUserLocked(email) {
        try {
            const sql = 'SELECT locked_until FROM users WHERE email = ?';
            const usuario = await database.get(sql, [email]);
            
            if (!usuario || !usuario.locked_until) {
                return false;
            }

            const ahora = Date.now();
            const tiempoBloqueo = parseInt(usuario.locked_until);

            // Si ya pasó el tiempo de bloqueo, desbloquear
            if (ahora >= tiempoBloqueo) {
                await this.resetFailedAttempts(email);
                return false;
            }

            return true;
        } catch (error) {
            throw new Error(`Error al verificar bloqueo: ${error.message}`);
        }
    }

    // Obtener número de intentos fallidos actuales
    static async getFailedAttempts(email) {
        try {
            const sql = 'SELECT failed_attempts FROM users WHERE email = ?';
            const usuario = await database.get(sql, [email]);
            return usuario ? (usuario.failed_attempts || 0) : 0;
        } catch (error) {
            throw new Error(`Error al obtener intentos fallidos: ${error.message}`);
        }
    }

    // Incrementar intentos fallidos
    static async incrementFailedAttempts(email) {
        try {
            const tiempoBloqueo = Date.now() + (30 * 1000); // 30 segundos
            
            const sql = `
                UPDATE users 
                SET failed_attempts = failed_attempts + 1,
                    locked_until = CASE 
                        WHEN failed_attempts + 1 >= 3 
                        THEN ?
                        ELSE locked_until 
                    END
                WHERE email = ?
            `;
            await database.run(sql, [tiempoBloqueo, email]);
        } catch (error) {
            throw new Error(`Error al incrementar intentos fallidos: ${error.message}`);
        }
    }

    // Resetear intentos fallidos
    static async resetFailedAttempts(email) {
        try {
            const sql = 'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = ?';
            await database.run(sql, [email]);
        } catch (error) {
            throw new Error(`Error al resetear intentos: ${error.message}`);
        }
    }

    // Obtener segundos restantes de bloqueo
    static async getRemainingLockTime(email) {
        try {
            const sql = 'SELECT locked_until FROM users WHERE email = ?';
            const usuario = await database.get(sql, [email]);
            
            if (!usuario || !usuario.locked_until) {
                return 0;
            }

            const diferencia = parseInt(usuario.locked_until) - Date.now();
            return diferencia > 0 ? Math.ceil(diferencia / 1000) : 0;
        } catch (error) {
            throw new Error(`Error al obtener tiempo de bloqueo: ${error.message}`);
        }
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