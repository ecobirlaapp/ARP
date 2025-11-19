import { supabase } from './supabase-client.js';
import { state } from './state.js';
import * as Dashboard from './dashboard.js';
import * as Store from './store.js';
import * as Social from './social.js';
import * as Challenges from './challenges.js';

// 1. Auth & Init
const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.replace('login.html');
    
    state.userAuth = session.user;
    
    // Fetch Profile
    const { data: profile } = await supabase.from('users').select('*').eq('auth_user_id', state.userAuth.id).single();
    state.currentUser = profile;
    
    await loadAllData();
    
    // Remove Loader
    document.getElementById('app-loading').classList.add('loaded');
    if(window.lucide) window.lucide.createIcons();
    
    // Init Listeners
    Social.setupProfileUpload(loadAllData);
};

const loadAllData = async () => {
    await Promise.all([
        Dashboard.loadDashboardData(),
        Store.loadStoreAndProductData(),
        Store.loadUserRewardsData(),
        Social.loadLeaderboardData(),
        Challenges.loadChallengesData()
    ]);
    
    // Refresh current view
    const activePage = document.querySelector('.page.active').id;
    if (activePage === 'dashboard') Dashboard.renderDashboard();
    if (activePage === 'profile') Social.renderProfile();
    if (activePage === 'leaderboard') Social.renderStudentLeaderboard();
};

// 2. Global Navigation (Attached to Window for HTML onclick)
window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Render on Demand
    if (pageId === 'dashboard') Dashboard.renderDashboard();
    if (pageId === 'rewards') Store.renderRewards();
    if (pageId === 'my-rewards') Store.renderMyRewardsPage();
    if (pageId === 'leaderboard') Social.renderStudentLeaderboard();
    if (pageId === 'profile') Social.renderProfile();
    if (pageId === 'challenges') Challenges.renderChallengesPage();
    
    if(window.lucide) window.lucide.createIcons();
    document.getElementById('sidebar').classList.add('-translate-x-full'); // Close sidebar
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
};

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('login.html');
};

// 3. Attach Feature Functions to Window
window.openCheckinModal = Dashboard.openCheckinModal;
window.handleDailyCheckin = () => Dashboard.handleDailyCheckin(loadAllData);
window.showProductDetailPage = Store.showProductDetailPage;
window.openPurchaseModal = (id) => {
    Store.showProductDetailPage(id); // Or specialized modal
    document.getElementById('purchase-modal-overlay').classList.remove('hidden');
    // (Simplified logic for modal trigger)
};
window.confirmPurchase = (id) => Store.confirmPurchase(id, loadAllData);
window.startCamera = Challenges.startCamera;
window.capturePhoto = () => Challenges.capturePhoto(loadAllData);
window.closeCameraModal = () => document.getElementById('camera-modal').classList.add('hidden');

// Start App
checkAuth();
