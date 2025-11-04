const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const AuthMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// ==========================================
// RUTAS DE HÁBITOS
// ==========================================

// Obtener todos los hábitos del usuario
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const includeInactive = req.query.includeInactive === 'true';

        const habitos = await Habit.findByUserId(userId, includeInactive);

        res.json({
            success: true,
            total: habitos.length,
            habits: habitos.map(h => h.toSafeObject())
        });

    } catch (error) {
        console.error('❌ Error al obtener hábitos:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener hábitos',
            message: error.message
        });
    }
});

// Obtener hábitos por categoría
router.get('/category/:category', async (req, res) => {
    try {
        const userId = req.user.id;
        const { category } = req.params;

        // Validar categoría
        const validCategories = Object.values(Habit.CATEGORIES);
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Categoría inválida',
                validCategories: validCategories
            });
        }

        const habitos = await Habit.findByCategory(userId, category);

        res.json({
            success: true,
            category: category,
            total: habitos.length,
            habits: habitos.map(h => h.toSafeObject())
        });

    } catch (error) {
        console.error('❌ Error al obtener hábitos por categoría:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener hábitos por categoría',
            message: error.message
        });
    }
});

// Obtener hábitos de hoy con su estado
router.get('/today', async (req, res) => {
    try {
        const userId = req.user.id;

        const entradasHoy = await HabitEntry.getTodayEntries(userId);

        res.json({
            success: true,
            date: new Date().toISOString().split('T')[0],
            total: entradasHoy.length,
            completed: entradasHoy.filter(e => e.completado).length,
            pending: entradasHoy.filter(e => !e.completado).length,
            habits: entradasHoy
        });

    } catch (error) {
        console.error('❌ Error al obtener hábitos de hoy:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener hábitos de hoy',
            message: error.message
        });
    }
});

// Obtener estadísticas generales del usuario
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await HabitEntry.getUserStats(userId);

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

// Obtener resumen semanal
router.get('/weekly-summary', async (req, res) => {
    try {
        const userId = req.user.id;

        const resumen = await HabitEntry.getWeeklySummary(userId);

        res.json({
            success: true,
            summary: resumen
        });

    } catch (error) {
        console.error('❌ Error al obtener resumen semanal:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resumen semanal',
            message: error.message
        });
    }
});

// Obtener un hábito específico por ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        const habito = await Habit.findById(habitId);

        if (!habito) {
            return res.status(404).json({
                success: false,
                error: 'Hábito no encontrado'
            });
        }

        // Verificar que el hábito pertenece al usuario
        if (habito.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para acceder a este hábito'
            });
        }

        res.json({
            success: true,
            habit: habito.toSafeObject()
        });

    } catch (error) {
        console.error('❌ Error al obtener hábito:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener hábito',
            message: error.message
        });
    }
});

// Crear un nuevo hábito
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitData = {
            ...req.body,
            user_id: userId
        };

        const nuevoHabito = await Habit.create(habitData);

        console.log(`✅ Nuevo hábito creado: ${nuevoHabito.name} (Usuario: ${userId})`);

        res.status(201).json({
            success: true,
            message: 'Hábito creado exitosamente',
            habit: nuevoHabito.toSafeObject()
        });

    } catch (error) {
        console.error('❌ Error al crear hábito:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al crear hábito',
            message: error.message
        });
    }
});

// Actualizar un hábito
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        // Verificar que el hábito existe y pertenece al usuario
        const habito = await Habit.findById(habitId);
        if (!habito) {
            return res.status(404).json({
                success: false,
                error: 'Hábito no encontrado'
            });
        }

        if (habito.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar este hábito'
            });
        }

        const habitoActualizado = await Habit.update(habitId, req.body);

        console.log(`✅ Hábito actualizado: ${habitoActualizado.name} (ID: ${habitId})`);

        res.json({
            success: true,
            message: 'Hábito actualizado exitosamente',
            habit: habitoActualizado.toSafeObject()
        });

    } catch (error) {
        console.error('❌ Error al actualizar hábito:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al actualizar hábito',
            message: error.message
        });
    }
});

