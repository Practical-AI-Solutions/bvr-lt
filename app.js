import { processImageWithGPT4 } from './services/openai.js';
import { saveNote, getAllNotes, deleteNote } from './services/supabase.js';

// Configure marked for safe rendering
marked.setOptions({
    headerIds: false,
    mangle: false
});

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const status = document.getElementById('status');
    const notes = document.getElementById('notes');
    const uploadBtn = document.getElementById('uploadBtn');

    // Load existing notes on startup
    loadNotes();

    uploadBtn.addEventListener('click', () => imageInput.click());

    async function handleUpload(event) {
        const files = event.target.files;
        if (!files.length) return;
        
        uploadBtn.disabled = true;
        
        for (const file of files) {
            try {
                status.textContent = `Processing ${file.name}...`;
                console.log(`Processing ${file.name}`);

                const base64 = await fileToBase64(file);
                console.log('Image converted to base64');

                const noteData = await processImageWithGPT4(base64);
                console.log('GPT-4 Response:', noteData);

                await saveNote(noteData);
                console.log('Note saved to database');

                addNoteToUI(noteData);
                status.textContent = 'Done!';
            } catch (err) {
                console.error('Error:', err);
                status.textContent = `Error: ${err.message}`;
            }
        }
        
        uploadBtn.disabled = false;
        imageInput.value = '';
    }

    async function loadNotes() {
        try {
            const allNotes = await getAllNotes();
            console.log('Notes retrieved:', allNotes);
            
            notes.innerHTML = '';
            allNotes.forEach(note => addNoteToUI(note));
        } catch (err) {
            console.error('Error loading notes:', err);
            status.textContent = `Error loading notes: ${err.message}`;
        }
    }

    function addNoteToUI(note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        noteDiv.dataset.noteId = note.id;  // Store the note ID

        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-content';
        contentDiv.innerHTML = marked.parse(note.content);

        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'metadata';

        if (note.type) {
            const typeSpan = document.createElement('span');
            typeSpan.className = 'type';
            typeSpan.textContent = note.type;
            metadataDiv.appendChild(typeSpan);
        }

        if (note.year) {
            const yearSpan = document.createElement('span');
            yearSpan.className = 'year';
            yearSpan.textContent = note.year;
            metadataDiv.appendChild(yearSpan);
        }

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete note';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this note?')) {
                try {
                    await deleteNote(note.id);
                    noteDiv.remove();
                } catch (error) {
                    console.error('Failed to delete note:', error);
                    alert('Failed to delete note. Please try again.');
                }
            }
        };

        noteDiv.appendChild(contentDiv);
        noteDiv.appendChild(metadataDiv);
        noteDiv.appendChild(deleteBtn);

        notes.prepend(noteDiv);
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    imageInput.addEventListener('change', handleUpload);
});
