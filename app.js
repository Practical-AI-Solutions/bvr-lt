import { processImageWithGPT4 } from './services/openai.js';
import { saveNote, getAllNotes, deleteNote, uploadImage } from './services/supabase.js';
import { readText } from './services/elevenlabs.js';

// Configure marked for safe rendering
marked.setOptions({
    headerIds: false,
    mangle: false
});

// Add heic2any library for HEIC conversion
const heicScript = document.createElement('script');
heicScript.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
document.head.appendChild(heicScript);

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const status = document.getElementById('status');
    const notes = document.getElementById('notes');
    const uploadBtn = document.getElementById('uploadBtn');
    const processBtn = document.getElementById('processBtn');
    const clearBtn = document.getElementById('clearBtn');
    const imagePreview = document.getElementById('imagePreview');
    const dropZone = document.getElementById('dropZone');
    
    let selectedFiles = [];

    // Load existing notes on startup
    loadNotes();

    // Setup event listeners
    uploadBtn.addEventListener('click', () => imageInput.click());
    processBtn.addEventListener('click', processSelectedImages);
    clearBtn.addEventListener('click', clearAllFiles);
    imageInput.addEventListener('change', handleFileSelect);

    // Drag and drop event listeners
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    function handleDragEnter(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    function handleDragLeave(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length === 0) {
            status.textContent = 'Please drop image files only.';
            return;
        }
        
        handleFiles(files);
    }

    function handleFileSelect(event) {
        const files = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length === 0) return;
        handleFiles(files);
    }

    async function handleFiles(files) {
        // Don't clear previous files, append new ones
        const startIndex = selectedFiles.length;
        status.textContent = 'Processing files...';
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                let processedFile = file;
                
                // Convert HEIC/HEIF to JPEG if needed
                if (file.type === '' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                    status.textContent = `Converting ${file.name} to JPEG...`;
                    try {
                        const blob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: 0.8
                        });
                        processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                            type: 'image/jpeg'
                        });
                    } catch (convError) {
                        console.error('HEIC conversion error:', convError);
                        status.textContent = `Error converting ${file.name}. Skipping...`;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                }
                
                selectedFiles.push(processedFile);
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${startIndex + selectedFiles.length}">
                        <button class="remove-btn" data-index="${selectedFiles.length - 1}">×</button>
                    `;
                    
                    previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        const removeIndex = parseInt(e.target.dataset.index);
                        selectedFiles = selectedFiles.filter((_, i) => i !== removeIndex);
                        previewItem.remove();
                        // Reindex remaining items
                        document.querySelectorAll('.preview-item').forEach((item, i) => {
                            item.querySelector('.remove-btn').dataset.index = i;
                        });
                        updateButtons();
                    });
                    
                    imagePreview.appendChild(previewItem);
                };
                reader.readAsDataURL(processedFile);
                
            } catch (error) {
                console.error('Error processing file:', error);
                status.textContent = `Error processing ${file.name}. Skipping...`;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        updateButtons();
        const totalFiles = selectedFiles.length;
        status.textContent = `${totalFiles} image${totalFiles > 1 ? 's' : ''} selected. Click Process to begin.`;
    }

    function updateButtons() {
        const hasFiles = selectedFiles.length > 0;
        processBtn.disabled = !hasFiles;
        clearBtn.disabled = !hasFiles;
        processBtn.textContent = `Process Images (${selectedFiles.length})`;
    }

    async function processSelectedImages() {
        if (!selectedFiles.length) return;
        
        processBtn.disabled = true;
        uploadBtn.disabled = true;
        clearBtn.disabled = true;
        let processed = 0;
        
        for (const file of selectedFiles) {
            try {
                status.textContent = `Processing ${file.name}... (${processed + 1}/${selectedFiles.length})`;
                console.log(`Processing ${file.name}`);

                // Upload image to Supabase Storage
                const imageUrl = await uploadImage(file);
                console.log('Image uploaded to Supabase Storage:', imageUrl);

                const base64 = await fileToBase64(file);
                console.log('Image converted to base64');

                const noteData = await processImageWithGPT4(base64);
                console.log('GPT-4 Response:', noteData);

                // Save note with image URL
                noteData.image_url = imageUrl;
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
        uploadBtn.disabled = false;
        imageInput.value = '';
        status.textContent = `Completed processing ${processed} images!`;
        updateButtons();
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
        noteDiv.dataset.noteId = note.id;

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

        // Add image preview
        if (note.image_url) {
            const imagePreview = document.createElement('img');
            imagePreview.src = note.image_url;
            imagePreview.alt = 'Note Image';
            imagePreview.className = 'note-image';
            imagePreview.onclick = () => {
                const fullImage = document.createElement('img');
                fullImage.src = note.image_url;
                fullImage.style.position = 'fixed';
                fullImage.style.top = '50%';
                fullImage.style.left = '50%';
                fullImage.style.transform = 'translate(-50%, -50%)';
                fullImage.style.maxWidth = '90%';
                fullImage.style.maxHeight = '90%';
                fullImage.style.zIndex = '1000';
                fullImage.style.borderRadius = '8px';
                fullImage.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                fullImage.style.backgroundColor = 'white';

                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
                overlay.style.zIndex = '999';

                overlay.onclick = () => {
                    document.body.removeChild(fullImage);
                    document.body.removeChild(overlay);
                };

                document.body.appendChild(overlay);
                document.body.appendChild(fullImage);
            };
            noteDiv.appendChild(imagePreview);
        }

        // Add read button
        const readBtn = document.createElement('button');
        readBtn.className = 'read-btn';
        readBtn.innerHTML = '🔊';
        readBtn.title = 'Read note';
        readBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                readBtn.disabled = true;
                readBtn.innerHTML = '🔄';
                status.textContent = 'Reading note...';
                
                // Strip markdown and clean up text for reading
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = marked.parse(note.content);
                const cleanText = tempDiv.textContent.trim();
                
                await readText(cleanText);
                
                status.textContent = 'Finished reading note.';
            } catch (error) {
                console.error('Failed to read note:', error);
                status.textContent = 'Failed to read note. Please try again.';
            } finally {
                readBtn.disabled = false;
                readBtn.innerHTML = '🔊';
            }
        };

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
        noteDiv.appendChild(readBtn);
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

    function clearAllFiles() {
        selectedFiles = [];
        imagePreview.innerHTML = '';
        updateButtons();
        status.textContent = 'All images cleared.';
    }
});
