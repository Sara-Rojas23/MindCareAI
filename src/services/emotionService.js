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
            alegría: ['feliz', 'contento', 'alegre', 'bien', 'genial', 'excelente', 'fantástico', 'maravilloso', 'increíble', 'perfecto', 'bueno', 'exitoso', 'logré', 'conseguí', 'hermoso'],
            tristeza: ['triste', 'deprimido', 'mal', 'horrible', 'terrible', 'llorar', 'dolor', 'pena', 'melancolía', 'desanimado', 'decaído', 'abatido', 'desalentado'],
            enojo: ['enojado', 'furioso', 'molesto', 'irritado', 'rabioso', 'indignado', 'cabreado', 'enfadado', 'ira', 'rabia', 'frustrado'],
            ansiedad: ['ansioso', 'nervioso', 'preocupado', 'inquieto', 'intranquilo', 'angustiado', 'tenso', 'agitado'],
            estrés: ['estresado', 'agobiado', 'abrumado', 'presionado', 'sobrecargado', 'trabajo', 'entregas', 'tareas', 'pendientes', 'tiempo', 'urgente', 'mucho que hacer', 'no puedo', 'cansado', 'agotado', 'exhausto'],
            calma: ['tranquilo', 'relajado', 'sereno', 'en paz', 'calmado', 'sosegado', 'apacible', 'equilibrado'],
            miedo: ['miedo', 'temor', 'terror', 'pánico', 'asustado', 'atemorizado', 'espanto'],
            nostalgia: ['nostalgia', 'añoro', 'extraño', 'recuerdo', 'pasado', 'antes', 'época']
        };

        let scores = {};
        let totalMatches = 0;

        // Contar coincidencias para cada emoción con pesos diferentes
        Object.keys(emotionKeywords).forEach(emotion => {
            let emotionScore = 0;
            
            emotionKeywords[emotion].forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    // Dar más peso a palabras más específicas
                    let weight = keyword.length > 8 ? 25 : 20; // Palabras largas más específicas
                    
                    // Palabras clave de estrés tienen mayor peso
                    if (emotion === 'estrés' && ['estresado', 'agobiado', 'abrumado', 'trabajo', 'entregas'].includes(keyword)) {
                        weight = 30;
                    }
                    
                    emotionScore += weight;
                }
            });
            
            // Normalizar para que no exceda 100
            scores[emotion] = Math.min(emotionScore, 100);
            if (emotionScore > 0) totalMatches++;
        });

        // Detectar combinaciones comunes en español
        if (lowerText.includes('día estresante') || lowerText.includes('mucho trabajo')) {
            scores.estrés = Math.max(scores.estrés || 0, 80);
        }
        
        if (lowerText.includes('me siento') && (lowerText.includes('bien') || lowerText.includes('feliz'))) {
            scores.alegría = Math.max(scores.alegría || 0, 75);
        }

        // Si no hay coincidencias, usar análisis contextual básico
        if (totalMatches === 0) {
            if (lowerText.includes('trabajo') || lowerText.includes('tarea')) {
                scores = { estrés: 50, ansiedad: 30, calma: 20 };
            } else {
                scores = { calma: 60, alegría: 40 };
            }
        }

        // Encontrar emoción dominante
        const primaryEmotion = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        const confidence = Math.min(scores[primaryEmotion] || 50, 100);

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