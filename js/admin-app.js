import { supabase } from './supabase-client.js';
import { renderDashboard } from './admin-dashboard.js';
import { renderUsers } from './admin-users.js';
import { renderEvents } from './admin-events.js';
import { renderStore, renderOrders } from './admin-store.js';
import { renderReviews, renderChallenges } from './admin-reviews.js';
import { renderLeaderboard } from './admin-leaderboard.js';
import { renderCodes } from './admin-codes.js';

// Global Auth Check
const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) window.location.href = 'admin-login.html';
    
    // Verify Role
    const { data: user } = await supabase.from('users').select('role, full_name').eq('id', session.user.id).single();
    if (!user || user.role !== 'admin') {
        await supabase.auth.signOut();
        window.location.href = 'admin-login.html';
    }
    document.getElementById('admin-name').textContent = user.full_name;
};

// Router
window.loadView = (view) => {
    const container = document.getElementById('view-container');
    const title = document.getElementById('page-title');
    container.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>';

    // Update Nav State
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if(btn.getAttribute('onclick').includes(view)) {
            btn.classList.add('bg-gray-800', 'text-white');
            btn.classList.remove('text-gray-300');
        } else {
            btn.classList.remove('bg-gray-800', 'text-white');
            btn.classList.add('text-gray-300');
        }
    });

    setTimeout(() => {
        switch(view) {
            case 'dashboard': title.textContent = 'Overview'; renderDashboard(container); break;
            case 'users': title.textContent = 'User Management'; renderUsers(container); break;
            case 'reviews': title.textContent = 'Review Center'; renderReviews(container); break;
            case 'events': title.textContent = 'Event Management'; renderEvents(container); break;
            case 'store': title.textContent = 'Store & Inventory'; renderStore(container); break;
            case 'orders': title.textContent = 'Order Management'; renderOrders(container); break;
            case 'challenges': title.textContent = 'Challenges & Quizzes'; renderChallenges(container); break;
            case 'codes': title.textContent = 'Redeem Codes'; renderCodes(container); break;
            case 'leaderboard': title.textContent = 'Global Leaderboard'; renderLeaderboard(container); break;
            default: renderDashboard(container);
        }
        lucide.createIcons();
    }, 100); // Slight delay for UI feel
};

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = 'admin-login.html';
};

window.closeModal = () => {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 200);
};

window.openModal = (html) => {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    // Animate in
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
        lucide.createIcons();
    }, 10);
};

// Init
checkAdminAuth().then(() => loadView('dashboard'));
