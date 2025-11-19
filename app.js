// =========================================
// 1. IMPORTS & SETUP
// =========================================
import { supabase } from './supabase-client.js';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dnia8lb2q';
const CLOUDINARY_UPLOAD_PRESET = 'EcoBirla_avatars';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

// Tick Images
const TICK_IMAGES = {
    blue: 'https://i.ibb.co/kgJpMCHr/blue.png',
    silver: 'https://i.ibb.co/gLJLF9Z2/silver.png',
    gold: 'https://i.ibb.co/Q2C7MrM/gold.png',
    black: 'https://i.ibb.co/zVNSNzrK/black.png',
    green: 'https://i.ibb.co/SXGL4Nq0/green.png'
};

// =========================================
// 2. APPLICATION STATE
// =========================================

let state = {
    currentUser: null, 
    userAuth: null,    
    checkInReward: 10,
    leaderboard: [],
    departmentLeaderboard: [],
    stores: [],
    products: [],      
    history: [],
    dailyChallenges: [], // Merged list of standard challenges + daily quiz
    events: [],
    userRewards: [],   
    levels: [
        { level: 1, title: 'Green Starter', minPoints: 0, nextMin: 1001 },
        { level: 2, title: 'Eco Learner', minPoints: 1001, nextMin: 2001 },
        { level: 3, title: 'Sustainability Leader', minPoints: 2001, nextMin: 4001 },
    ],
    currentUploadChallengeId: null,
    activeQuiz: null // Stores the currently loaded quiz object
};

// Camera State
let currentCameraStream = null;
let currentFacingMode = 'environment'; // 'environment' (back) or 'user' (front)
let currentChallengeIdForCamera = null;

// =========================================
// 3. AUTHENTICATION
// =========================================

const checkAuth = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session:', error.message);
            redirectToLogin();
            return;
        }
        
        if (!session) {
            console.log('No active session. Redirecting to login.');
            redirectToLogin();
            return;
        }

        state.userAuth = session.user;
        await initializeApp();
    } catch (err) {
        console.error('Auth check failed:', err);
    }
};

const initializeApp = async () => {
    try {
        // 1. Get the user's profile
        const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', state.userAuth.id)
            .single();

        if (error || !userProfile) {
            console.error('Error fetching user profile:', error?.message);
            alert('Could not load user profile. Logging out.');
            await handleLogout();
            return;
        }

        state.currentUser = userProfile;
        
        // 2. Load Dashboard & Initial Data
        await loadDashboardData();
        renderDashboard(); 
        
        // Hide loader
        setTimeout(() => document.getElementById('app-loading').classList.add('loaded'), 500);
        lucide.createIcons();
        
        // Load other data concurrently
        await Promise.all([
            loadStoreAndProductData(),
            loadLeaderboardData(),
            loadHistoryData(),
            loadChallengesAndQuizData(), // Updated function name
            loadEventsData(),
            loadUserRewardsData()
        ]);

        setupFileUploads();

    } catch (err) {
        console.error('Initialization Error:', err);
    }
};

const handleLogout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error.message);
        redirectToLogin();
    } catch (err) {
        console.error('Logout Error:', err);
    }
};

const redirectToLogin = () => {
    window.location.replace('login.html');
};

// =========================================
// 4. DATA LOADING
// =========================================

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const loadDashboardData = async () => {
    try {
        const userId = state.currentUser.id;
        const today = getTodayDateString();

        const [
            { data: checkinData },
            { data: streakData },
            { data: impactData },
            { data: eventData }
        ] = await Promise.all([
            supabase.from('daily_checkins').select('id').eq('user_id', userId).eq('checkin_date', today).limit(1),
            supabase.from('user_streaks').select('current_streak').eq('user_id', userId).single(),
            supabase.from('user_impact').select('*').eq('user_id', userId).single(),
            // Fetch next upcoming event
            supabase.from('events').select('title, description, start_at').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(1)
        ]);

        // Process Check-in & Streak
        state.currentUser.isCheckedInToday = (checkinData && checkinData.length > 0);
        state.currentUser.checkInStreak = streakData ? streakData.current_streak : 0;
        state.currentUser.impact = impactData || { total_plastic_kg: 0, co2_saved_kg: 0, events_attended: 0 };
        
        // Process Event (For Dashboard Card)
        state.featuredEvent = (eventData && eventData.length > 0) ? eventData[0] : null;
        
    } catch (err) {
        console.error('Dashboard Data Error:', err);
    }
};

const loadStoreAndProductData = async () => {
    try {
        // Fetch products with all related info [cite: 58, 61, 62, 63]
        const { data, error } = await supabase
            .from('products')
            .select(`
                id, name, description, original_price, discounted_price, ecopoints_cost,
                store_id,
                stores ( name, logo_url ),
                product_images ( image_url, sort_order ),
                product_features ( feature, sort_order ),
                product_specifications ( spec_key, spec_value, sort_order )
            `)
            .eq('is_active', true);
            
        if (error) throw error;

        state.products = data.map(p => ({
            ...p,
            images: p.product_images.sort((a,b) => a.sort_order - b.sort_order).map(img => img.image_url),
            features: p.product_features.sort((a,b) => a.sort_order - b.sort_order).map(f => f.feature),
            specifications: p.product_specifications.sort((a,b) => a.sort_order - b.sort_order),
            storeName: p.stores.name,
            storeLogo: p.stores.logo_url,
            popularity: Math.floor(Math.random() * 50) 
        }));
        
        if (document.getElementById('rewards').classList.contains('active')) renderRewards();
    } catch (err) {
        console.error('Product Load Error:', err);
    }
};

