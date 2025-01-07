// OpenAI Integration
const OPENAI_API_KEY = window.env.OPENAI_API_KEY;
const MODEL_NAME = window.env.MODEL_NAME || 'gpt-4o-mini';

export async function processImageWithGPT4(base64Image) {
    try {
        // Ensure base64 string is properly formatted
        const imageUrl = base64Image.startsWith('data:') 
            ? base64Image 
            : `data:image/jpeg;base64,${base64Image}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: 'Extract and categorize this handwritten note. Please follow these rules:\n' +
                              '1. For transcription: Correct obvious misspellings (e.g., "Mg" should be "May" if it\'s clearly meant to be the word "May")\n' +
                              '2. Maintain original capitalization unless it\'s clearly a mistake\n' +
                              '3. Use Markdown formatting to preserve styling:\n' +
                              '   - Use **bold** for emphasized/bold text\n' +
                              '   - Use _italic_ for underlined text\n' +
                              '   - Use # for headers/titles\n' +
                              '   - Use - or * for bullet points\n' +
                              '   - Use > for quoted text\n' +
                              '   - Preserve line breaks with double spaces\n' +
                              'Return a JSON object with these fields:\n' +
                              '- content: the transcribed text with Markdown formatting\n' +
                              '- type: categorize as prayer/quote/lesson\n' +
                              '- year: if mentioned in the note (null if not found)\n' +
                              'Return ONLY the JSON object, no additional formatting.'
                    }, {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                            detail: 'high'
                        }
                    }]
                }],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('OpenAI Response:', {
                status: response.status,
                statusText: response.statusText,
                error
            });
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        try {
            // Clean up the response content
            const cleanContent = data.choices[0].message.content
                .replace(/```json\n?/, '')
                .replace(/```\n?$/, '')
                .trim();

            // Parse the JSON response
            return JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('Error parsing GPT response:', parseError);
            return {
                content: data.choices[0].message.content,
                type: 'unknown',
                year: null
            };
        }
    } catch (error) {
        console.error('OpenAI Error:', error);
        throw new Error('Failed to process image with GPT-4');
    }
}
