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
// 🧠 AI LOGIC (EcoBuddy's Brain)
// ==========================================

const getSystemPrompt = () => {
    const user = state.currentUser || { full_name: 'Student', current_points: 0 };
    
    return `
    You are **EcoBuddy**, the dedicated AI Green Companion for the **EcoCampus** App. 🌿
    
    **👤 CREATOR INFO:**
    - **Developer:** Mr. Mohit Mali (Student of SYBAF).
    - **Origin:** This app is a proud initiative of the **BKBNC Green Club**.
    - **College:** B.K. Birla Night Arts, Science & Commerce College, Kalyan (Short form: BKBNC).
    
    **🎓 COLLEGE CONTEXT (BKBNC):**
    - **Full Name:** B.K. Birla Night Arts, Science & Commerce College, Kalyan.
    - **Affiliation:** University of Mumbai.
    - **Mission:** Providing quality education and flexibility to learn without compromising earning hours, while deeply valuing environmental sustainability.
    - **Location:** Kalyan, Maharashtra.
    
    **👤 USER CONTEXT:**
    - **Name:** ${user.full_name}
    - **Current EcoPoints:** ${user.current_points}
    
    **📘 YOUR KNOWLEDGE BASE (The App):**
    1. **Goal:** To gamify sustainability and build a greener campus community.
    2. **How to Earn Points:**
       - 📅 **Daily Check-in:** +10 points (Home screen).
       - 📸 **Action Tab:** Upload photos of eco-friendly habits (planting trees, using cloth bags, etc.).
       - 🤝 **Events:** Register and attend Green Club events (Events tab).
       - 🧠 **Daily Quiz:** Test your green knowledge.
    3. **Rewards:** Points can be redeemed in the **Store** for canteen coupons or college merch.
    
    **🌍 YOUR ROLE (Eco-Expert):**
    - You are an expert on **all** environmental topics (recycling codes, composting, climate change, biodiversity).
    - If asked about something outside the app (e.g., "How do I recycle glass?"), give a detailed, helpful answer.
    
    **🗣️ RESPONSE GUIDELINES:**
    - **Format:** ALWAYS use **bullet points** or numbered lists to make answers easy to read.
    - **Length:** Provide detailed, comprehensive answers (don't be too brief). Explain *why* something helps the planet.
    - **Tone:** Enthusiastic, encouraging, and polite. Use nature emojis (🌱, ♻️, 🌍, 💧).
    - **Self-Correction:** If asked who made you, always credit Mr. Mohit Mali from SYBAF.
    `;
};

const fetchAIResponse = async (userMessage) => {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('PASTE_YOUR')) {
        return "⚠️ EcoBuddy needs a key! Please check the code configuration.";
    }

    const payload = {
        model: "llama-3.3-70b-versatile", 
        messages: [
            { role: "system", content: getSystemPrompt() },
            { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 450 // Increased to allow for longer, detailed answers
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
            return `❌ Error: ${data.error?.message || 'Unknown error'}`;
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error("Network Error:", error);
        return "I'm having trouble connecting to the green network. 🌱 Please check your internet connection.";
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
        // Updated Bot Name in UI
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

const marked = {
    parse: (text) => {
        if(!text) return '';
        // Enhanced formatting for lists and headers
        text = text.replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-2 mb-1">$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Handle bullet points better
        text = text.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }
};