const loadLeaderboardData = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, course, lifetime_points, profile_img_url, tick_type')
            .order('lifetime_points', { ascending: false });

        if (error) throw error;

        // Student Leaderboard (Top 20)
        state.leaderboard = data.slice(0, 20).map(u => ({
            ...u,
            name: u.full_name,
            initials: getUserInitials(u.full_name),
            isCurrentUser: u.id === state.currentUser.id
        }));

        // Department Leaderboard Calculation
        const deptMap = {};
        data.forEach(user => {
            let cleanCourse = user.course ? user.course.trim() : 'General';
            if (cleanCourse.length > 2) cleanCourse = cleanCourse.substring(2); 

            if (!deptMap[cleanCourse]) {
                deptMap[cleanCourse] = { name: cleanCourse, points: 0, students: [] };
            }
            deptMap[cleanCourse].points += (user.lifetime_points || 0);
            deptMap[cleanCourse].students.push({
                name: user.full_name,
                points: user.lifetime_points,
                img: user.profile_img_url,
                tick_type: user.tick_type,
                initials: getUserInitials(user.full_name)
            });
        });

        state.departmentLeaderboard = Object.values(deptMap).sort((a, b) => b.points - a.points);
        
        if (document.getElementById('leaderboard').classList.contains('active')) {
            renderStudentLeaderboard();
            renderDepartmentLeaderboard();
        }
    } catch (err) {
        console.error('Leaderboard Data Error:', err);
    }
};

