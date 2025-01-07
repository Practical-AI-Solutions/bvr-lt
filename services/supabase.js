// Supabase Integration
const SUPABASE_URL = window.env.SUPABASE_URL;
const SUPABASE_KEY = window.env.SUPABASE_ANON_KEY;

export async function saveNote(noteData) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            content: noteData.content,
            type: noteData.type || 'unknown',
            year: noteData.year ? parseInt(noteData.year) : null
        })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Supabase Error:', error);
        throw new Error(`Failed to save note: ${error.message || response.statusText}`);
    }

    return true;
}

export async function getAllNotes() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notes?select=*&order=created_at.desc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Supabase Error:', error);
        throw new Error(`Failed to fetch notes: ${error.message || response.statusText}`);
    }

    return await response.json();
}
