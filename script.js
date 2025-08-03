// Supabase Setup
const supabaseUrl = 'https://orgzlgqzyrzypknyfgnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ3psZ3F6eXJ6eXBrbnlmZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI4ODMsImV4cCI6MjA2OTc4ODg4M30.Zhm8ebL5XK3EWn8tCESB0KedX9QCfaQfMj1yIp5A6-o';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');

// User Setup
const currentUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    name: 'User_' + Math.floor(Math.random() * 1000)
};

// Initialize Chat
document.addEventListener('DOMContentLoaded', () => {
    setupRealTime();
    loadMessages();
    
    // Set user name in header
    document.getElementById('userName').textContent = currentUser.name;
});

// Send Message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    const { error } = await supabase
        .from('messages')
        .insert([{
            text,
            user_id: currentUser.id,
            user_name: currentUser.name
        }]);

    if (error) {
        console.error('Send failed:', error);
        return;
    }

    messageInput.value = '';
}

// Load Initial Messages
async function loadMessages() {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Load failed:', error);
        return;
    }

    renderMessages(messages);
}

// Real-Time Updates
function setupRealTime() {
    supabase
        .channel('public:messages')
        .on(
            'postgres_changes',
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages' 
            },
            (payload) => {
                renderMessages([payload.new]);
                playNotification();
            }
        )
        .subscribe();
}

// Render Messages
function renderMessages(messages) {
    messages.forEach(msg => {
        const isCurrentUser = msg.user_id === currentUser.id;
        const messageHTML = `
            <div class="message ${isCurrentUser ? 'message-out' : 'message-in'}">
                <div class="message-sender">${msg.user_name}</div>
                <div class="message-text">${msg.text}</div>
                <div class="message-time">
                    ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    ${isCurrentUser ? '✓✓' : ''}
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Notification Sound
function playNotification() {
    if (document.hidden) {
        new Audio('assets/notification.mp3').play().catch(e => console.log("Audio error:", e));
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
