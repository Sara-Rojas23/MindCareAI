const database = require('./database');
const Habit = require('./Habit');

class HabitEntry {
    constructor(entryData) {
        this.id = entryData.id;
        this.user_id = entryData.user_id;
        this.habit_id = entryData.habit_id;
        this.completed = entryData.completed;
        this.date = entryData.date;
        this.completion_time = entryData.completion_time;
        this.mood_after = entryData.mood_after;
        this.notes = entryData.notes;
        this.created_at = entryData.created_at;
    }

    // Marcar un hábito como completado para hoy
    static async markAsCompleted(userId, habitId, completionData = {}) {
        try {
            const { 
                mood_after = null, 
                notes = null 
            } = completionData;

            // Verificar que el hábito existe y pertenece al usuario
            const habito = await Habit.findById(habitId);
            if (!habito) {
                throw new Error('Hábito no encontrado');
            }

            if (habito.user_id !== userId) {
                throw new Error('Este hábito no pertenece al usuario');
            }

            if (!habito.is_active) {
                throw new Error('No puedes completar un hábito pausado');
            }

            // Obtener fecha actual (solo fecha, sin hora)
            const fechaHoy = new Date().toISOString().split('T')[0];
            const horaActual = new Date().toLocaleTimeString('es-ES', { hour12: false });

            // Verificar si ya existe una entrada para hoy
            const entradaExistente = await database.get(
                'SELECT * FROM habit_entries WHERE user_id = ? AND habit_id = ? AND date = ?',
                [userId, habitId, fechaHoy]
            );

            let resultado;

            if (entradaExistente) {
                // Actualizar entrada existente
                const sql = `
                    UPDATE habit_entries 
                    SET completed = 1, 
                        completion_time = ?,
                        mood_after = ?,
                        notes = ?
                    WHERE id = ?
                `;
                await database.run(sql, [horaActual, mood_after, notes, entradaExistente.id]);
                resultado = await this.findById(entradaExistente.id);
            } else {
                // Crear nueva entrada
                const sql = `
                    INSERT INTO habit_entries (
                        user_id, habit_id, completed, date, 
                        completion_time, mood_after, notes
                    )
                    VALUES (?, ?, 1, ?, ?, ?, ?)
                `;
                const insertResult = await database.run(sql, [
                    userId, habitId, fechaHoy, horaActual, mood_after, notes
                ]);
                resultado = await this.findById(insertResult.id);
            }

            // Actualizar la racha del hábito
            await this.updateHabitStreak(habitId);

            return resultado;

        } catch (error) {
            throw new Error(`Error al marcar hábito como completado: ${error.message}`);
        }
    }

    // Desmarcar un hábito (marcar como no completado)
    static async markAsIncomplete(userId, habitId, date = null) {
        try {
            const fecha = date || new Date().toISOString().split('T')[0];

            // Verificar que el hábito pertenece al usuario
            const habito = await Habit.findById(habitId);
            if (!habito || habito.user_id !== userId) {
                throw new Error('Hábito no encontrado o no pertenece al usuario');
            }

            const sql = `
                UPDATE habit_entries 
                SET completed = 0, 
                    completion_time = NULL,
                    mood_after = NULL
                WHERE user_id = ? AND habit_id = ? AND date = ?
            `;

            await database.run(sql, [userId, habitId, fecha]);

            // Recalcular la racha
            await this.updateHabitStreak(habitId);

            return { 
                message: 'Hábito marcado como no completado',
                date: fecha
            };

        } catch (error) {
            throw new Error(`Error al desmarcar hábito: ${error.message}`);
        }
    }

    // Buscar entrada por ID
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM habit_entries WHERE id = ?';
            const entrada = await database.get(sql, [id]);
            
