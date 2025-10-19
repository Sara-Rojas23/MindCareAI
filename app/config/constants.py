
# Mapeo de emociones (en español) para pysentimiento/robertuito-emotion-analysis
EMOTION_MAPPING = {
    'joy': 'alegria',
    'sadness': 'tristeza',
    'anger': 'enojo',
    'fear': 'miedo',
    'surprise': 'sorpresa',
    'disgust': 'asco',
    'neutral': 'neutral'
}

# Palabras clave por emoción (fallback)
EMOTION_KEYWORDS = {
    'ansiedad': ['nervioso', 'preocupado', 'estresado', 'pánico', 'examen', 'miedo'],
    'alegría': ['feliz', 'contento', 'genial', 'maravilloso', 'increíble'],
    'tristeza': ['triste', 'deprimido', 'llorar', 'dolor', 'pena'],
    'enojo': ['furioso', 'molesto', 'irritado', 'odio', 'rabia'],
    'calma': ['tranquilo', 'relajado', 'paz', 'sereno'],
    'amor': ['amo', 'quiero', 'cariño', 'romance', 'corazón']
}
