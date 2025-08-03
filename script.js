// Supabase Initialization
const supabaseUrl = 'https://orgzlgqzyrzypknyfgnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ3psZ3F6eXJ6eXBrbnlmZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI4ODMsImV4cCI6MjA2OTc4ODg4M30.Zhm8ebL5XK3EWn8tCESB0KedX9QCfaQfMj1yIp5A6-o';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const photoForm = document.getElementById('photoForm');
const photoUpload = document.getElementById('photoUpload');
const fileName = document.getElementById('fileName');
const gallery = document.getElementById('gallery');

// File Selection Handler
photoUpload.addEventListener('change', (e) => {
    fileName.textContent = e.target.files[0]?.name || 'No file selected';
});

// Form Submission
photoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('photoTitle').value;
    const file = photoUpload.files[0];
    
    if (!file || !title) {
        alert('Please fill all fields');
        return;
    }

    try {
        // 1. Generate unique filename
        const fileExt = file.name.split('.').pop();
        const filePath = `${Date.now()}.${fileExt}`;
        
        // 2. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // 3. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath);
        
        // 4. Save to database
        const { error: dbError } = await supabase
            .from('photos')
            .insert([{ 
                title, 
                image_url: publicUrl 
            }]);
        
        if (dbError) throw dbError;
        
        // 5. Refresh gallery
        await loadPhotos();
        
        // 6. Reset form
        photoForm.reset();
        fileName.textContent = 'No file selected';
        
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Check console for details.');
    }
});

// Load Photos
async function loadPhotos() {
    const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Failed to load photos:', error);
        return;
    }
    
    gallery.innerHTML = photos.map(photo => `
        <div class="photo-card">
            <img src="${photo.image_url}" alt="${photo.title}">
            <div class="photo-info">
                <h3>${photo.title}</h3>
            </div>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', loadPhotos);