            return entrada ? new HabitEntry(entrada) : null;
        } catch (error) {
            throw new Error(`Error al buscar entrada por ID: ${error.message}`);
        }
    }

    // Obtener entradas de hábitos para hoy
    static async getTodayEntries(userId) {
        try {
            const fechaHoy = new Date().toISOString().split('T')[0];

            const sql = `
                SELECT 
                    h.id as habit_id,
                    h.name,
                    h.description,
                    h.category,
                    h.icon,
                    h.color,
                    h.frequency,
                    h.streak,
                    he.id as entry_id,
                    he.completed,
                    he.completion_time,
                    he.mood_after,
                    he.notes
                FROM habits h
                LEFT JOIN habit_entries he ON h.id = he.habit_id AND he.date = ?
                WHERE h.user_id = ? AND h.is_active = 1
                ORDER BY h.created_at ASC
            `;

            const resultados = await database.all(sql, [fechaHoy, userId]);

            return resultados.map(r => ({
                habitId: r.habit_id,
                nombre: r.name,
                descripcion: r.description,
                categoria: r.category,
                icono: r.icon,
                color: r.color,
                frecuencia: r.frequency,
                racha: r.streak,
                entryId: r.entry_id,
                completado: r.completed === 1,
                horaCompletado: r.completion_time,
                estadoAnimo: r.mood_after,
                notas: r.notes
            }));

        } catch (error) {
            throw new Error(`Error al obtener entradas de hoy: ${error.message}`);
        }
    }

    // Obtener progreso semanal de un hábito
    static async getWeekProgress(habitId, userId) {
        try {
            // Verificar que el hábito pertenece al usuario
            const habito = await Habit.findById(habitId);
            if (!habito || habito.user_id !== userId) {
                throw new Error('Hábito no encontrado o no pertenece al usuario');
            }

            // Obtener fecha de hace 7 días
            const hoy = new Date();
            const hace7Dias = new Date(hoy);
            hace7Dias.setDate(hoy.getDate() - 6); // Últimos 7 días incluyendo hoy

            const sql = `
                SELECT date, completed, completion_time, mood_after
                FROM habit_entries
                WHERE habit_id = ? 
                  AND date >= ?
                  AND date <= ?
                ORDER BY date ASC
            `;

            const fechaInicio = hace7Dias.toISOString().split('T')[0];
            const fechaFin = hoy.toISOString().split('T')[0];

            const entradas = await database.all(sql, [habitId, fechaInicio, fechaFin]);

            // Crear array con los últimos 7 días
            const progreso = [];
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date(hoy);
                fecha.setDate(hoy.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                
                const entrada = entradas.find(e => e.date === fechaStr);
                
                progreso.push({
                    fecha: fechaStr,
                    diaSemana: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
                    completado: entrada ? entrada.completed === 1 : false,
                    horaCompletado: entrada ? entrada.completion_time : null,
                    estadoAnimo: entrada ? entrada.mood_after : null
                });
            }

            // Calcular estadísticas de la semana
            const completados = progreso.filter(p => p.completado).length;
            const porcentaje = Math.round((completados / 7) * 100);

            return {
                habitId: habitId,
                nombreHabito: habito.name,
                progreso: progreso,
                estadisticas: {
                    completados: completados,
                    total: 7,
                    porcentaje: porcentaje
                }
            };

        } catch (error) {
            throw new Error(`Error al obtener progreso semanal: ${error.message}`);
        }
    }

    // Obtener progreso mensual de un hábito
    static async getMonthProgress(habitId, userId) {
        try {
            const habito = await Habit.findById(habitId);
            if (!habito || habito.user_id !== userId) {
                throw new Error('Hábito no encontrado o no pertenece al usuario');
            }

            const hoy = new Date();
            const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            
            const sql = `
                SELECT date, completed
                FROM habit_entries
                WHERE habit_id = ? 
                  AND date >= ?
                  AND date <= ?
                ORDER BY date ASC
            `;

            const fechaInicio = primerDiaMes.toISOString().split('T')[0];
            const fechaFin = hoy.toISOString().split('T')[0];

            const entradas = await database.all(sql, [habitId, fechaInicio, fechaFin]);
            const completados = entradas.filter(e => e.completed === 1).length;
            const diasTranscurridos = hoy.getDate();
            const porcentaje = Math.round((completados / diasTranscurridos) * 100);

            return {
                habitId: habitId,
                nombreHabito: habito.name,
                mes: hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
                completados: completados,
                diasTranscurridos: diasTranscurridos,
                porcentaje: porcentaje
            };

        } catch (error) {
            throw new Error(`Error al obtener progreso mensual: ${error.message}`);
        }
    }

    // Calcular y actualizar la racha de un hábito
    static async updateHabitStreak(habitId) {
        try {
            const sql = `
                SELECT date, completed
                FROM habit_entries
                WHERE habit_id = ?
                ORDER BY date DESC
            `;

            const entradas = await database.all(sql, [habitId]);
            
            let rachaActual = 0;
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            // Verificar desde hoy hacia atrás
            for (let i = 0; i < entradas.length; i++) {
                const fechaEntrada = new Date(entradas[i].date + 'T00:00:00');
                const diasDiferencia = Math.floor((hoy - fechaEntrada) / (1000 * 60 * 60 * 24));

                // Si la entrada es de hoy o del día que corresponde a la racha
                if (diasDiferencia === i && entradas[i].completed === 1) {
                    rachaActual++;
                } else {
                    break; // Se rompió la racha
                }
            }

            // Actualizar racha en la tabla habits
            await Habit.updateStreak(habitId, rachaActual);

            return rachaActual;

        } catch (error) {
            throw new Error(`Error al calcular racha: ${error.message}`);
        }
    }

    // Obtener racha actual de un hábito
    static async getStreakForHabit(habitId, userId) {
        try {
            const habito = await Habit.findById(habitId);
            if (!habito || habito.user_id !== userId) {
                throw new Error('Hábito no encontrado o no pertenece al usuario');
            }

            return {
                habitId: habitId,
                nombreHabito: habito.name,
                rachaActual: habito.streak,
                mejorRacha: habito.best_streak
            };

        } catch (error) {
            throw new Error(`Error al obtener racha: ${error.message}`);
        }
    }

    // Obtener historial completo de un hábito
    static async getHistory(habitId, userId, limit = 30) {
        try {
            const habito = await Habit.findById(habitId);
            if (!habito || habito.user_id !== userId) {
                throw new Error('Hábito no encontrado o no pertenece al usuario');
            }

            const sql = `
                SELECT *
                FROM habit_entries
                WHERE habit_id = ? AND user_id = ?
                ORDER BY date DESC
                LIMIT ?
            `;

            const entradas = await database.all(sql, [habitId, userId, limit]);

            return {
                habitId: habitId,
                nombreHabito: habito.name,
                totalEntradas: entradas.length,
                entradas: entradas.map(e => new HabitEntry(e))
            };

        } catch (error) {
            throw new Error(`Error al obtener historial: ${error.message}`);
        }
    }

    // Obtener estadísticas generales del usuario
    static async getUserStats(userId) {
        try {
            const fechaHoy = new Date().toISOString().split('T')[0];

            // Total de hábitos activos
            const totalHabitos = await Habit.countActiveHabits(userId);

            // Hábitos completados hoy
            const completadosHoy = await database.get(
                `SELECT COUNT(*) as total 
                FROM habit_entries 
                WHERE user_id = ? AND date = ? AND completed = 1`,
                [userId, fechaHoy]
            );

            // Mejor racha general
            const mejorRacha = await database.get(
                `SELECT MAX(best_streak) as mejor 
                FROM habits 
                WHERE user_id = ? AND is_active = 1`,
                [userId]
            );

            // Total de completaciones este mes
            const primerDiaMes = new Date();
            primerDiaMes.setDate(1);
            const fechaInicio = primerDiaMes.toISOString().split('T')[0];

            const completadosMes = await database.get(
                `SELECT COUNT(*) as total 
                FROM habit_entries 
                WHERE user_id = ? AND date >= ? AND completed = 1`,
                [userId, fechaInicio]
            );

            // Calcular porcentaje de hoy
            const porcentajeHoy = totalHabitos > 0 
                ? Math.round((completadosHoy.total / totalHabitos) * 100)
                : 0;

            return {
                habitosActivos: totalHabitos,
                completadosHoy: completadosHoy.total,
                porcentajeHoy: porcentajeHoy,
                mejorRacha: mejorRacha.mejor || 0,
                completadosEsteMes: completadosMes.total
            };

        } catch (error) {
            throw new Error(`Error al obtener estadísticas del usuario: ${error.message}`);
        }
    }

    // Obtener resumen semanal del usuario (todos los hábitos)
    static async getWeeklySummary(userId) {
        try {
            const hoy = new Date();
            const hace7Dias = new Date(hoy);
            hace7Dias.setDate(hoy.getDate() - 6);

            const fechaInicio = hace7Dias.toISOString().split('T')[0];
            const fechaFin = hoy.toISOString().split('T')[0];

            const sql = `
                SELECT 
                    h.id as habit_id,
                    h.name,
                    h.icon,
                    h.color,
                    COUNT(CASE WHEN he.completed = 1 THEN 1 END) as completados,
                    h.streak
                FROM habits h
                LEFT JOIN habit_entries he ON h.id = he.habit_id 
                    AND he.date >= ? AND he.date <= ?
                WHERE h.user_id = ? AND h.is_active = 1
                GROUP BY h.id
                ORDER BY completados DESC, h.name ASC
            `;

            const resultados = await database.all(sql, [fechaInicio, fechaFin, userId]);

            const totalPosible = resultados.length * 7;
            const totalCompletado = resultados.reduce((sum, r) => sum + r.completados, 0);
            const porcentaje = totalPosible > 0 
                ? Math.round((totalCompletado / totalPosible) * 100)
                : 0;

            return {
                semana: `${hace7Dias.toLocaleDateString('es-ES')} - ${hoy.toLocaleDateString('es-ES')}`,
                habitos: resultados.map(r => ({
                    habitId: r.habit_id,
                    nombre: r.name,
                    icono: r.icon,
                    color: r.color,
                    completados: r.completados,
                    total: 7,
                    porcentaje: Math.round((r.completados / 7) * 100),
                    racha: r.streak
                })),
                resumen: {
                    totalCompletado: totalCompletado,
                    totalPosible: totalPosible,
                    porcentaje: porcentaje
                }
            };

        } catch (error) {
            throw new Error(`Error al obtener resumen semanal: ${error.message}`);
        }
    }

    // Método de instancia para obtener datos seguros
    toSafeObject() {
        return {
            id: this.id,
            user_id: this.user_id,
            habit_id: this.habit_id,
            completed: this.completed,
            date: this.date,
            completion_time: this.completion_time,
            mood_after: this.mood_after,
            notes: this.notes,
            created_at: this.created_at
        };
    }
}

module.exports = HabitEntry;
