// =========================================
// 1. IMPORTS & SETUP
// =========================================
import { supabase } from './supabase-client.js';

// Cloudinary Config
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dnia8lb2q/image/upload";
const CLOUDINARY_PRESET = "EcoBirla_avatars";

// =========================================
// 2. APPLICATION STATE
// =========================================

let state = {
    currentUser: null,
    userAuth: null,
    checkInReward: 10,
    leaderboard: [],      // All users fetched for leaderboard/dept calc
    departmentStats: [],  // Calculated department data
    stores: [],
    products: [],
    history: [],
    dailyChallenges: [],  // Challenges + User Status
    events: [],
    userRewards: [],
    levels: [
        { level: 1, title: 'Green Starter', minPoints: 0, nextMin: 1001 },
        { level: 2, title: 'Eco Learner', minPoints: 1001, nextMin: 2001 },
        { level: 3, title: 'Sustainability Leader', minPoints: 2001, nextMin: 4001 },
    ]
};

// =========================================
// 3. AUTHENTICATION
// =========================================

const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.replace('login.html');
        return;
    }
    state.userAuth = session.user;
    await initializeApp();
};

const initializeApp = async () => {
    // 1. Load User Profile
    const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', state.userAuth.id)
        .single();

    if (error || !userProfile) {
        alert('Could not load user profile. Logging out.');
        handleLogout();
        return;
    }

    state.currentUser = userProfile;

    // 2. Initial Render (Dashboard)
    await loadDashboardData();
    renderDashboard();
    
    setTimeout(() => document.getElementById('app-loading').classList.add('loaded'), 500);
    lucide.createIcons();

    // 3. Load Background Data
    Promise.all([
        loadStoreAndProductData(),
        loadLeaderboardData(), // Loads users & calculates dept stats
        loadHistoryData(),
        loadChallengesData(),
        loadEventsData(),
        loadUserRewardsData()
    ]);
};

const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('login.html');
};

// =========================================
// 4. DATA LOADING
// =========================================

const loadDashboardData = async () => {
    const userId = state.currentUser.id;
    const today = new Date().toISOString().split('T')[0];

    const [
        { data: checkinData },
        { data: streakData },
        { data: impactData },
        { data: eventData }
    ] = await Promise.all([
        supabase.from('daily_checkins').select('id').eq('user_id', userId).eq('checkin_date', today).maybeSingle(),
        supabase.from('user_streaks').select('current_streak').eq('user_id', userId).maybeSingle(),
        supabase.from('user_impact').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('events').select('title, description').order('start_at', { ascending: true }).limit(1)
    ]);

    state.currentUser.isCheckedInToday = !!checkinData;
    state.currentUser.checkInStreak = streakData ? streakData.current_streak : 0;
    state.currentUser.impact = impactData || { total_plastic_kg: 0, co2_saved_kg: 0, events_attended: 0 };
    state.featuredEvent = (eventData && eventData[0]) || { title: "No upcoming events", description: "Stay tuned!" };
};

const loadLeaderboardData = async () => {
    // Fetch top 1000 users to get accurate department stats
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, course, lifetime_points, profile_img_url')
        .order('lifetime_points', { ascending: false })
        .limit(1000);

    if (error) return;

    state.leaderboard = data.map(u => ({
        ...u,
        name: u.full_name,
        initials: (u.full_name || '..').split(' ').map(n => n[0]).join('').substring(0, 2),
        isCurrentUser: u.id === state.currentUser.id,
        // Parse Department: Remove first 2 chars (e.g., "SYBAF" -> "BAF")
        department: u.course && u.course.length > 2 ? u.course.substring(2).toUpperCase() : (u.course || 'OTHER')
    }));

    calculateDepartmentStats();

    if (document.getElementById('leaderboard').classList.contains('active')) {
        // If currently on leaderboard, refresh view
        if(document.getElementById('leaderboard-tab-student').classList.contains('active')) {
             renderStudentLeaderboard();
        } else {
             renderDepartmentLeaderboard();
        }
    }
};

const calculateDepartmentStats = () => {
    const deptMap = {};

    state.leaderboard.forEach(user => {
        const dept = user.department;
        if (!deptMap[dept]) {
            deptMap[dept] = { name: dept, points: 0, students: [] };
        }
        deptMap[dept].points += (user.lifetime_points || 0);
        deptMap[dept].students.push(user);
    });

    state.departmentStats = Object.values(deptMap).sort((a, b) => b.points - a.points);
};

