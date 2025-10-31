const axios = require('axios');

class EmotionAnalysisService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        
        // Emociones básicas que vamos a detectar (optimizadas para español)
        this.emotions = [
            'alegría',
            'tristeza', 
            'enojo',
            'miedo',
            'sorpresa',
            'disgusto',
            'ansiedad',
            'estrés',
            'calma',
            'nostalgia'
        ];
    }

    async analyzeEmotion(text) {
        try {
            if (!this.apiKey) {
                throw new Error('API Key de OpenAI no configurada');
            }

            const prompt = this.createAnalysisPrompt(text);
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un experto en análisis emocional. Analiza el texto y responde ÚNICAMENTE con un JSON válido."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = this.parseAIResponse(response.data.choices[0].message.content);
            return this.validateAndFormatResult(result, text);

        } catch (error) {
            console.error('Error en análisis de emociones:', error.message);
            
            // Fallback: análisis básico por palabras clave
            return this.fallbackAnalysis(text);
        }
    }

    createAnalysisPrompt(text) {
        return `
Eres un experto psicólogo especializado en análisis emocional en español. Analiza el siguiente texto en español y detecta las emociones con alta precisión.

IMPORTANTE: 
- El análisis debe ser específicamente para texto en ESPAÑOL
- Considera expresiones, modismos y contextos culturales del español
- Palabras como "estresante", "abrumado", "agobiado" indican ESTRÉS/ANSIEDAD
- "Trabajo", "entregas", "presión" en contexto negativo = ESTRÉS
- "Cansado", "agotado" = puede ser tristeza o estrés según contexto

Analiza este texto en español y devuelve ÚNICAMENTE un JSON con esta estructura exacta:

{
  "primaryEmotion": "emoción_principal_en_español",
  "confidence": número_entre_70_y_95,
  "emotionBreakdown": {
    "alegría": porcentaje,
    "tristeza": porcentaje, 
    "enojo": porcentaje,
    "ansiedad": porcentaje,
    "estrés": porcentaje,
    "calma": porcentaje
  },
  "context": "breve_descripción_del_contexto_emocional_en_español"
}

EMOCIONES DISPONIBLES EN ESPAÑOL: alegría, tristeza, enojo, miedo, sorpresa, disgusto, ansiedad, estrés, calma, nostalgia

TEXTO A ANALIZAR: "${text}"

Analiza cuidadosamente el contexto en español y responde SOLO el JSON, sin explicaciones adicionales.`;
    }

    parseAIResponse(response) {
        try {
            // Limpiar la respuesta para extraer solo el JSON
            const cleanResponse = response.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            throw new Error('Respuesta de IA no válida');
        }
    }

    validateAndFormatResult(result, originalText) {
        return {
            success: true,
            data: {
                text: originalText,
                analysis: {
                    primaryEmotion: result.primaryEmotion || 'neutral',
                    confidence: Math.min(Math.max(result.confidence || 0, 0), 100),
                    emotionBreakdown: result.emotionBreakdown || {},
                    context: result.context || 'Análisis emocional básico',
                    timestamp: new Date().toISOString(),
                    analysisMethod: 'openai'
                }
            }
        };
    }

    // Análisis de respaldo usando palabras clave mejorado para español
    fallbackAnalysis(text) {
        const lowerText = text.toLowerCase();
        
        const emotionKeywords = {
            alegría: ['feliz', 'contento', 'alegre', 'bien', 'genial', 'excelente', 'fantástico', 'maravilloso', 'increíble', 'perfecto', 'bueno', 'exitoso', 'logré', 'conseguí', 'hermoso', 'amor', 'amo', 'encanta', 'disfruto', 'divertido', 'sonrío', 'risa', 'dichoso', 'júbilo', 'eufórico'],
            tristeza: ['triste', 'deprimido', 'mal', 'horrible', 'terrible', 'llorar', 'lloro', 'dolor', 'pena', 'melancolía', 'desanimado', 'decaído', 'abatido', 'desalentado', 'solo', 'soledad', 'vacío', 'desesperanza', 'perdido', 'angustia', 'sufriendo', 'sufro', 'lamento', 'desconsuelo', 'afligido', 'apesadumbrado'],
            enojo: ['enojado', 'enojada', 'furioso', 'furiosa', 'molesto', 'molesta', 'irritado', 'irritada', 'rabioso', 'rabiosa', 'indignado', 'indignada', 'cabreado', 'cabreada', 'enfadado', 'enfadada', 'ira', 'rabia', 'frustrado', 'frustrada', 'odio', 'detesto', 'harto', 'harta', 'indigna', 'enfurecido', 'enfurecida', 'colérico', 'colérica', 'airado', 'airada', 'brava', 'bravo', 'me cae mal', 'no soporto', 'me molesta', 'estoy molesta', 'estoy molesto', 'estoy brava', 'estoy bravo'],
            ansiedad: ['ansioso', 'nerviosa', 'nervioso', 'preocupado', 'preocupada', 'inquieto', 'inquieta', 'intranquilo', 'intranquila', 'angustiado', 'angustiada', 'tenso', 'tensa', 'agitado', 'agitada', 'pánico', 'miedo', 'temor', 'inseguro', 'insegura', 'dudas', 'incertidumbre', 'desasosiego', 'intranquilidad'],
            estrés: ['estresado', 'estresada', 'agobiado', 'agobiada', 'abrumado', 'abrumada', 'presionado', 'presionada', 'sobrecargado', 'sobrecargada', 'trabajo', 'entregas', 'tareas', 'pendientes', 'tiempo', 'urgente', 'mucho que hacer', 'no puedo', 'cansado', 'cansada', 'agotado', 'agotada', 'exhausto', 'exhausta', 'ocupado', 'ocupada', 'carga', 'responsabilidades', 'fecha límite', 'deadline', 'colapsado', 'colapsada', 'saturado', 'saturada'],
            calma: ['tranquilo', 'tranquila', 'relajado', 'relajada', 'sereno', 'serena', 'en paz', 'calmado', 'calmada', 'sosegado', 'sosegada', 'apacible', 'equilibrado', 'equilibrada', 'descansado', 'descansada', 'paz', 'quieto', 'quieta', 'plácido', 'plácida', 'pacífico', 'pacífica'],
            disgusto: ['asco', 'repugna', 'repugnante', 'repulsión', 'desagradable', 'asqueroso', 'asquerosa', 'me repugna', 'me da asco', 'que asco', 'repugnancia'],
            miedo: ['miedo', 'temor', 'terror', 'pánico', 'asustado', 'asustada', 'atemorizado', 'atemorizada', 'espanto', 'amenaza', 'peligro', 'aterrado', 'aterrada', 'espantado', 'espantada'],
            nostalgia: ['nostalgia', 'añoro', 'extraño', 'extraña', 'recuerdo', 'pasado', 'antes', 'época', 'ayer', 'extrañar', 'remembranza']
        };

        let scores = {};
        let totalWeight = 0;

        // Contar coincidencias para cada emoción con análisis inteligente
        Object.keys(emotionKeywords).forEach(emotion => {
            let emotionScore = 0;
            let matches = 0;
            
            emotionKeywords[emotion].forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    matches++;
                    // Peso basado en especificidad de la palabra
                    let weight = 15;
                    
                    if (keyword.length > 10) weight = 35; // Palabras muy específicas
                    else if (keyword.length > 7) weight = 25; // Palabras específicas
                    else if (keyword.length > 5) weight = 20; // Palabras comunes
                    
                    // Palabras de emociones negativas fuertes
                    if (['angustia', 'sufriendo', 'desesperanza', 'llorar', 'lloro', 'dolor'].includes(keyword)) {
                        weight = 40;
                    }
                    
                    // Palabras de estrés específicas
                    if (emotion === 'estrés' && ['estresado', 'estresada', 'agobiado', 'agobiada', 'abrumado', 'abrumada', 'exhausto', 'exhausta'].includes(keyword)) {
                        weight = 35;
                    }
                    
                    // Palabras de ENOJO específicas - PESO ALTO
                    if (emotion === 'enojo' && ['molesta', 'molesto', 'brava', 'bravo', 'furioso', 'furiosa', 'enojado', 'enojada', 'irritado', 'irritada', 'estoy molesta', 'estoy molesto', 'estoy brava', 'estoy bravo'].includes(keyword)) {
                        weight = 45;
                    }
                    
                    emotionScore += weight;
                }
            });
            
            if (emotionScore > 0) {
                scores[emotion] = emotionScore;
                totalWeight += emotionScore;
            }
        });

        // Detectar frases y contextos comunes en español
        if (lowerText.includes('día estresante') || lowerText.includes('mucho trabajo') || lowerText.includes('demasiado trabajo')) {
            scores.estrés = (scores.estrés || 0) + 50;
            totalWeight += 50;
        }
        
        if (lowerText.includes('muy triste') || lowerText.includes('tan triste') || lowerText.includes('me siento mal')) {
            scores.tristeza = (scores.tristeza || 0) + 50;
            totalWeight += 50;
        }
        
        if (lowerText.includes('muy feliz') || lowerText.includes('me siento bien') || lowerText.includes('muy contento')) {
            scores.alegría = (scores.alegría || 0) + 50;
            totalWeight += 50;
        }
        
        // Detectar molestia o enojo general - PRIORIDAD ALTA
        if (lowerText.includes('estoy molesta') || lowerText.includes('estoy molesto') || 
            lowerText.includes('estoy brava') || lowerText.includes('estoy bravo') ||
            lowerText.includes('me molesta mucho') || lowerText.includes('muy molesta') || lowerText.includes('muy molesto')) {
            scores.enojo = (scores.enojo || 0) + 60;
            totalWeight += 60;
        }
        
        // Detectar "no me gusta" en contexto de personas (puede ser disgusto o enojo)
        if (lowerText.includes('no me gusta') && 
            (lowerText.includes('persona') || lowerText.includes('alguien') || lowerText.includes('él') || lowerText.includes('ella') || 
             lowerText.includes('actúa') || lowerText.includes('actua') || lowerText.includes('comporta') || lowerText.includes('como es'))) {
            // Persona que no gusta = más enojo que disgusto
            scores.enojo = (scores.enojo || 0) + 50;
            scores.disgusto = (scores.disgusto || 0) + 30;
            totalWeight += 80;
        }
        
        // Detectar asco/repugnancia física (puro disgusto)
        if (lowerText.includes('me da asco') || lowerText.includes('que asco') || lowerText.includes('repugna')) {
            scores.disgusto = (scores.disgusto || 0) + 70;
            totalWeight += 70;
        }

        // Si no hay coincidencias, usar neutral con baja confianza
        if (Object.keys(scores).length === 0) {
            scores = { calma: 40, alegría: 30, tristeza: 30 };
            totalWeight = 100;
        }

        // Normalizar scores a porcentajes
        Object.keys(scores).forEach(emotion => {
            scores[emotion] = Math.round((scores[emotion] / totalWeight) * 100);
        });

        // Encontrar emoción dominante
        const primaryEmotion = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        // Confianza basada en qué tan clara es la emoción dominante
        const secondHighest = Object.values(scores).sort((a, b) => b - a)[1] || 0;
        const dominance = scores[primaryEmotion] - secondHighest;
        const confidence = Math.min(Math.max(50 + dominance, 60), 90);

        return {
            success: true,
            data: {
                text: text,
                analysis: {
                    primaryEmotion: primaryEmotion,
                    confidence: confidence,
                    emotionBreakdown: scores,
                    context: 'Análisis realizado con método de respaldo por palabras clave',
                    timestamp: new Date().toISOString(),
                    analysisMethod: 'fallback'
                }
            }
        };
    }
}

module.exports = new EmotionAnalysisService();