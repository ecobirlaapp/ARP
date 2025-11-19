import { supabase } from './supabase-client.js';
import { state } from './state.js';
import { getTickImg, getPlaceholderImage, getUserInitials } from './utils.js';

export const loadDashboardData = async () => {
    try {
        const userId = state.currentUser.id;
        const today = new Date().toISOString().split('T')[0];

        const [
            { data: checkinData, error: checkinError },
            { data: streakData, error: streakError },
            { data: impactData, error: impactError },
            { data: eventData, error: eventError }
        ] = await Promise.all([
            supabase.from('daily_checkins').select('id').eq('user_id', userId).eq('checkin_date', today).limit(1),
            supabase.from('user_streaks').select('current_streak').eq('user_id', userId).single(),
            supabase.from('user_impact').select('*').eq('user_id', userId).single(),
            supabase.from('events').select('title, description').order('start_at', { ascending: true }).limit(1)
        ]);
        
        if (checkinError && checkinError.code !== 'PGRST116') console.error('Checkin Load Error:', checkinError.message);

        state.currentUser.isCheckedInToday = (checkinData && checkinData.length > 0);
        state.currentUser.checkInStreak = streakData ? streakData.current_streak : 0;
        state.currentUser.impact = impactData || { total_plastic_kg: 0, co2_saved_kg: 0, events_attended: 0 };
        state.featuredEvent = (eventData && eventData.length > 0) ? eventData[0] : { title: "No upcoming events", description: "Check back soon!" };
        
    } catch (err) {
        console.error('Dashboard Data Error:', err);
    }
};

export const renderDashboard = () => {
    if (!state.currentUser) return; 
    
    // UI Updates
    document.getElementById('user-points-header').textContent = state.currentUser.current_points;
    document.getElementById('user-name-greeting').textContent = state.currentUser.full_name;
    document.getElementById('user-name-sidebar').innerHTML = `${state.currentUser.full_name} ${getTickImg(state.currentUser.tick_type)}`;
    document.getElementById('user-points-sidebar').textContent = state.currentUser.current_points;
    document.getElementById('user-avatar-sidebar').src = state.currentUser.profile_img_url || getPlaceholderImage('80x80', getUserInitials(state.currentUser.full_name));

    document.getElementById('impact-recycled').textContent = `${(state.currentUser.impact?.total_plastic_kg || 0).toFixed(1)} kg`;
    document.getElementById('impact-co2').textContent = `${(state.currentUser.impact?.co2_saved_kg || 0).toFixed(1)} kg`;
    document.getElementById('impact-events').textContent = state.currentUser.impact?.events_attended || 0;
    
    document.getElementById('dashboard-event-title').textContent = state.featuredEvent?.title || '...';
    document.getElementById('dashboard-event-desc').textContent = state.featuredEvent?.description || '...';

    renderCheckinButtonState();
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

// Check-in Modal Logic
export const openCheckinModal = () => {
    if (state.currentUser.isCheckedInToday) return;
    const modal = document.getElementById('checkin-modal');
    modal.classList.add('open');
    modal.classList.remove('invisible');
    
    const cal = document.getElementById('checkin-modal-calendar');
    cal.innerHTML = '';
    for (let i = -3; i <= 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const isToday = i === 0;
        cal.innerHTML += `
            <div class="flex flex-col items-center text-xs ${isToday ? 'font-bold text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}">
                <span class="mb-1">${['S','M','T','W','T','F','S'][d.getDay()]}</span>
                <span class="w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-yellow-100 dark:bg-yellow-900' : ''}">${d.getDate()}</span>
            </div>
        `;
    }
    document.getElementById('checkin-modal-streak').textContent = `${state.currentUser.checkInStreak} Days`;
    document.getElementById('checkin-modal-button-container').innerHTML = `
        <button onclick="handleDailyCheckin()" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 shadow-lg transition-transform active:scale-95">
            Check-in &amp; Earn ${state.checkInReward} Points
        </button>
    `;
};

export const handleDailyCheckin = async (refreshCallback) => {
    const btn = document.querySelector('#checkin-modal-button-container button');
    btn.disabled = true; btn.textContent = 'Checking in...';
    try {
        const { error } = await supabase.from('daily_checkins').insert({ user_id: state.currentUser.id, points_awarded: state.checkInReward });
        if (error) throw error;
        state.currentUser.isCheckedInToday = true;
        document.getElementById('checkin-modal').classList.remove('open');
        setTimeout(() => document.getElementById('checkin-modal').classList.add('invisible'), 300);
        if(refreshCallback) refreshCallback(); // Call app.js refresh
    } catch (err) {
        alert(`Failed to check in: ${err.message}`);
        btn.disabled = false;
    }
};
