const database = require('./database');

class Habit {
    constructor(habitData) {
        this.id = habitData.id;
        this.user_id = habitData.user_id;
        this.name = habitData.name;
        this.description = habitData.description;
        this.category = habitData.category;
        this.frequency = habitData.frequency;
        this.icon = habitData.icon;
        this.color = habitData.color;
        this.is_active = habitData.is_active;
        this.streak = habitData.streak;
        this.best_streak = habitData.best_streak;
        this.created_at = habitData.created_at;
        this.updated_at = habitData.updated_at;
    }

    // Categorías válidas de hábitos
    static CATEGORIES = {
        MENTAL: 'mental',
        FISICO: 'fisico',
        DESCANSO: 'descanso',
        PERSONAL: 'personal',
        NUTRICION: 'nutricion'
    };

    // Frecuencias válidas
    static FREQUENCIES = {
        DIARIA: 'diaria',
        SEMANAL: 'semanal',
        PERSONALIZADA: 'personalizada'
    };

    // Crear un nuevo hábito
    static async create(habitData) {
        try {
            const { 
                user_id, 
                name, 
                description = '', 
                category = this.CATEGORIES.PERSONAL,
                frequency = this.FREQUENCIES.DIARIA,
                icon = '⭐',
                color = '#6366f1'
            } = habitData;

            // Validaciones básicas
            if (!user_id || !name) {
                throw new Error('El ID de usuario y el nombre del hábito son requeridos');
            }

            if (name.trim().length < 2) {
                throw new Error('El nombre del hábito debe tener al menos 2 caracteres');
            }

            if (name.length > 100) {
                throw new Error('El nombre del hábito no puede exceder 100 caracteres');
            }

            // Validar categoría
            const validCategories = Object.values(this.CATEGORIES);
            if (!validCategories.includes(category)) {
                throw new Error(`Categoría inválida. Debe ser una de: ${validCategories.join(', ')}`);
            }

            // Validar frecuencia
            const validFrequencies = Object.values(this.FREQUENCIES);
            if (!validFrequencies.includes(frequency)) {
                throw new Error(`Frecuencia inválida. Debe ser una de: ${validFrequencies.join(', ')}`);
            }

            // Validar color (formato hexadecimal)
            const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!colorRegex.test(color)) {
                throw new Error('El color debe estar en formato hexadecimal (#RRGGBB)');
            }

            // Insertar hábito en la base de datos
            const sql = `
                INSERT INTO habits (
                    user_id, name, description, category, 
                    frequency, icon, color, is_active, 
                    streak, best_streak
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0)
            `;

            const result = await database.run(sql, [
                user_id,
                name.trim(),
                description.trim(),
                category,
                frequency,
                icon,
                color
            ]);

            // Retornar el hábito creado
            const nuevoHabito = await this.findById(result.id);
            return nuevoHabito;

        } catch (error) {
            throw new Error(`Error al crear hábito: ${error.message}`);
        }
    }

    // Buscar hábito por ID
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM habits WHERE id = ?';
            const habito = await database.get(sql, [id]);
            
            return habito ? new Habit(habito) : null;
        } catch (error) {
            throw new Error(`Error al buscar hábito por ID: ${error.message}`);
        }
    }

    // Obtener todos los hábitos de un usuario
    static async findByUserId(userId, includeInactive = false) {
        try {
            let sql = 'SELECT * FROM habits WHERE user_id = ?';
            const params = [userId];

            // Si no se quieren incluir los inactivos, filtrar
            if (!includeInactive) {
                sql += ' AND is_active = 1';
            }

            sql += ' ORDER BY created_at DESC';

            const habitos = await database.all(sql, params);
            return habitos.map(h => new Habit(h));

        } catch (error) {
            throw new Error(`Error al obtener hábitos del usuario: ${error.message}`);
        }
    }

    // Obtener hábitos por categoría
    static async findByCategory(userId, category) {
        try {
            const sql = `
                SELECT * FROM habits 
                WHERE user_id = ? AND category = ? AND is_active = 1
                ORDER BY created_at DESC
            `;

            const habitos = await database.all(sql, [userId, category]);
            return habitos.map(h => new Habit(h));

        } catch (error) {
            throw new Error(`Error al obtener hábitos por categoría: ${error.message}`);
        }
    }

    // Actualizar un hábito
    static async update(id, habitData) {
        try {
            const habitoExistente = await this.findById(id);
            if (!habitoExistente) {
                throw new Error('Hábito no encontrado');
            }

            const { 
                name, 
                description, 
                category, 
                frequency, 
                icon, 
                color 
            } = habitData;

            // Validar solo los campos que se están actualizando
            if (name !== undefined) {
                if (name.trim().length < 2) {
                    throw new Error('El nombre del hábito debe tener al menos 2 caracteres');
                }
                if (name.length > 100) {
                    throw new Error('El nombre del hábito no puede exceder 100 caracteres');
                }
            }

            if (category !== undefined) {
                const validCategories = Object.values(this.CATEGORIES);
                if (!validCategories.includes(category)) {
                    throw new Error(`Categoría inválida. Debe ser una de: ${validCategories.join(', ')}`);
                }
            }

            if (frequency !== undefined) {
                const validFrequencies = Object.values(this.FREQUENCIES);
                if (!validFrequencies.includes(frequency)) {
                    throw new Error(`Frecuencia inválida. Debe ser una de: ${validFrequencies.join(', ')}`);
                }
            }

            if (color !== undefined) {
                const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                if (!colorRegex.test(color)) {
                    throw new Error('El color debe estar en formato hexadecimal (#RRGGBB)');
                }
            }

            // Construir SQL dinámicamente solo con los campos proporcionados
            const camposActualizar = [];
            const valores = [];

            if (name !== undefined) {
                camposActualizar.push('name = ?');
                valores.push(name.trim());
            }
            if (description !== undefined) {
                camposActualizar.push('description = ?');
                valores.push(description.trim());
            }
            if (category !== undefined) {
                camposActualizar.push('category = ?');
                valores.push(category);
            }
            if (frequency !== undefined) {
                camposActualizar.push('frequency = ?');
                valores.push(frequency);
            }
            if (icon !== undefined) {
                camposActualizar.push('icon = ?');
                valores.push(icon);
            }
            if (color !== undefined) {
                camposActualizar.push('color = ?');
                valores.push(color);
            }

            // Siempre actualizar updated_at
            camposActualizar.push('updated_at = CURRENT_TIMESTAMP');

            if (camposActualizar.length === 1) { // Solo updated_at
                throw new Error('No se proporcionaron campos para actualizar');
            }

            valores.push(id);

            const sql = `
                UPDATE habits 
                SET ${camposActualizar.join(', ')}
                WHERE id = ?
            `;

            await database.run(sql, valores);

            // Retornar el hábito actualizado
            const habitoActualizado = await this.findById(id);
            return habitoActualizado;

        } catch (error) {
            throw new Error(`Error al actualizar hábito: ${error.message}`);
        }
    }

    // Activar o desactivar un hábito (pausar)
    static async toggleActive(id, isActive) {
        try {
            const habitoExistente = await this.findById(id);
            if (!habitoExistente) {
                throw new Error('Hábito no encontrado');
            }

            const sql = `
                UPDATE habits 
                SET is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await database.run(sql, [isActive ? 1 : 0, id]);

            const habitoActualizado = await this.findById(id);
            return habitoActualizado;

        } catch (error) {
            throw new Error(`Error al cambiar estado del hábito: ${error.message}`);
        }
    }

    // Eliminar un hábito (soft delete - solo desactivar)
    static async softDelete(id) {
        try {
            return await this.toggleActive(id, false);
        } catch (error) {
            throw new Error(`Error al desactivar hábito: ${error.message}`);
        }
    }

    // Eliminar un hábito permanentemente
    static async delete(id) {
        try {
            const habitoExistente = await this.findById(id);
            if (!habitoExistente) {
                throw new Error('Hábito no encontrado');
            }

            // Primero eliminar todas las entradas relacionadas
            await database.run('DELETE FROM habit_entries WHERE habit_id = ?', [id]);

            // Luego eliminar el hábito
            const sql = 'DELETE FROM habits WHERE id = ?';
            const resultado = await database.run(sql, [id]);

            if (resultado.changes === 0) {
                throw new Error('No se pudo eliminar el hábito');
            }

            return { 
                message: 'Hábito eliminado exitosamente',
                deletedId: id
            };

        } catch (error) {
            throw new Error(`Error al eliminar hábito: ${error.message}`);
        }
    }

    // Actualizar racha del hábito
    static async updateStreak(id, nuevaRacha) {
        try {
            const habito = await this.findById(id);
            if (!habito) {
                throw new Error('Hábito no encontrado');
            }

            // Si la nueva racha es mayor que la mejor racha, actualizar ambas
            const mejorRacha = nuevaRacha > habito.best_streak ? nuevaRacha : habito.best_streak;

            const sql = `
                UPDATE habits 
                SET streak = ?, best_streak = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await database.run(sql, [nuevaRacha, mejorRacha, id]);

            return await this.findById(id);

        } catch (error) {
            throw new Error(`Error al actualizar racha: ${error.message}`);
        }
    }

    // Obtener estadísticas de un hábito
    static async getStats(id) {
        try {
            const habito = await this.findById(id);
            if (!habito) {
                throw new Error('Hábito no encontrado');
            }

            // Contar total de completaciones
            const totalCompletado = await database.get(
                'SELECT COUNT(*) as total FROM habit_entries WHERE habit_id = ? AND completed = 1',
                [id]
            );

            // Última vez completado
            const ultimaVez = await database.get(
                'SELECT date, completion_time FROM habit_entries WHERE habit_id = ? AND completed = 1 ORDER BY date DESC LIMIT 1',
                [id]
            );

            // Completaciones este mes
            const esteMes = await database.get(
                `SELECT COUNT(*) as total FROM habit_entries 
                WHERE habit_id = ? AND completed = 1 
                AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`,
                [id]
            );

            return {
                habitId: id,
                nombreHabito: habito.name,
                rachaActual: habito.streak,
                mejorRacha: habito.best_streak,
                totalCompletado: totalCompletado.total,
                completadosEsteMes: esteMes.total,
                ultimaVezCompletado: ultimaVez ? {
                    fecha: ultimaVez.date,
                    hora: ultimaVez.completion_time
                } : null
            };

        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // Contar hábitos activos de un usuario
    static async countActiveHabits(userId) {
        try {
            const resultado = await database.get(
                'SELECT COUNT(*) as total FROM habits WHERE user_id = ? AND is_active = 1',
                [userId]
            );

            return resultado.total;

        } catch (error) {
            throw new Error(`Error al contar hábitos activos: ${error.message}`);
        }
    }

    // Método de instancia para obtener datos seguros del hábito
    toSafeObject() {
        return {
            id: this.id,
            user_id: this.user_id,
            name: this.name,
            description: this.description,
            category: this.category,
            frequency: this.frequency,
            icon: this.icon,
            color: this.color,
            is_active: this.is_active,
            streak: this.streak,
            best_streak: this.best_streak,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Habit;
