const emotionService = require('../services/emotionService');
const database = require('../models/database');

class EmotionController {
    
    async analyzeEmotion(req, res) {
        try {
            const { text } = req.body;

            // Validación de entrada
            if (!text || typeof text !== 'string' || text.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'El texto debe tener al menos 3 caracteres'
                });
            }

            if (text.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'El texto no debe exceder 1000 caracteres'
                });
            }

            // Realizar análisis de emociones
            const result = await emotionService.analyzeEmotion(text.trim());

            // Si hay usuario autenticado, guardar en historial
            if (req.user) {
                try {
                    console.log(`💾 Guardando análisis para usuario ${req.user.id}:`, {
                        emotion: result.data.analysis.primaryEmotion,
                        confidence: result.data.analysis.confidence
                    });
                    await this.saveEmotionEntry(req.user.id, text.trim(), result.data.analysis);
                    console.log(`✅ Análisis guardado exitosamente en BD`);
                } catch (error) {
                    console.error('❌ Error guardando en historial:', error.message);
                    // No fallar el análisis si no se puede guardar
                }
            } else {
                console.log('🔓 Usuario no autenticado - análisis no guardado');
            }

            // Log para desarrollo
            console.log(`📊 Análisis completado: ${result.data.analysis.primaryEmotion} (${result.data.analysis.confidence}%)`);

            res.json(result);

        } catch (error) {
            console.error('Error en el controlador de emociones:', error);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al analizar emociones',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async getRecommendations(req, res) {
        try {
            const { emotion, context, text } = req.body;

            if (!emotion) {
                return res.status(400).json({
                    success: false,
                    error: 'La emoción es requerida para generar recomendaciones'
                });
            }

            // Por ahora, recomendaciones básicas estáticas
            const recommendations = EmotionController.prototype.generateBasicRecommendations(emotion, context);

            res.json({
                success: true,
                data: {
                    emotion: emotion,
                    recommendations: recommendations,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error generando recomendaciones:', error);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al generar recomendaciones'
            });
        }
    }

    generateBasicRecommendations(emotion, context) {
        const recommendationsMap = {
            alegría: {
                message: '¡Qué maravilloso que te sientas así! 😊',
                tips: [
                    'Comparte esta alegría con alguien cercano',
                    'Anota qué te hizo sentir así para recordarlo después',
                    'Aprovecha esta energía positiva para hacer algo que te guste'
                ],
                activities: ['Escuchar música animada', 'Dar un paseo', 'Llamar a un amigo']
            },
            tristeza: {
                message: 'Es normal sentir tristeza a veces. Permítete sentir 💙',
                tips: [
                    'No juzgues tus sentimientos, son válidos',
                    'Considera hablar con alguien de confianza',
                    'Practica actividades de autocuidado'
                ],
                activities: ['Escuchar música suave', 'Escribir en un diario', 'Tomar un baño relajante']
            },
            ansiedad: {
                message: 'La ansiedad puede ser desafiante. Respira profundo 🌸',
                tips: [
                    'Practica técnicas de respiración profunda',
                    'Enfócate en el momento presente',
                    'Identifica qué está causando la ansiedad'
                ],
                activities: ['Meditación de 5 minutos', 'Ejercicios de respiración', 'Caminar al aire libre']
            },
            enojo: {
                message: 'El enojo es una emoción válida. Encuentra formas saludables de expresarlo 🔥',
                tips: [
                    'Toma una pausa antes de reaccionar',
                    'Identifica qué provocó el enojo',
                    'Encuentra una actividad física para liberar la tensión'
                ],
                activities: ['Ejercicio físico', 'Escribir sobre el sentimiento', 'Escuchar música']
            },
            estrés: {
                message: 'El estrés es señal de que necesitas cuidarte más 💙',
                tips: [
                    'Haz una pausa de 10 minutos cada hora',
                    'Prioriza tus tareas: urgente vs importante',
                    'Recuerda que no puedes hacer todo a la vez',
                    'Busca apoyo si te sientes abrumado'
                ],
                activities: ['Respiración profunda 4-7-8', 'Lista de prioridades', 'Caminar 15 minutos', 'Hablar con alguien']
            },
            calma: {
                message: 'Qué hermoso estar en paz contigo mismo ☮️',
                tips: [
                    'Disfruta este momento de tranquilidad',
                    'Reflexiona sobre lo que te ayuda a mantener la calma',
                    'Usa este estado para planificar tu día'
                ],
                activities: ['Lectura', 'Meditación', 'Contemplar la naturaleza']
            }
        };

        return recommendationsMap[emotion] || {
            message: 'Cada emoción es parte de la experiencia humana 🌈',
            tips: [
                'Observa tus emociones sin juzgarlas',
                'Practica la autocompasión',
                'Considera escribir sobre cómo te sientes'
            ],
            activities: ['Reflexión personal', 'Actividad creativa', 'Conexión social']
        };
    }

    // Guardar entrada de emoción en la base de datos
    async saveEmotionEntry(userId, text, analysis) {
        try {
            const sql = `
                INSERT INTO emotion_entries (
                    user_id, text, primary_emotion, confidence, 
                    emotion_breakdown, context, analysis_method
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const emotionBreakdownStr = JSON.stringify(analysis.emotionBreakdown);

            await database.run(sql, [
                userId,
                text,
                analysis.primaryEmotion,
                analysis.confidence,
                emotionBreakdownStr,
                analysis.context,
                analysis.analysisMethod
            ]);

            console.log(`💾 Entrada emocional guardada para usuario ${userId}`);

        } catch (error) {
            throw new Error(`Error guardando entrada emocional: ${error.message}`);
        }
    }

    // Obtener historial de emociones del usuario
    async getEmotionHistory(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 10, offset = 0 } = req.query;

            console.log(`📊 Obteniendo historial para usuario ${userId} - Limit: ${limit}, Offset: ${offset}`);

            const sql = `
                SELECT 
                    id, text, primary_emotion, confidence, 
                    emotion_breakdown, context, analysis_method,
                    created_at
                FROM emotion_entries 
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;

            const entries = await database.all(sql, [userId, parseInt(limit), parseInt(offset)]);
            console.log(`📋 Entradas encontradas en BD: ${entries.length}`);

            // Procesar los datos
            const processedEntries = entries.map(entry => ({
                id: entry.id,
                text: entry.text,
                emotion: entry.primary_emotion,
                confidence: entry.confidence,
                emotion_breakdown: JSON.parse(entry.emotion_breakdown || '{}'),
                context: entry.context,
                analysis_method: entry.analysis_method,
                recommendations: null, // TODO: agregar recomendaciones si las hay
                created_at: entry.created_at
            }));

            // Obtener estadísticas
            const statsSQL = `
                SELECT 
                    COUNT(*) as total_entries,
                    primary_emotion,
                    COUNT(*) as emotion_count,
                    AVG(confidence) as avg_confidence
                FROM emotion_entries 
                WHERE user_id = ?
                GROUP BY primary_emotion
                ORDER BY emotion_count DESC
            `;

            const stats = await database.all(statsSQL, [userId]);

            res.json({
                success: true,
                data: {
                    entries: processedEntries,
                    stats: stats,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        total: entries.length
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo historial:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener historial'
            });
        }
    }

    // Obtener estadísticas del usuario
    async getUserStats(req, res) {
        try {
            const userId = req.user.id;

            const sql = `
                SELECT 
                    COUNT(*) as total_entries,
                    AVG(confidence) as avg_confidence,
                    primary_emotion,
                    COUNT(*) as emotion_count,
                    MAX(created_at) as last_entry,
                    MIN(created_at) as first_entry
                FROM emotion_entries 
                WHERE user_id = ?
                GROUP BY primary_emotion
                ORDER BY emotion_count DESC
            `;

            const stats = await database.all(sql, [userId]);

            // Calcular totales
            const totalEntries = stats.reduce((sum, stat) => sum + stat.emotion_count, 0);
            const avgConfidence = stats.reduce((sum, stat) => sum + (stat.avg_confidence * stat.emotion_count), 0) / totalEntries || 0;

            res.json({
                success: true,
                data: {
                    totalEntries: totalEntries,
                    avgConfidence: Math.round(avgConfidence * 100) / 100,
                    emotionDistribution: stats,
                    lastEntry: stats.length > 0 ? stats[0].last_entry : null,
                    firstEntry: stats.length > 0 ? stats[stats.length - 1].first_entry : null
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener estadísticas'
            });
        }
    }
}

module.exports = EmotionController;