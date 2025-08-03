// Supabase Initialization
const supabaseUrl = 'https://orgzlgqzyrzypknyfgnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ3psZ3F6eXJ6eXBrbnlmZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI4ODMsImV4cCI6MjA2OTc4ODg4M30.Zhm8ebL5XK3EWn8tCESB0KedX9QCfaQfMj1yIp5A6-o';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const photoForm = document.getElementById('photoForm');
const photoUpload = document.getElementById('photoUpload');
const fileName = document.getElementById('fileName');
const gallery = document.getElementById('gallery');
const hoverSound = document.getElementById('hoverSound');

// File Input Display
photoUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileName.textContent = e.target.files[0].name;
    } else {
        fileName.textContent = 'No file selected';
    }
});

// Hover Sound Effects
document.querySelectorAll('.photo-card, button, .file-upload label').forEach(el => {
    el.addEventListener('mouseenter', () => {
        hoverSound.currentTime = 0;
        hoverSound.play();
    });
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

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    try {
        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(`public/${uniqueName}`, file);
        
        if (uploadError) throw uploadError;
        
        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(`public/${uniqueName}`);
        
        // 3. Save to Database
        const { error: dbError } = await supabase
            .from('photos')
            .insert([{ 
                title, 
                image_url: publicUrl 
            }]);
        
        if (dbError) throw dbError;
        
        // 4. Refresh Gallery
        loadPhotos();
        
        // 5. Reset Form
        photoForm.reset();
        fileName.textContent = 'No file selected';
        
        // Success Animation
        gsap.to('.glow-button', {
            backgroundColor: '#00ff00',
            duration: 0.5,
            yoyo: true,
            repeat: 1
        });
        
    } catch (error) {
        console.error('Upload failed:', error);
        // Error Animation
        gsap.to('.glow-button', {
            backgroundColor: '#ff0000',
            duration: 0.5,
            yoyo: true,
            repeat: 1
        });
    }
});

// Load Photos from Supabase
async function loadPhotos() {
    const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading photos:', error);
        return;
    }
    
    gallery.innerHTML = photos.map(photo => `
        <div class="photo-card">
            <img src="${photo.image_url}" alt="${photo.title}">
            <h3>${photo.title}</h3>
        </div>
    `).join('');
    
    // Add hover animations to new cards
    document.querySelectorAll('.photo-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                scale: 1.05,
                duration: 0.3
            });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                scale: 1,
                duration: 0.3
            });
        });
    });
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    
    // Header animation
    gsap.from('.neon-header', {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    });
    
    // Form animation
    gsap.from('.holographic-panel', {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power2.out"
    });
});
