// Cliente API para MindCare AI

export async function analyzeEmotion(text, userId = 1) {
    const response = await fetch('/api/v1/emotions/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ text, user_id: userId })
    });
    if (!response.ok) {
        throw new Error('Error al analizar la emoción');
    }
    return await response.json();
}
