import { ElevenLabsClient, play } from 'elevenlabs';

const ELEVENLABS_API_KEY = window.env.ELEVENLABS_API_KEY;

const elevenlabs = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY
});

export async function readText(text) {
    try {
        const audio = await elevenlabs.generate({
            voice: "Sarah",  // Using Sarah's voice as default
            text: text,
            model_id: "eleven_multilingual_v2", // Most stable and supports multiple languages
        });

        await play(audio);
    } catch (error) {
        console.error('ElevenLabs Error:', error);
        throw new Error('Failed to read text');
    }
} 