const loadChallengesData = async () => {
    // 1. Get active challenges
    const { data: challenges, error: cError } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true);

    // 2. Get user's submissions for these challenges
    const { data: submissions, error: sError } = await supabase
        .from('challenge_submissions')
        .select('challenge_id, status')
        .eq('user_id', state.currentUser.id);

    if (cError || !challenges) return;

    // 3. Merge Status
    state.dailyChallenges = challenges.map(c => {
        const sub = submissions ? submissions.find(s => s.challenge_id === c.id) : null;
        let uiStatus = 'active'; // Default: ready to start
        
        if (sub) {
            if (sub.status === 'approved' || sub.status === 'verified') uiStatus = 'completed';
            else if (sub.status === 'rejected') uiStatus = 'active'; // Allow retry? Or 'rejected'
            else uiStatus = 'pending';
        }

        return {
            ...c,
            uiStatus: uiStatus,
            icon: getIconForChallenge(c.type)
        };
    });

    if (document.getElementById('challenges').classList.contains('active')) {
        renderChallengesPage();
    }
};

const loadEventsData = async () => {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_at', { ascending: true });

    if (error) return;

    // Simplified: Assume all are upcoming for now. 
    // In prod, join with 'event_attendance' similar to challenges.
    state.events = data.map(e => ({
        ...e,
        date: new Date(e.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: 'upcoming'
    }));
};

const loadStoreAndProductData = async () => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            id, name, description, original_price, discounted_price, ecopoints_cost, store_id,
            stores ( name, logo_url ),
            product_images ( image_url, sort_order )
        `)
        .eq('is_active', true);

    if (error) return;

    state.products = data.map(p => ({
        ...p,
        images: p.product_images.sort((a,b) => a.sort_order - b.sort_order).map(i => i.image_url),
        storeName: p.stores.name,
        storeLogo: p.stores.logo_url
    }));
};

const loadHistoryData = async () => {
    const { data } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

    state.history = (data || []).map(item => ({
        type: item.source_type,
        description: item.description,
        points: item.points_delta,
        date: new Date(item.created_at).toLocaleDateString(),
        icon: getIconForHistory(item.source_type)
    }));
};

const loadUserRewardsData = async () => {
    const { data } = await supabase
        .from('orders')
        .select(`
            id, created_at, status,
            order_items (
                products ( name, product_images ( image_url ), stores ( name ) )
            )
        `)
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false });

    state.userRewards = (data || []).map(o => {
        const p = o.order_items[0]?.products;
        if (!p) return null;
        return {
            id: o.id,
            date: new Date(o.created_at).toLocaleDateString(),
            status: o.status,
            name: p.name,
            store: p.stores.name,
            image: p.product_images[0]?.image_url
        };
    }).filter(Boolean);
};

const refreshUserData = async () => {
    const { data } = await supabase.from('users').select('*').eq('id', state.currentUser.id).single();
    if (data) {
        state.currentUser = data;
        document.getElementById('user-points-header').textContent = data.current_points;
        document.getElementById('user-points-sidebar').textContent = data.current_points;
    }
};

// =========================================
// 5. UI RENDERING
// =========================================

const renderDashboard = () => {
    const u = state.currentUser;
    document.getElementById('user-points-header').textContent = u.current_points;
    document.getElementById('user-name-greeting').textContent = u.full_name.split(' ')[0];
    
    // Sidebar
    document.getElementById('user-name-sidebar').textContent = u.full_name;
    document.getElementById('user-points-sidebar').textContent = u.current_points;
    document.getElementById('user-avatar-sidebar').src = u.profile_img_url || getPlaceholderImage(u.full_name);
    
    // Impact
    const i = u.impact;
    document.getElementById('impact-recycled').textContent = `${i.total_plastic_kg} kg`;
    document.getElementById('impact-co2').textContent = `${i.co2_saved_kg} kg`;
    document.getElementById('impact-events').textContent = i.events_attended;

    // Check-in Button
    const btn = document.getElementById('daily-checkin-button');
    if (u.isCheckedInToday) {
        btn.classList.add('checkin-completed');
        btn.classList.remove('bg-gradient-to-r'); // Remove gradient
        btn.querySelector('h3').textContent = "Check-in Complete";
        document.getElementById('checkin-subtext').style.display = 'none';
        document.getElementById('checkin-done-text').classList.remove('hidden');
        document.getElementById('checkin-check-icon').classList.remove('hidden');
        btn.onclick = null;
    } else {
        document.getElementById('dashboard-streak-text').textContent = `${u.checkInStreak} Day Streak`;
        btn.onclick = openCheckinModal;
    }
};

const renderChallengesPage = () => {
    const container = document.getElementById('challenges-page-list');
    container.innerHTML = '';

    if (state.dailyChallenges.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 mt-4">No active challenges.</p>`;
        return;
    }

    state.dailyChallenges.forEach(c => {
        let btnHTML = '';
        
        // "Take Photo" -> "Pending Review" -> "Completed" logic
        if (c.uiStatus === 'completed') {
            btnHTML = `<button disabled class="text-xs font-bold px-4 py-2 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Completed</button>`;
        } else if (c.uiStatus === 'pending') {
             btnHTML = `<button disabled class="text-xs font-bold px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Pending Review</button>`;
        } else {
            // Active
            if (c.type === 'quiz') {
                btnHTML = `<button onclick="openEcoQuizModal('${c.id}')" class="text-xs font-bold px-4 py-2 rounded-full bg-green-600 text-white shadow-lg hover:scale-105 transition-transform">Start Quiz</button>`;
            } else {
                // Upload/Camera type
                btnHTML = `<button onclick="startCamera('${c.id}')" class="text-xs font-bold px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg hover:scale-105 transition-transform flex items-center gap-2"><i data-lucide="camera" class="w-3 h-3"></i> Take Photo</button>`;
            }
        }

        container.innerHTML += `
            <div class="glass-card p-4 rounded-2xl flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400">
                    <i data-lucide="${c.icon}" class="w-6 h-6"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-gray-900 dark:text-gray-100">${c.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">${c.description}</p>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-xs font-bold text-green-600 dark:text-green-400">+${c.points_reward} pts</span>
                        ${btnHTML}
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
};

const renderStudentLeaderboard = () => {
    // Only show top 20 students
    const list = state.leaderboard.slice(0, 20);
    const podium = document.getElementById('lb-podium-container');
    const listContainer = document.getElementById('lb-list-container');
    
    if (list.length === 0) {
        listContainer.innerHTML = `<p class="text-center p-4">No data available.</p>`;
        return;
    }

    const [first, second, third, ...rest] = list;

    // Helper to render user image or fallback
    const getImg = (u) => u?.profile_img_url || getPlaceholderImage(u?.name);

    podium.innerHTML = `
        <div class="podium">
            <div class="champ">
                <div class="badge silver"><img src="${getImg(second)}" class="w-full h-full object-cover"></div>
                <div class="champ-name">${second?.name || '-'}</div>
                <div class="champ-points">${second?.lifetime_points || 0} pts</div>
                <div class="rank">2nd</div>
            </div>
            <div class="champ">
                <div class="badge gold"><img src="${getImg(first)}" class="w-full h-full object-cover"></div>
                <div class="champ-name">${first?.name || '-'}</div>
                <div class="champ-points">${first?.lifetime_points || 0} pts</div>
                <div class="rank">1st</div>
            </div>
            <div class="champ">
                <div class="badge bronze"><img src="${getImg(third)}" class="w-full h-full object-cover"></div>
                <div class="champ-name">${third?.name || '-'}</div>
                <div class="champ-points">${third?.lifetime_points || 0} pts</div>
                <div class="rank">3rd</div>
            </div>
        </div>
    `;

    listContainer.innerHTML = rest.map((u, i) => `
        <div class="item ${u.isCurrentUser ? 'is-me' : ''}">
            <div class="user">
                <span class="text-xs font-bold text-gray-400 w-6">#${i + 4}</span>
                <img src="${getImg(u)}" class="w-9 h-9 rounded-full object-cover bg-gray-100">
                <div class="user-info ml-2">
                    <strong>${u.name} ${u.isCurrentUser ? '(You)' : ''}</strong>
                    <span class="sub-class">${u.department}</span>
                </div>
            </div>
            <div class="points-display">${u.lifetime_points} pts</div>
        </div>
    `).join('');
};

const renderDepartmentLeaderboard = () => {
    const container = document.getElementById('eco-wars-page-list');
    container.innerHTML = '';

    state.departmentStats.forEach((dept, idx) => {
        container.innerHTML += `
            <div class="glass-card p-4 rounded-2xl flex items-center justify-between mb-3 cursor-pointer hover:border-green-400 transition-colors"
                 onclick="showDepartmentDetail('${dept.name}')">
                <div class="flex items-center gap-4">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        #${idx + 1}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">${dept.name}</h3>
                        <p class="text-xs text-gray-500">${dept.students.length} Students</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold text-green-600 dark:text-green-400">${dept.points.toLocaleString()} pts</p>
                    <p class="text-[10px] text-gray-400">Click to view</p>
                </div>
            </div>
        `;
    });
};

// =========================================
// 6. FEATURE LOGIC
// =========================================

// --- Department Drill-down ---
const showDepartmentDetail = (deptName) => {
    const dept = state.departmentStats.find(d => d.name === deptName);
    if (!dept) return;

    const page = document.getElementById('department-detail-page');
    page.innerHTML = `
        <div class="p-6">
            <div class="flex items-center mb-6">
                <button onclick="showPage('leaderboard')" class="p-2 bg-white dark:bg-gray-800 rounded-full mr-4 shadow-sm">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">${deptName} Department</h2>
                    <p class="text-sm text-gray-500">${dept.students.length} Students Contributing</p>
                </div>
            </div>
            
            <div class="list space-y-3">
                ${dept.students.sort((a,b) => b.lifetime_points - a.lifetime_points).map((u, i) => `
                    <div class="item">
                        <div class="user">
                            <span class="text-xs font-bold text-gray-400 w-6">#${i + 1}</span>
                            <img src="${u.profile_img_url || getPlaceholderImage(u.name)}" class="w-9 h-9 rounded-full object-cover bg-gray-100">
                            <div class="user-info ml-2">
                                <strong>${u.name}</strong>
                            </div>
                        </div>
                        <div class="points-display">${u.lifetime_points} pts</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showPage('department-detail-page');
    lucide.createIcons();
};
window.showDepartmentDetail = showDepartmentDetail;

// --- File Upload (Cloudinary) ---
const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.secure_url) return data.secure_url;
        else throw new Error('Upload failed');
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        alert('Image upload failed. Please try again.');
        return null;
    }
};

// --- Profile Picture Upload ---
const triggerProfileUpload = () => document.getElementById('profile-upload-input').click();
window.triggerProfileUpload = triggerProfileUpload;

document.getElementById('profile-upload-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state on avatar (optional)
    const avatarImg = document.getElementById('profile-avatar');
    const oldSrc = avatarImg.src;
    avatarImg.style.opacity = '0.5';

    const imageUrl = await uploadToCloudinary(file);
    
    if (imageUrl) {
        // Update Supabase
        const { error } = await supabase
            .from('users')
            .update({ profile_img_url: imageUrl })
            .eq('id', state.currentUser.id);

        if (!error) {
            state.currentUser.profile_img_url = imageUrl;
            // Update all UI instances
            renderDashboard();
            document.getElementById('profile-avatar').src = imageUrl;
            alert('Profile picture updated!');
        } else {
            alert('Failed to save profile picture.');
            avatarImg.src = oldSrc;
        }
    } else {
        avatarImg.src = oldSrc;
    }
    avatarImg.style.opacity = '1';
    e.target.value = ''; // Reset input
});

// --- Camera & Challenge Upload ---
let currentChallengeId = null;
let cameraStream = null;

const startCamera = async (challengeId) => {
    currentChallengeId = challengeId;
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-feed');
    
    modal.classList.remove('hidden');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = cameraStream;
    } catch (err) {
        console.error(err);
        // If camera fails, fallback to file upload
        document.getElementById('challenge-file-input').click();
        closeCameraModal(); 
    }
};
window.startCamera = startCamera;

const closeCameraModal = () => {
    const modal = document.getElementById('camera-modal');
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
    }
    modal.classList.add('hidden');
};
window.closeCameraModal = closeCameraModal;

const capturePhoto = async () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
        closeCameraModal();
        await handleChallengeSubmission(blob);
    }, 'image/jpeg', 0.8);
};
window.capturePhoto = capturePhoto;

// Handle file input fallback for challenges
document.getElementById('challenge-file-input').addEventListener('change', async (e) => {
    if (e.target.files[0] && currentChallengeId) {
        await handleChallengeSubmission(e.target.files[0]);
    }
    e.target.value = '';
});

const handleChallengeSubmission = async (fileOrBlob) => {
    // 1. Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(fileOrBlob);
    if (!imageUrl) return;

    // 2. Insert into Supabase
    const { error } = await supabase
        .from('challenge_submissions')
        .insert({
            user_id: state.currentUser.id,
            challenge_id: currentChallengeId,
            submission_url: imageUrl,
            status: 'pending' // Matches prompt requirement
        });

    if (error) {
        console.error(error);
        alert('Submission failed. Try again.');
    } else {
        alert('Photo uploaded successfully! Pending review.');
        await loadChallengesData(); // Refresh UI to show "Pending Review"
    }
};

// --- Helpers ---
const getPlaceholderImage = (name) => 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=10B981&color=fff&size=128`;

const getIconForChallenge = (type) => {
    const icons = { 'quiz': 'brain', 'upload': 'camera', 'selfie': 'camera', 'scan': 'qr-code' };
    return icons[type] || 'star';
};

const getIconForHistory = (type) => {
    const icons = { 'checkin': 'calendar-check', 'event': 'ticket', 'challenge': 'trophy', 'plastic': 'recycle', 'order': 'shopping-bag' };
    return icons[type] || 'activity';
};

// =========================================
// 7. NAVIGATION & LISTENERS
// =========================================

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Toggle leaf animation for leaderboard
    const leaves = document.getElementById('lb-leaf-layer');
    if(leaves) {
        if(pageId === 'leaderboard' && document.getElementById('leaderboard-tab-student').classList.contains('active')) {
            leaves.classList.remove('hidden');
        } else {
            leaves.classList.add('hidden');
        }
    }

    // Refresh data if needed
    if (pageId === 'leaderboard') loadLeaderboardData();
    if (pageId === 'rewards') renderRewards();

    toggleSidebar(true); // Close sidebar
    window.scrollTo(0, 0);
};
window.showPage = showPage;

const toggleSidebar = (forceClose = false) => {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (forceClose) {
        sb.classList.add('-translate-x-full');
        ov.classList.add('hidden', 'opacity-0');
    } else {
        sb.classList.toggle('-translate-x-full');
        ov.classList.toggle('hidden');
        ov.classList.toggle('opacity-0');
    }
};
window.toggleSidebar = toggleSidebar;

// Leaderboard Tabs
const showLeaderboardTab = (tab) => {
    const studentTab = document.getElementById('leaderboard-tab-student');
    const deptTab = document.getElementById('leaderboard-tab-dept');
    const studentContent = document.getElementById('leaderboard-content-student');
    const deptContent = document.getElementById('leaderboard-content-department');

    if (tab === 'student') {
        studentTab.classList.add('active');
        deptTab.classList.remove('active');
        studentContent.classList.remove('hidden');
        deptContent.classList.add('hidden');
        document.getElementById('lb-leaf-layer').classList.remove('hidden');
        renderStudentLeaderboard();
    } else {
        deptTab.classList.add('active');
        studentTab.classList.remove('active');
        deptContent.classList.remove('hidden');
        studentContent.classList.add('hidden');
        document.getElementById('lb-leaf-layer').classList.add('hidden');
        renderDepartmentLeaderboard();
    }
};
window.showLeaderboardTab = showLeaderboardTab;

// Daily Check-in
const openCheckinModal = () => {
    const m = document.getElementById('checkin-modal');
    m.classList.remove('invisible');
    setTimeout(() => m.classList.add('open'), 10);
    
    // Generate mini calendar
    const cal = document.getElementById('checkin-modal-calendar');
    cal.innerHTML = '';
    for(let i=-3; i<=3; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const isToday = i===0;
        cal.innerHTML += `
            <div class="flex flex-col items-center text-xs ${isToday?'font-bold text-green-600':'text-gray-400'}">
                <span>${['S','M','T','W','T','F','S'][d.getDay()]}</span>
                <span class="w-8 h-8 flex items-center justify-center rounded-full ${isToday?'bg-green-100':''}">${d.getDate()}</span>
            </div>`;
    }
    
    document.getElementById('checkin-modal-streak').textContent = `${state.currentUser.checkInStreak} Days`;
    document.getElementById('checkin-modal-button-container').innerHTML = `
        <button onclick="handleDailyCheckin()" class="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-95 transition-transform">
            Check-in & Earn 10 Pts
        </button>`;
};
window.openCheckinModal = openCheckinModal;

const closeCheckinModal = () => {
    const m = document.getElementById('checkin-modal');
    m.classList.remove('open');
    setTimeout(() => m.classList.add('invisible'), 300);
};
window.closeCheckinModal = closeCheckinModal;

const handleDailyCheckin = async () => {
    const btn = document.querySelector('#checkin-modal-button-container button');
    btn.textContent = "Checking in...";
    btn.disabled = true;

    const { error } = await supabase.from('daily_checkins').insert({
        user_id: state.currentUser.id,
        points_awarded: 10
    });

    if (error) {
        alert("Already checked in today!");
    } else {
        state.currentUser.isCheckedInToday = true;
        // Trigger update on server side handles points, but we update local state for immediate feedback
        state.currentUser.current_points += 10;
        state.currentUser.checkInStreak += 1;
        renderDashboard();
    }
    closeCheckinModal();
};
window.handleDailyCheckin = handleDailyCheckin;

// Rewards (Search & Sort) - Reuse logic from previous, simplified here
const renderRewards = () => {
    const grid = document.getElementById('product-grid');
    const search = document.getElementById('store-search-input').value.toLowerCase();
    const sort = document.getElementById('sort-by-select').value;
    
    let items = state.products.filter(p => p.name.toLowerCase().includes(search));
    
    if (sort === 'points-lh') items.sort((a,b) => a.ecopoints_cost - b.ecopoints_cost);
    else if (sort === 'points-hl') items.sort((a,b) => b.ecopoints_cost - a.ecopoints_cost);
    // Add other sorts as needed

    grid.innerHTML = items.map(p => `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col" onclick="openPurchaseModal('${p.id}')">
            <img src="${p.images[0] || getPlaceholderImage(p.name)}" class="w-full h-32 object-cover bg-gray-100">
            <div class="p-3 flex flex-col flex-grow">
                <p class="text-xs text-gray-500">${p.storeName}</p>
                <h4 class="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">${p.name}</h4>
                <div class="mt-auto pt-2 flex items-center justify-between">
                     <span class="text-green-600 font-bold text-sm">${p.ecopoints_cost} Pts</span>
                </div>
            </div>
        </div>
    `).join('') || '<p class="col-span-2 text-center text-gray-500">No rewards found.</p>';
};
document.getElementById('store-search-input').addEventListener('input', renderRewards);
document.getElementById('sort-by-select').addEventListener('change', renderRewards);

// Purchase Modal Logic
const openPurchaseModal = (pid) => {
    const p = state.products.find(x => x.id === pid);
    if(!p) return;
    // Simple confirm for now
    if(confirm(`Redeem ${p.name} for ${p.ecopoints_cost} points?`)) {
        handlePurchase(p);
    }
};
window.openPurchaseModal = openPurchaseModal;

const handlePurchase = async (product) => {
    if(state.currentUser.current_points < product.ecopoints_cost) {
        alert("Not enough points!");
        return;
    }
    
    // 1. Create Order
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            user_id: state.currentUser.id,
            store_id: product.store_id,
            total_points: product.ecopoints_cost,
            status: 'confirmed' // Auto-confirm for demo
        })
        .select()
        .single();

    if(error) { alert("Error creating order"); return; }

    // 2. Create Order Item
    await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        points_each: product.ecopoints_cost
    });

    alert("Reward redeemed! Check 'My Orders'.");
    refreshUserData();
};

// Initialize
checkAuth();

// Event Listeners for UI
document.getElementById('sidebar-toggle-btn').addEventListener('click', () => toggleSidebar());
document.getElementById('logout-button').addEventListener('click', handleLogout);