const loadHistoryData = async () => {
    try {
        const { data, error } = await supabase
            .from('points_ledger')
            .select('*')
            .eq('user_id', state.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        state.history = data.map(item => ({
            type: item.source_type,
            description: item.description,
            points: item.points_delta,
            date: formatDate(item.created_at),
            icon: getIconForHistory(item.source_type)
        }));
        
        if (document.getElementById('history').classList.contains('active')) renderHistory();
    } catch (err) {
        console.error('History Load Error:', err);
    }
};

// Combined loader for Standard Challenges AND Quizzes
const loadChallengesAndQuizData = async () => {
    try {
        const today = getTodayDateString();
        let allItems = [];

        // 1. Fetch Standard Challenges
        const { data: challenges, error: cErr } = await supabase
            .from('challenges')
            .select('*')
            .eq('is_active', true);
        if (cErr) throw cErr;

        // Get submissions for standard challenges
        const { data: cSubs, error: csErr } = await supabase
            .from('challenge_submissions')
            .select('challenge_id, status')
            .eq('user_id', state.currentUser.id);
        if (csErr) throw csErr;

        // Process Standard Challenges
        challenges.forEach(c => {
            const sub = cSubs.find(s => s.challenge_id === c.id);
            let status = 'active';
            let buttonText = (c.type === 'Upload' || c.type === 'selfie') ? 'Take Photo' : 'Start';
            let isDisabled = false;

            if (sub) {
                if (sub.status === 'approved' || sub.status === 'verified') {
                    status = 'completed'; buttonText = 'Completed'; isDisabled = true;
                } else if (sub.status === 'pending') {
                    status = 'pending'; buttonText = 'Pending'; isDisabled = true;
                } else if (sub.status === 'rejected') {
                    status = 'active'; buttonText = 'Retry';
                }
            }

            allItems.push({
                ...c,
                sourceType: 'challenge',
                icon: getIconForChallenge(c.type),
                status, buttonText, isDisabled
            });
        });

        // 2. Fetch Daily Quiz 
        const { data: quiz, error: qErr } = await supabase
            .from('daily_quizzes')
            .select('*')
            .eq('available_date', today)
            .limit(1)
            .single(); // Might be null if no quiz for today

        if (!qErr && quiz) {
            // Check if user has submitted 
            const { data: qSub } = await supabase
                .from('quiz_submissions')
                .select('*')
                .eq('quiz_id', quiz.id)
                .eq('user_id', state.currentUser.id)
                .single();

            let qStatus = 'active';
            let qBtnText = 'Play Quiz';
            let qDisabled = false;

            if (qSub) {
                qStatus = 'completed';
                qBtnText = qSub.is_correct ? 'Won' : 'Attempted';
                qDisabled = true;
            }

            // Add Quiz to list
            allItems.push({
                id: quiz.id,
                title: 'Daily Eco Quiz',
                description: 'Test your knowledge and earn points!',
                points_reward: quiz.points_reward,
                type: 'Quiz',
                sourceType: 'quiz',
                icon: 'brain',
                status: qStatus,
                buttonText: qBtnText,
                isDisabled: qDisabled,
                quizData: quiz // Attach full quiz data for modal
            });
        }

        state.dailyChallenges = allItems;

        if (document.getElementById('challenges').classList.contains('active')) {
            renderChallengesPage();
        }
    } catch (err) {
        // PGRST116 is "Results contain 0 rows", ignore for single queries
        if (err.code !== 'PGRST116') console.error('Challenge/Quiz Load Error:', err);
    }
};

const loadEventsData = async () => {
    try {
        // Fetch events with new columns 
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_at', { ascending: true });

        if (error) throw error;

        // Get User's attendance status
        const { data: attendance } = await supabase
            .from('event_attendance')
            .select('event_id, status')
            .eq('user_id', state.currentUser.id);

        // Calculate "Participants" (Mock or real count could be done via separate query)
        // For this demo, we simulate a random participant count for UI if not in DB
        
        state.events = data.map(e => {
            const att = attendance ? attendance.find(a => a.event_id === e.id) : null;
            let status = 'upcoming';
            if (att) {
                status = (att.status === 'confirmed') ? 'attended' : (att.status === 'absent' ? 'missed' : 'registered');
            }

            return {
                ...e,
                dateObj: new Date(e.start_at),
                formattedDate: formatDate(e.start_at, { month: 'short', day: 'numeric' }),
                time: new Date(e.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                fullDate: formatDate(e.start_at, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
                status: status,
                participantsCount: Math.floor(Math.random() * 50) + 10 // Mock count for UI "Going"
            };
        });

        if (document.getElementById('events').classList.contains('active')) renderEventsPage();
    } catch (err) {
        console.error('Events Load Error:', err);
    }
};

const loadUserRewardsData = async () => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, created_at, status,
                order_items (
                    products (
                        id, name,
                        product_images ( image_url ),
                        stores ( name )
                    )
                )
            `)
            .eq('user_id', state.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        state.userRewards = data.map(order => {
            const item = order.order_items[0]; 
            if (!item) return null;
            return {
                userRewardId: order.id,
                purchaseDate: formatDate(order.created_at),
                status: order.status,
                productName: item.products.name,
                storeName: item.products.stores.name,
                productImage: (item.products.product_images[0] && item.products.product_images[0].image_url) || getPlaceholderImage()
            };
        }).filter(Boolean);

        if (document.getElementById('my-rewards').classList.contains('active')) renderMyRewardsPage();
    } catch (err) {
        console.error('User Rewards Load Error:', err);
    }
};

const refreshUserData = async () => {
    try {
         const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', state.currentUser.id)
            .single();
        
        if (userProfile) {
            state.currentUser = userProfile;
            animatePointsUpdate(userProfile.current_points);
            renderDashboardUI();
        }
    } catch (err) { console.error(err); }
};

// =========================================
// 5. CLOUDINARY & FILE UPLOAD
// =========================================

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
        const res = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.secure_url;
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw err;
    }
};

const setupFileUploads = () => {
    // Profile Upload
    const profileInput = document.getElementById('profile-upload-input');
    if (profileInput) {
        profileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const avatarEl = document.getElementById('profile-avatar');
            avatarEl.style.opacity = '0.5';
            try {
                const imageUrl = await uploadToCloudinary(file);
                await supabase.from('users').update({ profile_img_url: imageUrl }).eq('id', state.currentUser.id);
                state.currentUser.profile_img_url = imageUrl;
                renderProfile();
                renderDashboardUI(); 
                alert('Profile picture updated!');
            } catch (err) {
                alert('Upload failed.');
            } finally {
                avatarEl.style.opacity = '1';
                profileInput.value = ''; 
            }
        });
    }
};

// =========================================
// 6. HELPER FUNCTIONS
// =========================================

const getPlaceholderImage = (size = '400x300', text = 'EcoCampus') => `https://placehold.co/${size}/EBFBEE/166534?text=${text}&font=inter`;
const getTickImg = (tickType) => tickType ? `<img src="${TICK_IMAGES[tickType.toLowerCase()] || ''}" class="tick-icon">` : '';

const getUserLevel = (points) => {
    let current = state.levels[0];
    for (let i = state.levels.length - 1; i >= 0; i--) {
        if (points >= state.levels[i].minPoints) { current = state.levels[i]; break; }
    }
    const nextMin = current.nextMin || Infinity;
    let progress = 0;
    let progressText = "Max Level";
    if (nextMin !== Infinity) {
        progress = Math.max(0, Math.min(100, ((points - current.minPoints) / (nextMin - current.minPoints)) * 100));
        progressText = `${points} / ${nextMin} Pts`;
    }
    return { ...current, progress, progressText };
};

const getProduct = (productId) => state.products.find(p => p.id === productId);

const formatDate = (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!dateString) return '...';
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const getIconForHistory = (type) => {
    const icons = { 'checkin': 'calendar-check', 'event': 'calendar-check', 'challenge': 'award', 'plastic': 'recycle', 'order': 'shopping-cart', 'coupon': 'ticket', 'quiz': 'brain' };
    return icons[type] || 'help-circle';
};

const getIconForChallenge = (type) => {
    const icons = { 'Quiz': 'brain', 'Upload': 'camera', 'selfie': 'camera', 'spot': 'eye' };
    return icons[type] || 'award';
};

const getUserInitials = (fullName) => (fullName || '..').split(' ').map(n => n[0]).join('').toUpperCase();

// =========================================
// 7. NAVIGATION & UI
// =========================================

const els = {
    pages: document.querySelectorAll('.page'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    userPointsHeader: document.getElementById('user-points-header'),
    productDetailPage: document.getElementById('product-detail-page'),
    lbLeafLayer: document.getElementById('lb-leaf-layer')
};

const showPage = (pageId) => {
    els.pages.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    // Clear detail pages
    if (pageId !== 'product-detail-page') els.productDetailPage.innerHTML = '';
    if (pageId !== 'department-detail-page') document.getElementById('department-detail-page').innerHTML = '';

    // Scroll to top
    document.querySelector('.main-content').scrollTop = 0;

    // Specific Page Logic
    if (pageId === 'dashboard') {
        if(els.lbLeafLayer) els.lbLeafLayer.classList.add('hidden');
        renderDashboard(); 
    } else if (pageId === 'rewards') {
        renderRewards();
    } else if (pageId === 'my-rewards') {
        renderMyRewardsPage();
    } else if (pageId === 'leaderboard') {
        showLeaderboardTab('student');
    } else if (pageId === 'history') {
        renderHistory();
    } else if (pageId === 'ecopoints') {
        renderEcoPointsPage();
    } else if (pageId === 'challenges') {
        renderChallengesPage();
    } else if (pageId === 'events') {
        renderEventsPage();
    } else if (pageId === 'profile') {
        renderProfile();
    }

    if(pageId !== 'leaderboard' && els.lbLeafLayer) els.lbLeafLayer.classList.add('hidden');

    toggleSidebar(true);
    lucide.createIcons();
};
window.showPage = showPage;

const toggleSidebar = (forceClose = false) => {
    if (forceClose) {
        els.sidebar.classList.add('-translate-x-full');
        els.sidebarOverlay.classList.add('opacity-0', 'hidden');
    } else {
        els.sidebar.classList.toggle('-translate-x-full');
        els.sidebarOverlay.classList.toggle('hidden');
        els.sidebarOverlay.classList.toggle('opacity-0');
    }
};
window.toggleSidebar = toggleSidebar;

const animatePointsUpdate = (newPoints) => {
    els.userPointsHeader.classList.add('points-pulse');
    els.userPointsHeader.textContent = newPoints;
    setTimeout(() => els.userPointsHeader.classList.remove('points-pulse'), 400);
};

// =========================================
// 8. DASHBOARD RENDERING
// =========================================

const renderDashboard = () => {
    renderDashboardUI();
    renderCheckinButtonState();
};

const renderDashboardUI = () => {
    const user = state.currentUser;
    if(!user) return;
    
    els.userPointsHeader.textContent = user.current_points;
    document.getElementById('user-name-greeting').textContent = user.full_name;
    document.getElementById('user-name-sidebar').innerHTML = `${user.full_name} ${getTickImg(user.tick_type)}`;
    document.getElementById('user-points-sidebar').textContent = user.current_points;
    document.getElementById('user-level-sidebar').textContent = getUserLevel(user.lifetime_points).title;
    document.getElementById('user-avatar-sidebar').src = user.profile_img_url || getPlaceholderImage('80x80', getUserInitials(user.full_name));

    // Impact
    document.getElementById('impact-recycled').textContent = `${(user.impact?.total_plastic_kg || 0).toFixed(1)} kg`;
    document.getElementById('impact-co2').textContent = `${(user.impact?.co2_saved_kg || 0).toFixed(1)} kg`;
    document.getElementById('impact-events').textContent = user.impact?.events_attended || 0;
    
    // Featured Event Card Logic
    const eventCard = document.getElementById('dashboard-event-card');
    if (state.featuredEvent) {
        document.getElementById('dashboard-event-title').textContent = state.featuredEvent.title;
        document.getElementById('dashboard-event-desc').textContent = state.featuredEvent.description;
        eventCard.classList.remove('hidden');
    } else {
        eventCard.classList.add('hidden');
    }
};

const renderCheckinButtonState = () => {
    const streak = state.currentUser.checkInStreak || 0;
    document.getElementById('dashboard-streak-text-pre').textContent = streak;
    document.getElementById('dashboard-streak-text-post').textContent = streak;
    const btn = document.getElementById('daily-checkin-button');

    if (state.currentUser.isCheckedInToday) {
        btn.classList.add('checkin-completed'); 
        btn.classList.remove('from-yellow-400', 'to-orange-400', 'dark:from-yellow-500', 'dark:to-orange-500', 'bg-gradient-to-r');
        btn.onclick = null; 
    } else {
        btn.classList.remove('checkin-completed');
        btn.classList.add('from-yellow-400', 'to-orange-400', 'dark:from-yellow-500', 'dark:to-orange-500', 'bg-gradient-to-r');
        btn.onclick = openCheckinModal;
    }
};

// =========================================
// 9. MODALS (Check-in, Chatbot)
// =========================================

const openCheckinModal = () => {
    if (state.currentUser.isCheckedInToday) return;
    const modal = document.getElementById('checkin-modal');
    modal.classList.add('open');
    modal.classList.remove('invisible');
    
    const calContainer = document.getElementById('checkin-modal-calendar');
    calContainer.innerHTML = '';
    for (let i = -3; i <= 3; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const isToday = i === 0;
        calContainer.innerHTML += `
            <div class="flex flex-col items-center text-xs ${isToday ? 'font-bold text-yellow-600' : 'text-gray-400'}">
                <span>${['S','M','T','W','T','F','S'][d.getDay()]}</span>
                <span class="w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-yellow-100' : ''}">${d.getDate()}</span>
            </div>`;
    }
    document.getElementById('checkin-modal-streak').textContent = `${state.currentUser.checkInStreak} Days`;
    document.getElementById('checkin-modal-button-container').innerHTML = `
        <button onclick="handleDailyCheckin()" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg active:scale-95 transition-transform">
            Check-in &amp; Earn ${state.checkInReward} Points
        </button>`;
};
window.openCheckinModal = openCheckinModal;

const closeCheckinModal = () => {
    const modal = document.getElementById('checkin-modal');
    modal.classList.remove('open');
    setTimeout(() => modal.classList.add('invisible'), 300);
};
window.closeCheckinModal = closeCheckinModal;

const handleDailyCheckin = async () => {
    const btn = document.querySelector('#checkin-modal-button-container button');
    btn.disabled = true; btn.textContent = 'Checking in...';
    try {
        const { error } = await supabase.from('daily_checkins').insert({ user_id: state.currentUser.id, points_awarded: state.checkInReward });
        if (error) throw error;
        state.currentUser.isCheckedInToday = true;
        closeCheckinModal();
        await Promise.all([refreshUserData(), loadDashboardData()]);
    } catch (err) {
        alert('Check-in failed.');
        btn.disabled = false;
    }
};
window.handleDailyCheckin = handleDailyCheckin;

// Chatbot
const openChatbotModal = () => { document.getElementById('chatbot-modal').classList.add('open'); document.getElementById('chatbot-modal').classList.remove('invisible'); };
window.openChatbotModal = openChatbotModal;
const closeChatbotModal = () => { document.getElementById('chatbot-modal').classList.remove('open'); setTimeout(() => document.getElementById('chatbot-modal').classList.add('invisible'), 300); };
window.closeChatbotModal = closeChatbotModal;

// =========================================
// 10. ECO-STORE & PRODUCTS (Redesigned)
// =========================================

const renderRewards = () => {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    let products = [...state.products];
    const search = document.getElementById('store-search-input').value.toLowerCase();
    const sort = document.getElementById('sort-by-select').value;

    if (search) products = products.filter(p => p.name.toLowerCase().includes(search) || p.storeName.toLowerCase().includes(search));
    document.getElementById('store-search-clear').classList.toggle('hidden', !search);

    if (sort === 'points-lh') products.sort((a, b) => a.ecopoints_cost - b.ecopoints_cost);
    else if (sort === 'points-hl') products.sort((a, b) => b.ecopoints_cost - a.ecopoints_cost);
    else if (sort === 'price-lh') products.sort((a, b) => a.discounted_price - b.discounted_price);
    else products.sort((a, b) => b.popularity - a.popularity);

    if (products.length === 0) { grid.innerHTML = `<p class="col-span-2 text-center text-gray-500">No rewards found.</p>`; return; }

    products.forEach(p => {
        grid.innerHTML += `
            <div class="glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer" onclick="showProductDetailPage('${p.id}')">
                <img src="${p.images[0] || getPlaceholderImage()}" class="w-full h-40 object-cover">
                <div class="p-3 flex flex-col flex-grow">
                    <div class="flex items-center mb-1">
                        <img src="${p.storeLogo || getPlaceholderImage('20x20')}" class="w-4 h-4 rounded-full mr-1 border">
                        <p class="text-xs text-gray-500">${p.storeName}</p>
                    </div>
                    <h4 class="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">${p.name}</h4>
                    <div class="mt-auto pt-2 flex items-center justify-between">
                        <span class="font-bold text-green-600 text-sm">${p.ecopoints_cost} Pts</span>
                        <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">₹${p.discounted_price}</span>
                    </div>
                </div>
            </div>`;
    });
    lucide.createIcons();
};

const showProductDetailPage = (productId) => {
    const product = getProduct(productId);
    if (!product) return;
    
    const canAfford = state.currentUser.current_points >= product.ecopoints_cost;
    const container = document.getElementById('product-detail-page');

    // Features HTML
    const featuresHTML = (product.features || []).map(f => `
        <li class="flex items-start space-x-3 mb-2">
            <span class="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 mt-0.5"><i data-lucide="check" class="w-3 h-3"></i></span>
            <span class="text-sm text-gray-700 dark:text-gray-300">${f}</span>
        </li>`).join('');
    
    // Specs HTML
    const specsHTML = (product.specifications || []).map(s => `
        <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">${s.spec_key}</p>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">${s.spec_value}</p>
        </div>`).join('');

    container.innerHTML = `
        <div class="pb-24 bg-white dark:bg-gray-950 min-h-full">
            <div class="p-4 flex items-center">
                <button onclick="showPage('rewards')" class="p-2 hover:bg-gray-100 rounded-full"><i data-lucide="arrow-left" class="w-6 h-6 text-gray-700 dark:text-gray-200"></i></button>
                <span class="flex-grow text-center font-bold text-gray-800 dark:text-gray-100 text-lg">Reward Details</span>
                <div class="w-10"></div>
            </div>

            <div class="px-6">
                <div class="flex items-center justify-between mb-4">
                    <h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-50 leading-tight w-2/3">${product.name}</h1>
                    <span class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-bold">${product.ecopoints_cost} EcoPts</span>
                </div>
                
                <div class="flex items-center mb-6">
                    <img src="${product.storeLogo || getPlaceholderImage('40x40')}" class="w-8 h-8 rounded-full border mr-3">
                    <span class="text-gray-600 dark:text-gray-400 font-medium">${product.storeName}</span>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center"><i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Description</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">${product.description}</p>
                </div>

                ${featuresHTML ? `<div class="mb-6"><h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center"><i data-lucide="sparkles" class="w-4 h-4 mr-2"></i> Highlights</h3><ul>${featuresHTML}</ul></div>` : ''}

                ${specsHTML ? `<div class="mb-6"><h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center"><i data-lucide="info" class="w-4 h-4 mr-2"></i> Specifications</h3><div class="grid grid-cols-2 gap-3">${specsHTML}</div></div>` : ''}
                
                <div class="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                     <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center"><i data-lucide="ticket" class="w-4 h-4 mr-2"></i> How to Redeem</h3>
                     <p class="text-xs text-gray-500 dark:text-gray-400">Show the generated QR code at the canteen cashier (Counter 2) or store checkout to claim this offer.</p>
                </div>
            </div>

            <div class="fixed bottom-0 left-0 w-full p-4 glass-bottom-bar border-t border-gray-200 dark:border-gray-800 flex items-center justify-between z-20 max-w-md mx-auto right-0">
                <div>
                    <p class="text-xs text-gray-400 line-through">₹${product.original_price}</p>
                    <div class="flex items-baseline">
                        <span class="text-xl font-bold text-green-600 dark:text-green-400">₹${product.discounted_price}</span>
                        <span class="text-sm text-gray-500 mx-1">+</span>
                        <span class="text-lg font-bold text-green-600">${product.ecopoints_cost} Pts</span>
                    </div>
                </div>
                <button onclick="openPurchaseModal('${product.id}')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform active:scale-95 transition-transform ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}" ${!canAfford ? 'disabled' : ''}>
                    Redeem Offer
                </button>
            </div>
        </div>
    `;
    
    els.pages.forEach(p => p.classList.remove('active'));
    container.classList.add('active');
    lucide.createIcons();
};
window.showProductDetailPage = showProductDetailPage;

// Purchase Logic (Same as before, abbreviated)
const openPurchaseModal = (pid) => {
    const p = getProduct(pid);
    const modal = document.getElementById('purchase-modal');
    modal.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg text-gray-900 dark:text-gray-100">Confirm Redemption</h3>
            <button onclick="closePurchaseModal()"><i data-lucide="x" class="w-5 h-5 text-gray-500"></i></button>
        </div>
        <div class="flex items-center mb-6 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
            <img src="${p.images[0]}" class="w-16 h-16 rounded-lg object-cover mr-3">
            <div>
                <p class="font-bold text-sm text-gray-800 dark:text-gray-100">${p.name}</p>
                <p class="text-xs text-green-600 font-semibold">${p.ecopoints_cost} Points + ₹${p.discounted_price}</p>
            </div>
        </div>
        <button onclick="confirmPurchase('${p.id}')" class="w-full bg-green-600 text-white font-bold py-3 rounded-xl mb-2">Confirm</button>
    `;
    document.getElementById('purchase-modal-overlay').classList.remove('hidden');
    modal.classList.remove('translate-y-full');
    lucide.createIcons();
};
window.openPurchaseModal = openPurchaseModal;
const closePurchaseModal = () => {
    document.getElementById('purchase-modal').classList.add('translate-y-full');
    setTimeout(() => document.getElementById('purchase-modal-overlay').classList.add('hidden'), 300);
};
window.closePurchaseModal = closePurchaseModal;

const confirmPurchase = async (pid) => {
    try {
        const p = getProduct(pid);
        if (state.currentUser.current_points < p.ecopoints_cost) return alert('Insufficient points');
        const { data: order, error } = await supabase.from('orders').insert({
            user_id: state.currentUser.id, store_id: p.store_id, status: 'pending',
            total_points: p.ecopoints_cost, total_price: p.discounted_price
        }).select().single();
        if (error) throw error;
        await supabase.from('order_items').insert({
            order_id: order.id, product_id: p.id, points_each: p.ecopoints_cost, price_each: p.discounted_price
        });
        await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
        closePurchaseModal();
        await Promise.all([refreshUserData(), loadUserRewardsData()]);
        showPage('my-rewards');
    } catch (e) { alert('Error purchasing reward'); }
};
window.confirmPurchase = confirmPurchase;

// =========================================
// 11. CHALLENGES & QUIZ
// =========================================

const renderChallengesPage = () => {
    const list = document.getElementById('challenges-page-list');
    list.innerHTML = '';
    if (state.dailyChallenges.length === 0) { list.innerHTML = '<p class="text-center text-gray-500">No challenges today.</p>'; return; }

    state.dailyChallenges.forEach(c => {
        let actionBtn = '';
        if (c.isDisabled) {
            actionBtn = `<button disabled class="text-xs font-bold px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed">${c.buttonText}</button>`;
        } else if (c.type === 'Quiz') {
            actionBtn = `<button onclick="startQuizChallenge('${c.id}')" class="text-xs font-bold px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md">${c.buttonText}</button>`;
        } else if (c.type === 'Upload' || c.type === 'selfie') {
            actionBtn = `<button onclick="startCamera('${c.id}')" class="text-xs font-bold px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 shadow-md flex items-center"><i data-lucide="camera" class="w-3 h-3 mr-1"></i> ${c.buttonText}</button>`;
        } else {
            actionBtn = `<button class="text-xs font-bold px-4 py-2 rounded-full bg-blue-600 text-white">${c.buttonText}</button>`;
        }

        const bgColor = c.type === 'Quiz' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-800';
        const border = c.type === 'Quiz' ? 'border-purple-100 dark:border-purple-900/50' : 'border-transparent';

        list.innerHTML += `
            <div class="glass-card p-4 rounded-2xl flex items-center ${bgColor} border ${border}">
                <div class="w-12 h-12 rounded-xl ${c.type==='Quiz'?'bg-purple-100 text-purple-600':'bg-green-100 text-green-600'} flex items-center justify-center mr-4 flex-shrink-0">
                    <i data-lucide="${c.icon}" class="w-6 h-6"></i>
                </div>
                <div class="flex-grow">
                    <h3 class="font-bold text-gray-900 dark:text-gray-100">${c.title}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">${c.description}</p>
                    <div class="flex items-center justify-between mt-3">
                        <span class="text-xs font-bold ${c.type==='Quiz'?'text-purple-600':'text-green-600'}">+${c.points_reward} pts</span>
                        ${actionBtn}
                    </div>
                </div>
            </div>`;
    });
    lucide.createIcons();
};

// Quiz Logic
const startQuizChallenge = (quizId) => {
    const quizItem = state.dailyChallenges.find(c => c.id === quizId && c.type === 'Quiz');
    if (!quizItem || !quizItem.quizData) return;
    state.activeQuiz = quizItem.quizData;

    const modal = document.getElementById('eco-quiz-modal');
    const qText = document.getElementById('eco-quiz-modal-question');
    const optsDiv = document.getElementById('eco-quiz-modal-options');
    const resDiv = document.getElementById('eco-quiz-modal-result');

    qText.textContent = state.activeQuiz.question;
    resDiv.classList.add('hidden');
    optsDiv.innerHTML = '';
    
    // Parse options 
    let options = [];
    try { options = JSON.parse(state.activeQuiz.options); } catch(e) { options = ["Yes", "No"]; }

    options.forEach((opt, idx) => {
        optsDiv.innerHTML += `
            <button onclick="submitQuizAnswer(${idx})" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors">
                ${opt}
            </button>`;
    });

    modal.classList.add('open');
    modal.classList.remove('invisible');
};
window.startQuizChallenge = startQuizChallenge;

const submitQuizAnswer = async (selectedIndex) => {
    const isCorrect = selectedIndex === state.activeQuiz.correct_option_index;
    const resDiv = document.getElementById('eco-quiz-modal-result');
    const optsDiv = document.getElementById('eco-quiz-modal-options');

    // Disable buttons
    optsDiv.querySelectorAll('button').forEach(b => b.disabled = true);

    // Insert Submission 
    await supabase.from('quiz_submissions').insert({
        quiz_id: state.activeQuiz.id,
        user_id: state.currentUser.id,
        is_correct: isCorrect
    });

    // Award points if correct (Handled by Trigger or manual here. Let's do manual update for UI)
    if (isCorrect) {
        await supabase.from('points_ledger').insert({
            user_id: state.currentUser.id, source_type: 'quiz', source_id: state.activeQuiz.id,
            points_delta: state.activeQuiz.points_reward, description: 'Quiz won'
        });
        resDiv.innerHTML = `<p class="text-green-600 font-bold text-lg">Correct! +${state.activeQuiz.points_reward} Pts</p>`;
    } else {
        resDiv.innerHTML = `<p class="text-red-500 font-bold text-lg">Wrong Answer. Try again tomorrow!</p>`;
    }

    resDiv.classList.remove('hidden');
    setTimeout(async () => {
        closeEcoQuizModal();
        await Promise.all([refreshUserData(), loadChallengesAndQuizData()]);
    }, 2000);
};
window.submitQuizAnswer = submitQuizAnswer;

const closeEcoQuizModal = () => {
    document.getElementById('eco-quiz-modal').classList.remove('open');
    setTimeout(() => document.getElementById('eco-quiz-modal').classList.add('invisible'), 300);
};
window.closeEcoQuizModal = closeEcoQuizModal;

// =========================================
// 12. EVENTS (Redesigned)
// =========================================

const renderEventsPage = () => {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    if (state.events.length === 0) { list.innerHTML = '<p class="text-center text-gray-500">No upcoming events.</p>'; return; }

    state.events.forEach(e => {
        // Using Poster URL from SQL 
        const poster = e.poster_url || getPlaceholderImage('600x300', 'Event Poster');
        const participantsAvatars = Array(3).fill(0).map(() => `<div class="w-6 h-6 rounded-full border-2 border-white bg-gray-300 -ml-2"></div>`).join('');
        
        let btnHtml = '';
        if (e.status === 'registered' || e.status === 'attended') {
            btnHtml = `<button disabled class="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl mt-3">You're Going</button>`;
        } else {
            btnHtml = `<button onclick="rsvpEvent('${e.id}')" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-3 hover:bg-indigo-700 shadow-lg">RSVP Now</button>`;
        }

        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div class="relative h-48">
                    <img src="${poster}" class="w-full h-full object-cover">
                    <div class="absolute top-4 left-4 bg-white/90 backdrop-blur text-center rounded-xl px-3 py-2 shadow-lg">
                        <p class="text-xs font-bold text-red-500 uppercase tracking-widest">${e.dateObj.toLocaleString('default', { month: 'short' })}</p>
                        <p class="text-xl font-black text-gray-900">${e.dateObj.getDate()}</p>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight w-3/4">${e.title}</h3>
                        <span class="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-bold">${e.points_reward} Pts</span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-4">
                        <i data-lucide="map-pin" class="w-4 h-4 mr-1"></i> ${e.location || 'Campus Ground'}
                    </p>
                    <div class="flex items-center justify-between mt-4">
                        <div class="flex items-center pl-2">
                            ${participantsAvatars}
                            <span class="text-xs font-bold text-gray-500 ml-2">+${e.participantsCount} Going</span>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-400">Organizer</p>
                            <p class="text-sm font-bold text-gray-800 dark:text-gray-200">${e.organizer || 'Green Club'}</p>
                        </div>
                    </div>
                    ${btnHtml}
                </div>
            </div>`;
    });
    lucide.createIcons();
};

const rsvpEvent = async (eventId) => {
    try {
        const { error } = await supabase.from('event_attendance').insert({
            event_id: eventId, user_id: state.currentUser.id, status: 'registered'
        });
        if (error) throw error;
        alert('RSVP Confirmed!');
        await loadEventsData();
    } catch (e) { alert('RSVP Failed'); }
};
window.rsvpEvent = rsvpEvent;

// =========================================
// 13. CAMERA (Any Side Support)
// =========================================

const startCamera = async (challengeId) => {
    currentChallengeIdForCamera = challengeId;
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-feed');
    modal.classList.remove('hidden');
    
    await initCameraStream();
};
window.startCamera = startCamera;

const initCameraStream = async () => {
    const video = document.getElementById('camera-feed');
    if (currentCameraStream) {
        currentCameraStream.getTracks().forEach(track => track.stop());
    }
    try {
        // Using facingMode constraint
        currentCameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode } 
        });
        video.srcObject = currentCameraStream;
    } catch (err) {
        console.error("Camera error:", err);
        alert("Unable to access camera.");
        closeCameraModal();
    }
};

const switchCamera = async () => {
    // Toggle Mode
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    await initCameraStream();
};
window.switchCamera = switchCamera;

const capturePhoto = async () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Mirror if user facing
    if (currentFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
        if (!blob) return;
        closeCameraModal();
        // Upload Logic (Reuse existing)
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        try {
            const url = await uploadToCloudinary(file);
            await supabase.from('challenge_submissions').insert({
                challenge_id: currentChallengeIdForCamera, user_id: state.currentUser.id, submission_url: url, status: 'pending'
            });
            alert('Uploaded for review!');
            loadChallengesAndQuizData();
        } catch (e) { alert('Upload failed'); }
    }, 'image/jpeg', 0.8);
};
window.capturePhoto = capturePhoto;
const closeCameraModal = () => {
    const modal = document.getElementById('camera-modal');
    if (currentCameraStream) currentCameraStream.getTracks().forEach(t => t.stop());
    modal.classList.add('hidden');
};
window.closeCameraModal = closeCameraModal;

// =========================================
// 14. LEADERBOARD (Department & Student)
// =========================================
const renderStudentLeaderboard = () => {
    const list = document.getElementById('lb-list-container');
    const podium = document.getElementById('lb-podium-container');
    if(!state.leaderboard.length) { list.innerHTML = '<p class="text-center text-gray-500">No data.</p>'; return; }

    // Render Podium
    const top3 = state.leaderboard.slice(0, 3);
    podium.innerHTML = `<div class="podium">
        ${[top3[1], top3[0], top3[2]].map((u, i) => {
            if(!u) return '<div class="champ"></div>';
            const rank = i===1 ? 1 : i===0 ? 2 : 3;
            return `<div class="champ"><div class="badge ${rank===1?'gold':rank===2?'silver':'bronze'}"><img src="${u.profile_img_url||getPlaceholderImage()}" class="w-full h-full object-cover rounded-full"></div><div class="champ-name">${u.name}</div><div class="champ-points">${u.lifetime_points}</div></div>`;
        }).join('')}
    </div>`;

    // List
    list.innerHTML = '';
    state.leaderboard.slice(3).forEach((u, i) => {
        list.innerHTML += `<div class="item ${u.isCurrentUser?'is-me':''}"><div class="user"><span class="font-bold text-gray-400 mr-3">#${i+4}</span><img src="${u.profile_img_url||getPlaceholderImage()}" class="w-8 h-8 rounded-full mr-2"><div class="user-info"><strong>${u.name}</strong><span class="sub-class">${u.course}</span></div></div><div class="points-display">${u.lifetime_points}</div></div>`;
    });
};

const renderDepartmentLeaderboard = () => {
    const list = document.getElementById('eco-wars-page-list');
    list.innerHTML = state.departmentLeaderboard.map((d, i) => `
        <div class="glass-card p-4 rounded-2xl flex justify-between items-center mb-3" onclick="showDepartmentDetail('${d.name}')">
            <div class="flex items-center"><div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center mr-3">#${i+1}</div><div><h4 class="font-bold text-gray-800 dark:text-gray-100">${d.name}</h4><p class="text-xs text-gray-500">${d.points} Pts</p></div></div><i data-lucide="chevron-right" class="text-gray-400"></i>
        </div>`).join('');
    lucide.createIcons();
};
// Department detail function remains similar to previous logic
window.showDepartmentDetail = (name) => {
    const dept = state.departmentLeaderboard.find(d => d.name === name);
    if(!dept) return;
    document.getElementById('department-detail-page').innerHTML = `
        <div class="flex items-center mb-4"><button onclick="showPage('leaderboard')" class="mr-2"><i data-lucide="arrow-left"></i></button><h2 class="text-2xl font-bold dark:text-white">${name}</h2></div>
        <div class="grid grid-cols-3 gap-3">${dept.students.map(s => `<div class="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"><img src="${s.img||getPlaceholderImage()}" class="w-12 h-12 rounded-full mx-auto mb-1"><p class="text-xs font-bold dark:text-white truncate">${s.name}</p><p class="text-xs text-green-600">${s.points}</p></div>`).join('')}</div>`;
    showPage('department-detail-page');
    lucide.createIcons();
};

// =========================================
// 15. INIT
// =========================================
checkAuth();
