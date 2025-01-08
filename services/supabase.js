// Supabase Integration
const SUPABASE_URL = window.env.SUPABASE_URL;
const SUPABASE_KEY = window.env.SUPABASE_ANON_KEY;

// Upload image to Supabase Storage
export async function uploadImage(file) {
    try {
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/notes/${fileName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: file
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Supabase Storage Error:', error);
            throw new Error(`Failed to upload image: ${error.message || response.statusText}`);
        }

        // Return the public URL for the uploaded image
        return `${SUPABASE_URL}/storage/v1/object/public/notes/${fileName}`;
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}

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
            year: noteData.year ? parseInt(noteData.year) : null,
            image_url: noteData.image_url || null
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

export async function deleteNote(noteId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/notes?id=eq.${noteId}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Supabase Error:', error);
            throw new Error(`Failed to delete note: ${error.message || response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Delete Error:', error);
        throw error;
    }
}
