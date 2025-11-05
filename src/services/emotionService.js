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
        // Generar recomendaciones personalizadas con contexto
        const personalizedRecommendation = this.generatePersonalizedRecommendation(
            result.primaryEmotion, 
            originalText,
            result.context
        );

        return {
            success: true,
            data: {
                text: originalText,
                analysis: {
                    primaryEmotion: result.primaryEmotion || 'neutral',
                    confidence: Math.min(Math.max(result.confidence || 0, 0), 100),
                    emotionBreakdown: result.emotionBreakdown || {},
                    context: result.context || 'Análisis emocional básico',
                    personalizedRecommendation: personalizedRecommendation,
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
                    personalizedRecommendation: this.generatePersonalizedRecommendation(primaryEmotion, text, 'Análisis básico'),
                    timestamp: new Date().toISOString(),
                    analysisMethod: 'fallback'
                }
            }
        };
    }

    // Generar recomendación personalizada con hábitos sugeridos
    generatePersonalizedRecommendation(emotion, userText, context) {
        const emotionLower = emotion.toLowerCase();
        
        // Extraer palabras clave del texto del usuario para personalizar
        const keywords = this.extractKeywords(userText);
        
        const recommendations = {
            'alegría': {
                message: `Me alegra mucho ver que estás experimentando alegría${keywords.context ? ' ' + keywords.context : ''}. Es maravilloso cuando reconocemos y celebramos estos momentos positivos. La alegría no solo nos hace sentir bien, sino que también fortalece nuestro bienestar emocional y físico.`,
                habits: [
                    { name: '📝 Diario de gratitud', description: 'Escribe 3 cosas por las que estás agradecido cada día para mantener esta energía positiva', category: 'personal' },
                    { name: '🎨 Actividad creativa', description: 'Dedica tiempo a algo que disfrutes: dibujar, cocinar, música', category: 'personal' },
                    { name: '🤝 Compartir alegría', description: 'Comparte momentos positivos con amigos o familia', category: 'personal' }
                ]
            },
            'tristeza': {
                message: `Entiendo que estás pasando por un momento de tristeza${keywords.context ? ' ' + keywords.context : ''}. Es completamente válido y humano sentirse así. La tristeza nos permite procesar pérdidas y cambios importantes en nuestra vida. Recuerda que no estás solo y que estos sentimientos son temporales.`,
                habits: [
                    { name: '🚶‍♀️ Caminata diaria', description: 'Sal a caminar 20 minutos al aire libre para despejar la mente', category: 'fisico' },
                    { name: '📞 Conectar con alguien', description: 'Habla con un amigo o familiar de confianza', category: 'personal' },
                    { name: '🧘 Meditación guiada', description: '10 minutos de meditación para procesar emociones', category: 'mental' },
                    { name: '😴 Rutina de sueño', description: 'Mantén un horario regular de sueño para recuperarte emocionalmente', category: 'descanso' }
                ]
            },
            'enojo': {
                message: `Noto que hay algo que te ha molestado${keywords.context ? ' ' + keywords.context : ''}. El enojo es una emoción válida que nos indica que algo necesita cambiar. Lo importante es encontrar formas saludables de expresarlo y canalizarlo de manera constructiva.`,
                habits: [
                    { name: '💪 Ejercicio físico', description: 'Libera tensión con ejercicio: correr, boxeo, yoga', category: 'fisico' },
                    { name: '📝 Escribir sentimientos', description: 'Escribe lo que sientes sin filtros en un diario', category: 'mental' },
                    { name: '🧘 Respiración profunda', description: 'Practica respiración 4-7-8 cuando sientas enojo', category: 'mental' },
                    { name: '🎵 Música relajante', description: 'Escucha música que te calme y te ayude a regular emociones', category: 'personal' }
                ]
            },
            'ansiedad': {
                message: `Percibo que estás experimentando ansiedad${keywords.context ? ' ' + keywords.context : ''}. La ansiedad puede ser abrumadora, pero hay formas efectivas de manejarla. Recuerda que estás seguro en este momento y que puedes tomar las cosas un paso a la vez.`,
                habits: [
                    { name: '🧘 Meditación mindfulness', description: 'Practica estar presente con ejercicios de 5-10 minutos', category: 'mental' },
                    { name: '📱 Limitar redes sociales', description: 'Reduce tiempo en redes sociales que aumentan ansiedad', category: 'mental' },
                    { name: '🌿 Técnica de enraizamiento', description: 'Usa la técnica 5-4-3-2-1 cuando te sientas ansioso', category: 'mental' },
                    { name: '💤 Higiene del sueño', description: 'Duerme 7-8 horas sin pantallas 1 hora antes', category: 'descanso' }
                ]
            },
            'estrés': {
                message: `Veo que estás bajo estrés${keywords.context ? ' ' + keywords.context : ''}. El estrés crónico puede afectar tu salud física y mental. Es crucial que te tomes tiempo para descansar y recargar energías. No olvides que tu bienestar es una prioridad.`,
                habits: [
                    { name: '⏰ Pausas activas', description: 'Toma descansos de 5 minutos cada hora durante el trabajo', category: 'fisico' },
                    { name: '📋 Organización diaria', description: 'Planifica tu día con prioridades claras', category: 'personal' },
                    { name: '🛁 Momento de relajación', description: 'Dedica 30 min diarios a una actividad relajante', category: 'personal' },
                    { name: '🥗 Alimentación consciente', description: 'Come alimentos nutritivos en horarios regulares', category: 'nutricion' },
                    { name: '🚫 Aprender a decir no', description: 'Establece límites saludables en tus compromisos', category: 'mental' }
                ]
            },
            'miedo': {
                message: `Comprendo que estás sintiendo miedo${keywords.context ? ' ' + keywords.context : ''}. El miedo es una emoción de protección, pero no debe paralizarte. Recuerda que eres más fuerte y capaz de lo que crees. Enfrentar los miedos poco a poco es parte del crecimiento personal.`,
                habits: [
                    { name: '💪 Enfrentar pequeños miedos', description: 'Da un pequeño paso cada día hacia lo que temes', category: 'personal' },
                    { name: '📖 Lectura inspiradora', description: 'Lee historias de superación y valentía', category: 'personal' },
                    { name: '🗣️ Hablar sobre miedos', description: 'Comparte tus temores con alguien de confianza', category: 'mental' },
                    { name: '🧘 Visualización positiva', description: 'Visualiza escenarios positivos antes de dormir', category: 'mental' }
                ]
            },
            'calma': {
                message: `Es maravilloso que te sientas en calma${keywords.context ? ' ' + keywords.context : ''}. Este estado de paz interior es valioso y debemos cultivarlo. La calma nos permite tomar mejores decisiones y disfrutar plenamente del momento presente.`,
                habits: [
                    { name: '🧘 Meditación matutina', description: 'Comienza el día con 10 minutos de meditación', category: 'mental' },
                    { name: '🌳 Tiempo en naturaleza', description: 'Pasa tiempo al aire libre regularmente', category: 'fisico' },
                    { name: '📚 Lectura tranquila', description: 'Lee algo que te inspire calma antes de dormir', category: 'personal' },
                    { name: '🍵 Ritual de té o café', description: 'Crea un momento consciente para disfrutar tu bebida favorita', category: 'personal' }
                ]
            },
            'nostalgia': {
                message: `Percibo que estás sintiendo nostalgia${keywords.context ? ' ' + keywords.context : ''}. Los recuerdos son parte valiosa de quienes somos. Es hermoso honrar el pasado, pero también importante vivir plenamente el presente y crear nuevos momentos memorables.`,
                habits: [
                    { name: '📸 Álbum de recuerdos', description: 'Organiza fotos y recuerdos de forma terapéutica', category: 'personal' },
                    { name: '✍️ Escribir memorias', description: 'Escribe sobre momentos significativos de tu vida', category: 'personal' },
                    { name: '🎯 Nuevas experiencias', description: 'Crea nuevos recuerdos con actividades diferentes', category: 'personal' },
                    { name: '🤝 Reconectar', description: 'Contacta a viejos amigos de forma positiva', category: 'personal' }
                ]
            },
            'disgusto': {
                message: `Entiendo que algo te ha causado disgusto${keywords.context ? ' ' + keywords.context : ''}. Esta emoción nos ayuda a alejarnos de lo que nos hace daño. Es importante identificar qué te causa esta sensación para poder establecer límites saludables.`,
                habits: [
                    { name: '🚿 Higiene personal', description: 'Mantén una rutina de cuidado personal que te haga sentir bien', category: 'personal' },
                    { name: '🧹 Limpieza del entorno', description: 'Organiza y limpia tu espacio regularmente', category: 'personal' },
                    { name: '🚫 Establecer límites', description: 'Aléjate de situaciones o personas que te hacen sentir mal', category: 'mental' },
                    { name: '🌸 Autocuidado', description: 'Dedica tiempo a actividades que te hagan sentir renovado', category: 'personal' }
                ]
            }
        };

        // Emoción por defecto si no está en el diccionario
        const defaultRecommendation = {
            message: `Gracias por compartir cómo te sientes${keywords.context ? ' ' + keywords.context : ''}. Reconocer y expresar nuestras emociones es el primer paso hacia el bienestar emocional. Cada emoción tiene algo que enseñarnos sobre nosotros mismos.`,
            habits: [
                { name: '📝 Diario emocional', description: 'Escribe cómo te sientes cada día', category: 'mental' },
                { name: '🧘 Mindfulness', description: 'Practica estar presente en el momento', category: 'mental' },
                { name: '💤 Sueño reparador', description: 'Duerme 7-8 horas cada noche', category: 'descanso' },
                { name: '🥗 Alimentación balanceada', description: 'Come comidas nutritivas regularmente', category: 'nutricion' }
            ]
        };

        const recommendation = recommendations[emotionLower] || defaultRecommendation;

        return {
            message: recommendation.message,
            habitSuggestions: recommendation.habits,
            callToAction: 'Puedes crear estos hábitos en la sección de 🎯 Hábitos Diarios para comenzar a trabajar en tu bienestar emocional.'
        };
    }

    // Extraer palabras clave del contexto del usuario
    extractKeywords(text) {
        const lowerText = text.toLowerCase();
        let context = '';

        // Detectar contextos comunes
        if (lowerText.includes('trabajo') || lowerText.includes('oficina') || lowerText.includes('jefe')) {
            context = 'relacionado con tu trabajo';
        } else if (lowerText.includes('familia') || lowerText.includes('mamá') || lowerText.includes('papá') || lowerText.includes('hermano') || lowerText.includes('hermana')) {
            context = 'en tu entorno familiar';
        } else if (lowerText.includes('pareja') || lowerText.includes('novio') || lowerText.includes('novia') || lowerText.includes('esposo') || lowerText.includes('esposa')) {
            context = 'en tu relación de pareja';
        } else if (lowerText.includes('amigo') || lowerText.includes('amiga')) {
            context = 'con tus amistades';
        } else if (lowerText.includes('estudio') || lowerText.includes('universidad') || lowerText.includes('escuela') || lowerText.includes('examen')) {
            context = 'relacionado con tus estudios';
        } else if (lowerText.includes('salud') || lowerText.includes('enfermedad') || lowerText.includes('doctor')) {
            context = 'relacionado con tu salud';
        }

        return { context };
    }
}

module.exports = new EmotionAnalysisService();