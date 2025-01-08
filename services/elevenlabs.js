// ElevenLabs API Integration
async function generateSpeech(text) {
    const ELEVENLABS_API_KEY = window.env.ELEVENLABS_API_KEY;
    const VOICE_ID = "mM1PRloZ2t81CV01YcC2"; // Specified voice ID
    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('ElevenLabs API Error:', error);
            throw new Error('Failed to generate speech');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = reject;
            audio.play();
        });
    } catch (error) {
        console.error('ElevenLabs Error:', error);
        throw new Error('Failed to generate speech');
    }
}

export async function readText(text) {
    try {
        await generateSpeech(text);
        return true;
    } catch (error) {
        console.error('Text-to-Speech Error:', error);
        throw error;
    }
} 