// Activar o pausar un hábito
router.patch('/:id/toggle', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'El campo is_active debe ser un booleano'
            });
        }

        // Verificar que el hábito pertenece al usuario
        const habito = await Habit.findById(habitId);
        if (!habito) {
            return res.status(404).json({
                success: false,
                error: 'Hábito no encontrado'
            });
        }

        if (habito.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar este hábito'
            });
        }

        const habitoActualizado = await Habit.toggleActive(habitId, is_active);

        console.log(`✅ Hábito ${is_active ? 'activado' : 'pausado'}: ${habitoActualizado.name}`);

        res.json({
            success: true,
            message: `Hábito ${is_active ? 'activado' : 'pausado'} exitosamente`,
            habit: habitoActualizado.toSafeObject()
        });

    } catch (error) {
        console.error('❌ Error al cambiar estado del hábito:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al cambiar estado del hábito',
            message: error.message
        });
    }
});

// Eliminar un hábito
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        // Verificar que el hábito pertenece al usuario
        const habito = await Habit.findById(habitId);
        if (!habito) {
            return res.status(404).json({
                success: false,
                error: 'Hábito no encontrado'
            });
        }

        if (habito.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para eliminar este hábito'
            });
        }

        await Habit.delete(habitId);

        console.log(`✅ Hábito eliminado: ${habito.name} (ID: ${habitId})`);

        res.json({
            success: true,
            message: 'Hábito eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar hábito:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar hábito',
            message: error.message
        });
    }
});

// ==========================================
// RUTAS DE ENTRADAS DE HÁBITOS
// ==========================================

// Marcar hábito como completado
router.post('/:id/complete', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);
        const { mood_after, notes } = req.body;

        const entrada = await HabitEntry.markAsCompleted(userId, habitId, {
            mood_after,
            notes
        });

        console.log(`✅ Hábito completado (ID: ${habitId}, Usuario: ${userId})`);

        res.json({
            success: true,
            message: 'Hábito marcado como completado',
            entry: entrada.toSafeObject()
        });

    } catch (error) {
        console.error('❌ Error al completar hábito:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al completar hábito',
            message: error.message
        });
    }
});

// Desmarcar hábito
router.post('/:id/uncomplete', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);
        const { date } = req.body;

        const resultado = await HabitEntry.markAsIncomplete(userId, habitId, date);

        console.log(`✅ Hábito desmarcado (ID: ${habitId}, Fecha: ${resultado.date})`);

        res.json({
            success: true,
            message: 'Hábito desmarcado exitosamente',
            result: resultado
        });

    } catch (error) {
        console.error('❌ Error al desmarcar hábito:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al desmarcar hábito',
            message: error.message
        });
    }
});

// Obtener progreso semanal de un hábito
router.get('/:id/progress/week', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        const progreso = await HabitEntry.getWeekProgress(habitId, userId);

        res.json({
            success: true,
            progress: progreso
        });

    } catch (error) {
        console.error('❌ Error al obtener progreso semanal:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al obtener progreso semanal',
            message: error.message
        });
    }
});

// Obtener progreso mensual de un hábito
router.get('/:id/progress/month', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        const progreso = await HabitEntry.getMonthProgress(habitId, userId);

        res.json({
            success: true,
            progress: progreso
        });

    } catch (error) {
        console.error('❌ Error al obtener progreso mensual:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al obtener progreso mensual',
            message: error.message
        });
    }
});

// Obtener racha de un hábito
router.get('/:id/streak', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        const racha = await HabitEntry.getStreakForHabit(habitId, userId);

        res.json({
            success: true,
            streak: racha
        });

    } catch (error) {
        console.error('❌ Error al obtener racha:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al obtener racha',
            message: error.message
        });
    }
});

// Obtener historial de un hábito
router.get('/:id/history', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 30;

        const historial = await HabitEntry.getHistory(habitId, userId, limit);

        res.json({
            success: true,
            history: historial
        });

    } catch (error) {
        console.error('❌ Error al obtener historial:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al obtener historial',
            message: error.message
        });
    }
});

// Obtener estadísticas de un hábito específico
router.get('/:id/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const habitId = parseInt(req.params.id);

        // Verificar que el hábito pertenece al usuario
        const habito = await Habit.findById(habitId);
        if (!habito || habito.user_id !== userId) {
            return res.status(404).json({
                success: false,
                error: 'Hábito no encontrado'
            });
        }

        const stats = await Habit.getStats(habitId);

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas del hábito:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error al obtener estadísticas del hábito',
            message: error.message
        });
    }
});

module.exports = router;
