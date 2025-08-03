// Supabase Setup
const supabaseUrl = 'https://orgzlgqzyrzypknyfgnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ3psZ3F6eXJ6eXBrbnlmZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI4ODMsImV4cCI6MjA2OTc4ODg4M30.Zhm8ebL5XK3EWn8tCESB0KedX9QCfaQfMj1yIp5A6-o';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// CAPTCHA Game Variables
let captchaScore = 0;
let ballInterval;
const requiredScore = 5;

// Initialize CAPTCHA Game
function initCaptchaGame() {
    const ball = document.getElementById('captchaBall');
    const counter = document.getElementById('captchaCounter');
    const overlay = document.getElementById('captchaOverlay');

    // Ball click handler
    ball.addEventListener('click', () => {
        captchaScore++;
        counter.textContent = `${captchaScore}/${requiredScore}`;
        ball.style.transform = 'scale(0.9)';
        setTimeout(() => ball.style.transform = 'scale(1)', 100);

        if (captchaScore >= requiredScore) {
            clearInterval(ballInterval);
            overlay.style.display = 'none';
            document.getElementById('uploadBtn').disabled = false;
        }
    });

    // Cancel button
    document.getElementById('cancelCaptcha').addEventListener('click', () => {
        clearInterval(ballInterval);
        overlay.style.display = 'none';
    });
}

// Move ball randomly
function startBallMovement() {
    const ball = document.getElementById('captchaBall');
    const container = document.querySelector('.captcha-box');
    let x = 0, y = 0;
    const speed = 3;

    ballInterval = setInterval(() => {
        const containerRect = container.getBoundingClientRect();
        x += (Math.random() - 0.5) * speed;
        y += (Math.random() - 0.5) * speed;

        // Boundary checks
        x = Math.max(0, Math.min(x, containerRect.width - 50));
        y = Math.max(0, Math.min(y, containerRect.height - 70));

        ball.style.left = `${x}px`;
        ball.style.top = `${y}px`;
    }, 50);
}

// Upload Form Handler
document.getElementById('photoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset CAPTCHA
    captchaScore = 0;
    document.getElementById('captchaCounter').textContent = '0/5';
    document.getElementById('captchaOverlay').style.display = 'flex';
    document.getElementById('uploadBtn').disabled = true;
    startBallMovement();
    
    // Wait for CAPTCHA completion
    while (captchaScore < requiredScore) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Proceed with upload
    const file = document.getElementById('photoUpload').files[0];
    const filePath = `photos/${Date.now()}_${file.name}`;

    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

    if (uploadError) {
        alert(`Upload failed: ${uploadError.message}`);
        return;
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

    // 3. Save to database
    const { error: dbError } = await supabase
        .from('photos')
        .insert({
            title: document.getElementById('photoTitle').value,
            image_url: publicUrl,
            client_fp: await getFingerprint() // Basic bot tracking
        });

    if (dbError) {
        alert(`Database error: ${dbError.message}`);
    } else {
        alert('Photo uploaded successfully!');
        loadPhotos();
    }
});

// Generate simple client fingerprint
async function getFingerprint() {
    const data = new TextEncoder().encode(
        navigator.userAgent + 
        (navigator.hardwareConcurrency || '') +
        (screen.width * screen.height)
    );
    const hash = await crypto.subtle.digest('SHA-1', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Load photos from Supabase
async function loadPhotos() {
    const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error) {
        document.getElementById('gallery').innerHTML = photos.map(photo => `
            <div class="photo">
                <img src="${photo.image_url}" alt="${photo.title}">
                <div class="photo-info">
                    <h3>${photo.title}</h3>
                </div>
            </div>
        `).join('');
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initCaptchaGame();
    loadPhotos();
});
