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
    const processBtn = document.getElementById('processBtn');
    const imagePreview = document.getElementById('imagePreview');
    
    let selectedFiles = [];

    // Load existing notes on startup
    loadNotes();

    uploadBtn.addEventListener('click', () => imageInput.click());
    processBtn.addEventListener('click', processSelectedImages);

    function updateProcessButton() {
        processBtn.disabled = selectedFiles.length === 0;
        processBtn.textContent = `Process Images (${selectedFiles.length})`;
    }

    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        // Clear previous files
        selectedFiles = [];
        imagePreview.innerHTML = '';
        
        files.forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;
            
            selectedFiles.push(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button class="remove-btn" data-index="${index}">×</button>
                `;
                
                previewItem.querySelector('.remove-btn').addEventListener('click', () => {
                    selectedFiles = selectedFiles.filter((_, i) => i !== index);
                    previewItem.remove();
                    updateProcessButton();
                });
                
                imagePreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });

        updateProcessButton();
        status.textContent = 'Images selected. Click Process to begin.';
    }

    async function processSelectedImages() {
        if (!selectedFiles.length) return;
        
        processBtn.disabled = true;
        uploadBtn.disabled = true;
        let processed = 0;
        
        for (const file of selectedFiles) {
            try {
                status.textContent = `Processing ${file.name}... (${processed + 1}/${selectedFiles.length})`;
                console.log(`Processing ${file.name}`);

                const base64 = await fileToBase64(file);
                console.log('Image converted to base64');

                const noteData = await processImageWithGPT4(base64);
                console.log('GPT-4 Response:', noteData);

                await saveNote(noteData);
                console.log('Note saved to database');

                addNoteToUI(noteData);
                processed++;
            } catch (err) {
                console.error('Error:', err);
                status.textContent = `Error processing ${file.name}: ${err.message}`;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Pause to show error
            }
        }
        
        // Reset UI
        selectedFiles = [];
        imagePreview.innerHTML = '';
        processBtn.disabled = true;
        uploadBtn.disabled = false;
        imageInput.value = '';
        status.textContent = `Completed processing ${processed} images!`;
        updateProcessButton();
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

    imageInput.addEventListener('change', handleFileSelect);
});
