import { supabase } from './supabase-client.js';
import { state } from './state.js';
import * as Dashboard from './dashboard.js';
import * as Store from './store.js';
import * as Social from './social.js';
import * as Challenges from './challenges.js';

const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'login.html'; 

    const { data: user } = await supabase.from('users').select('*').eq('auth_user_id', session.user.id).single();
    state.currentUser = user;
    
    await Promise.all([
        Dashboard.loadDashboardData(),
        Store.loadStoreData(),
        Social.loadSocialData(),
        Challenges.loadChallengesAndEvents()
    ]);
    
    document.getElementById('app-loading').classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => document.getElementById('app-loading').remove(), 500);

    // Default sidebar user info
    const sbAvatar = document.getElementById('user-avatar-sidebar');
    const sbName = document.getElementById('user-name-sidebar');
    const sbPoints = document.getElementById('user-points-sidebar');
    if(sbAvatar) sbAvatar.src = user.profile_img_url || 'https://placehold.co/80x80';
    if(sbName) sbName.textContent = user.full_name;
    if(sbPoints) sbPoints.textContent = user.current_points;

    Dashboard.renderDashboard();
    if(window.lucide) window.lucide.createIcons();
};

window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('opacity-0', 'hidden');

    if(pageId === 'dashboard') Dashboard.renderDashboard();
    if(pageId === 'rewards') Store.renderRewardsPage();
    if(pageId === 'my-rewards') Store.renderRewardsPage(); 
    if(pageId === 'leaderboard') Social.renderLeaderboard();
    if(pageId === 'history') Social.renderHistory();
    if(pageId === 'challenges') Challenges.renderChallengesPage();
    if(pageId === 'events') Challenges.renderEventsPage();
    
    if(window.lucide) window.lucide.createIcons();
};

window.toggleSidebar = () => {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = !sb.classList.contains('-translate-x-full');
    if(isOpen) {
        sb.classList.add('-translate-x-full');
        ov.classList.add('opacity-0', 'hidden');
    } else {
        sb.classList.remove('-translate-x-full');
        ov.classList.remove('hidden');
        setTimeout(() => ov.classList.remove('opacity-0'), 10);
    }
};

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};

checkAuth();
