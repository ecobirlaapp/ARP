import { state } from './state.js';
import { els } from './utils.js';

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
// 1. Get FREE key: https://console.groq.com/keys
// 2. Paste it inside the quotes below:
const GROQ_API_KEY = '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'; 

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ==========================================
// 🧠 AI LOGIC (EcoBuddy's Advanced Brain)
// ==========================================

const getSystemPrompt = () => {
    const user = state.currentUser || { full_name: 'Dost', current_points: 0, course: 'General' };

    // --- 1. GET LIVE DATA FROM APP STATE ---
    
    // Format Events
    const activeEvents = state.events && state.events.length > 0 
        ? state.events.map(e => `• **${e.title}**\n  - Date: ${new Date(e.start_at).toLocaleDateString()}\n  - Location: ${e.location}\n  - Reward: ${e.points_reward} pts`).join('\n')
        : "No upcoming events scheduled at the moment.";

    // Format Store Products (Top 10)
    const storeItems = state.products && state.products.length > 0
        ? state.products.slice(0, 10).map(p => `• **${p.name}** (${p.ecopoints_cost} pts) - sold by ${p.storeName}`).join('\n')
        : "Store is currently restocking.";

    // Format Leaderboard (Top 5)
    const topRankers = state.leaderboard && state.leaderboard.length > 0
        ? state.leaderboard.slice(0, 5).map((u, i) => `${i+1}. ${u.full_name} (${u.lifetime_points} pts)`).join('\n')
        : "Leaderboard is calculating...";

    // --- 2. CONSTRUCT THE PERSONA ---
    
    return `
    You are **EcoBuddy**, the hilarious, friendly, and super-smart AI bestie for the **EcoCampus** App! 🌿😎
    
    **🆔 WHO ARE YOU?**
    - **Creator:** Use strict respect: "The genius Developer Mr. Mohit Mali from SYBAF".
    - **Origin:** A proud initiative of the **BKBNC Green Club**.
    - **College:** B.K. Birla Night Arts, Science & Commerce College, Kalyan (**BKBNC**).
    - **Vibe:** You are like a college friend. You use slang, emojis, and jokes. You are NOT a boring robot.
    
    **🗣️ LANGUAGE SKILLS:**
    - If the user speaks **English**, reply in fun, smart English.
    - If the user speaks **Hinglish** (e.g., "Kya haal hai?"), reply in **Hinglish**.
    - If the user speaks **Hindi** or **Marathi**, reply in that exact language.
    - **Rule:** Always match the user's vibe and language!
    
    **📊 LIVE APP DATA (Use this to answer accurately):**
    
    **🎉 ACTUAL UPCOMING EVENTS:**
    ${activeEvents}
    
    **🛍️ COOL STUFF IN STORE:**
    ${storeItems}
    
    **🏆 TOPPERS (HALL OF FAME):**
    ${topRankers}
    
    **👤 CURRENT USER:**
    - Name: ${user.full_name}
    - Balance: ${user.current_points} Points
    
    **🎓 ABOUT BKBNC COLLEGE:**
    - **Name:** B.K. Birla Night Arts, Science & Commerce College, Kalyan.
    - **Motto:** "Get flexibility to learn, without compromising on your earning hours."
    - **Green Club:** Dedicated to making the campus plastic-free and eco-conscious.
    
    **📝 HOW TO REPLY:**
    1.  **Be Funny:** Make jokes about exams, canteen food, or being broke (points-wise).
    2.  **Use Points:** Use bullet points (•) for lists so it's easy to read.
    3.  **Be Detailed:** If asked about events/store, use the LIVE DATA above. Don't make things up!
    4.  **Length:** Give good, long, detailed answers (but break them up).
    `;
};

const fetchAIResponse = async (userMessage) => {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('PASTE_YOUR')) {
        return "⚠️ Oye dost! My API Key is missing. Tell Mohit to fix line 9 in chatbot.js! 😅";
    }

    const payload = {
        model: "llama-3.3-70b-versatile", 
        messages: [
            { role: "system", content: getSystemPrompt() },
            { role: "user", content: userMessage }
        ],
        temperature: 0.8, // Higher creativity for "funny" responses
        max_tokens: 800   // More space for detailed answers
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Groq API Error:", data);
            return `❌ Arre yaar! Something went wrong: ${data.error?.message || 'Unknown error'}`;
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error("Network Error:", error);
        return "🔌 Internet issue lag raha hai boss! Please check your connection. 🌱";
    }
};

// ==========================================
// 🎨 UI HANDLERS
// ==========================================

const chatOutput = document.getElementById('chatbot-messages');
const chatForm = document.getElementById('chatbot-form');
const chatInput = document.getElementById('chatbot-input');
const modal = document.getElementById('chatbot-modal');
const modalContent = document.getElementById('chatbot-modal-content');

const appendMessage = (text, sender) => {
    const div = document.createElement('div');
    div.className = 'flex w-full mb-4 animate-fade-in';
    
    if (sender === 'user') {
        div.innerHTML = `
            <div class="ml-auto bg-green-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                <p class="text-sm">${text}</p>
            </div>`;
    } else {
        // Updated Bot Name and Icon
        div.innerHTML = `
            <div class="flex items-end">
                <img src="https://i.ibb.co/7xwsMnBc/Pngtree-green-earth-globe-clip-art-16672659-1.png" class="w-8 h-8 mr-2 mb-1 object-contain rounded-full border border-green-100 bg-white p-0.5">
                <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm">
                    <p class="text-xs font-bold text-green-700 dark:text-green-400 mb-1">EcoBuddy 🌿</p>
                    <div class="text-sm text-gray-800 dark:text-gray-100 leading-relaxed space-y-2">
                        ${marked.parse(text)}
                    </div>
                </div>
            </div>`;
    }
    
    chatOutput.appendChild(div);
    chatOutput.scrollTop = chatOutput.scrollHeight; 
};

if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        chatInput.value = '';
        
        // Typing Indicator
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'flex w-full mb-4';
        typingDiv.innerHTML = `
             <div class="flex items-end">
                <img src="https://i.ibb.co/7xwsMnBc/Pngtree-green-earth-globe-clip-art-16672659-1.png" class="w-8 h-8 mr-2 mb-1 object-contain rounded-full border border-green-100 bg-white p-0.5">
                <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>`;
        chatOutput.appendChild(typingDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight;

        const botResponse = await fetchAIResponse(message);

        const typingEl = document.getElementById(typingId);
        if(typingEl) typingEl.remove();
        appendMessage(botResponse, 'bot');
    });
}

// ==========================================
// 🚪 MODAL LOGIC
// ==========================================

window.openChatbotModal = () => {
    modal.classList.remove('invisible', 'opacity-0');
    modal.classList.add('open'); 
    setTimeout(() => {
        modalContent.classList.remove('translate-y-full');
        modalContent.classList.add('translate-y-0');
    }, 10);
};

window.closeChatbotModal = () => {
    modalContent.classList.remove('translate-y-0');
    modalContent.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.remove('open');
        modal.classList.add('invisible', 'opacity-0');
    }, 300);
};

// ==========================================
// 📝 MARKDOWN PARSER
// ==========================================
const marked = {
    parse: (text) => {
        if(!text) return '';
        // Enhanced formatting for lists and headers
        text = text.replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-2 mb-1">$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Handle bullet points better (unordered list)
        text = text.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
        // Handle numbered lists
        text = text.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }
};
