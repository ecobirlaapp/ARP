import { supabase } from './supabase-client.js';
import { state } from './state.js';
import { els, formatDate, getIconForChallenge, uploadToCloudinary, getPlaceholderImage, getTickImg } from './utils.js';
import { refreshUserData } from './app.js';

export const loadChallengesData = async () => {
    try {
        const { data: challenges, error: challengeError } = await supabase.from('challenges').select('*').eq('is_active', true);
        if (challengeError) throw challengeError;
        const { data: submissions, error: subError } = await supabase.from('challenge_submissions').select('challenge_id, status, submission_url').eq('user_id', state.currentUser.id);
        if (subError) throw subError;

        state.dailyChallenges = challenges.map(c => {
            const sub = submissions.find(s => s.challenge_id === c.id);
            let status = 'active', buttonText = 'Start', isDisabled = false;
            if (sub) {
                if (sub.status === 'approved' || sub.status === 'verified') { status = 'completed'; buttonText = 'Completed'; isDisabled = true; } 
                else if (sub.status === 'pending') { status = 'pending'; buttonText = 'Pending Review'; isDisabled = true; } 
                else if (sub.status === 'rejected') { status = 'active'; buttonText = 'Retry'; }
            } else {
                if (c.type === 'Upload') buttonText = 'Take Photo'; 
                else if (c.type === 'Quiz') buttonText = 'Start Quiz';
            }
            return { ...c, icon: getIconForChallenge(c.type), status, buttonText, isDisabled };
        });

        // Mix in a daily quiz if available
        await loadQuizData();

        if (document.getElementById('challenges').classList.contains('active')) renderChallengesPage();
    } catch (err) { console.error('Challenges Load Error:', err); }
};

// ---- QUIZ LOGIC ----
let currentQuiz = null;

export const loadQuizData = async () => {
    // Fetch today's quiz
    const today = new Date().toISOString().split('T')[0];
    const { data: quizzes } = await supabase.from('daily_quizzes').select('*').eq('available_date', today).limit(1);
    
    if (quizzes && quizzes.length > 0) {
        const quiz = quizzes[0];
        // Check if user already played
        const { data: sub } = await supabase.from('quiz_submissions').select('*').eq('quiz_id', quiz.id).eq('user_id', state.currentUser.id).single();
        
        const quizChallenge = {
            id: quiz.id,
            title: "Daily Eco Quiz",
            description: "Test your green knowledge!",
            points_reward: quiz.points_reward,
            type: 'Quiz',
            icon: 'brain',
            isQuizTable: true, // Flag to distinguish from generic challenges
            isDisabled: !!sub,
            buttonText: sub ? (sub.is_correct ? 'Correct!' : 'Played') : 'Start Quiz',
            status: sub ? 'completed' : 'active',
            rawQuiz: quiz
        };
        
        // Prepend quiz to challenges
        state.dailyChallenges = [quizChallenge, ...state.dailyChallenges];
    }
};

export const renderChallengesPage = () => {
    els.challengesList.innerHTML = '';
    if (state.dailyChallenges.length === 0) { els.challengesList.innerHTML = `<p class="text-sm text-center text-gray-500">No active challenges.</p>`; return; }
    
    state.dailyChallenges.forEach(c => {
        let buttonHTML = '';
        if (c.isDisabled) {
            buttonHTML = `<button disabled class="text-xs font-semibold px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 cursor-not-allowed">${c.buttonText}</button>`;
        } else if (c.isQuizTable) {
            buttonHTML = `<button onclick="openEcoQuizModal('${c.id}')" class="text-xs font-semibold px-3 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700">Play Quiz</button>`;
        } else if (c.type === 'Upload' || c.type === 'selfie') {
            buttonHTML = `<button onclick="startCamera('${c.id}')" data-challenge-id="${c.id}" class="text-xs font-semibold px-3 py-2 rounded-full bg-green-600 text-white hover:bg-green-700"><i data-lucide="camera" class="w-3 h-3 mr-1 inline-block"></i>${c.buttonText}</button>`;
        } else {
            buttonHTML = `<button class="text-xs font-semibold px-3 py-2 rounded-full bg-green-600 text-white">${c.buttonText}</button>`;
        }

        els.challengesList.innerHTML += `
            <div class="glass-card p-4 rounded-2xl flex items-start">
                <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-3"><i data-lucide="${c.icon}" class="w-5 h-5 text-green-600 dark:text-green-300"></i></div>
                <div class="flex-1"><h3 class="font-bold text-gray-900 dark:text-gray-100">${c.title}</h3><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${c.description}</p><div class="flex items-center justify-between mt-3"><span class="text-xs font-semibold text-green-700 dark:text-green-300">+${c.points_reward} pts</span>${buttonHTML}</div></div>
            </div>`;
    });
    if(window.lucide) window.lucide.createIcons();
};

// ---- EVENTS LOGIC (Redesigned) ----
export const loadEventsData = async () => {
    try {
        // Fetch events
        const { data: events, error } = await supabase.from('events').select('*').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true });
        if (error) throw error;

        // Fetch user's status for these events
        const { data: attendance } = await supabase.from('event_attendance').select('event_id, status').eq('user_id', state.currentUser.id);
        
        // Fetch participants for "Going" list (Get top 4 for avatars)
        // Note: In a real large app, you'd fetch this individually per event or use a view
        const eventIds = events.map(e => e.id);
        const { data: allAttendees } = await supabase.from('event_attendance')
            .select('event_id, user_id, users(id, full_name, profile_img_url)')
            .in('event_id', eventIds)
            .eq('status', 'registered'); // or confirmed

        state.events = events.map(e => {
            const att = attendance ? attendance.find(a => a.event_id === e.id) : null;
            
            // Get attendees for this event
            const attendees = allAttendees.filter(a => a.event_id === e.id);
            const attendeeCount = attendees.length;
            const attendeePreviews = attendees.slice(0, 4).map(a => a.users);

            let status = 'upcoming';
            if (att) { if (att.status === 'confirmed') status = 'attended'; else if (att.status === 'absent') status = 'missed'; else status = 'registered'; }
            
            return { 
                ...e, 
                dateObj: new Date(e.start_at),
                day: new Date(e.start_at).getDate(),
                month: new Date(e.start_at).toLocaleString('default', { month: 'short' }),
                points: e.points_reward, 
                status,
                attendeeCount,
                attendeePreviews,
                organizer: e.organizer || 'Green Club',
                poster_url: e.poster_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop'
            };
        });
        if (document.getElementById('events').classList.contains('active')) renderEventsPage();
    } catch (err) { console.error('Events Load Error:', err); }
};

export const renderEventsPage = () => {
    els.eventsList.innerHTML = '';
    if (state.events.length === 0) { els.eventsList.innerHTML = `<p class="text-sm text-center text-gray-500">No upcoming events.</p>`; return; }
    
    state.events.forEach(e => {
        let btnHTML = '';
        if (e.status === 'registered') {
            btnHTML = `<button class="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl" disabled>Registered</button>`;
        } else if (e.status === 'upcoming') {
            btnHTML = `<button onclick="rsvpEvent('${e.id}')" class="w-full bg-[#5C5CFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30">RSVP Now</button>`;
        } else {
            btnHTML = `<button class="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl" disabled>${e.status.toUpperCase()}</button>`;
        }

        // Avatar Stack
        let avatarsHTML = '';
        e.attendeePreviews.forEach((user, idx) => {
            avatarsHTML += `<img src="${user.profile_img_url || getPlaceholderImage('30x30')}" class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 -ml-3 first:ml-0 object-cover z-${10-idx}">`;
        });
        if (e.attendeeCount > 4) {
            avatarsHTML += `<div class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 -ml-3 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 z-0">+${e.attendeeCount - 4}</div>`;
        }

        // Card HTML
        els.eventsList.innerHTML += `
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                <div class="relative h-48 w-full">
                    <img src="${e.poster_url}" class="w-full h-full object-cover">
                    <div class="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-2 text-center min-w-[3.5rem] shadow-lg">
                        <span class="block text-xs font-bold text-red-500 uppercase tracking-wider">${e.month}</span>
                        <span class="block text-xl font-extrabold text-gray-900 dark:text-white">${e.day}</span>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white leading-tight w-3/4">${e.title}</h3>
                        <span class="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-md">${e.points} Pts</span>
                    </div>
                    <div class="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                        <i data-lucide="map-pin" class="w-4 h-4 mr-1"></i>
                        <span>${e.location || 'TBA'}</span>
                    </div>
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center cursor-pointer" onclick="openParticipantsModal('${e.id}')">
                            <div class="flex pl-3">${avatarsHTML}</div>
                            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-3">${e.attendeeCount > 0 ? `+${e.attendeeCount} Going` : 'Be the first!'}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-gray-400 block">Organizer</span>
                            <span class="text-xs font-bold text-gray-800 dark:text-gray-200">${e.organizer}</span>
                        </div>
                    </div>
                    ${btnHTML}
                </div>
            </div>
        `;
    });
    if(window.lucide) window.lucide.createIcons();
};

export const rsvpEvent = async (eventId) => {
    if(!confirm("Confirm registration for this event?")) return;
    try {
        const { error } = await supabase.from('event_attendance').insert({
            event_id: eventId,
            user_id: state.currentUser.id,
            status: 'registered' // Admin will change to 'confirmed' to award points
        });
        if (error) throw error;
        alert("You are registered! Attend the event to receive your points.");
        await loadEventsData();
        renderEventsPage();
    } catch (err) {
        console.error(err);
        alert("Failed to register. You might be already registered.");
    }
};

export const openParticipantsModal = async (eventId) => {
    const modal = document.getElementById('participants-modal');
    const list = document.getElementById('participants-list');
    list.innerHTML = '<p class="text-center">Loading...</p>';
    modal.classList.remove('hidden');
    
    const { data } = await supabase.from('event_attendance')
        .select('users(full_name, profile_img_url, course, tick_type)')
        .eq('event_id', eventId)
        .eq('status', 'registered');
        
    if(!data || data.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500">No participants yet.</p>';
        return;
    }
    
    list.innerHTML = '';
    data.forEach(d => {
        const u = d.users;
        list.innerHTML += `
            <div class="flex items-center space-x-3 p-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <img src="${u.profile_img_url || getPlaceholderImage('40x40')}" class="w-10 h-10 rounded-full object-cover">
                <div>
                    <p class="text-sm font-bold text-gray-800 dark:text-gray-200">${u.full_name} ${getTickImg(u.tick_type)}</p>
                    <p class="text-xs text-gray-500">${u.course}</p>
                </div>
            </div>
        `;
    });
};

export const closeParticipantsModal = () => {
    document.getElementById('participants-modal').classList.add('hidden');
};

// ---- CAMERA & QUIZ WRAPPERS ----

let currentCameraStream = null;
let currentChallengeIdForCamera = null;
let currentFacingMode = 'environment';

export const startCamera = async (challengeId) => {
    currentChallengeIdForCamera = challengeId;
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-feed');
    modal.classList.remove('hidden');
    await initCameraStream(video);
};

const initCameraStream = async (videoElement) => {
    if (currentCameraStream) {
        currentCameraStream.getTracks().forEach(track => track.stop());
    }
    try {
        currentCameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode } 
        });
        videoElement.srcObject = currentCameraStream;
    } catch (err) { 
        console.error("Camera Error", err);
        alert("Unable to access camera."); 
        closeCameraModal(); 
    }
};

export const switchCamera = async () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    const video = document.getElementById('camera-feed');
    await initCameraStream(video);
};

export const closeCameraModal = () => {
    const modal = document.getElementById('camera-modal');
    if (currentCameraStream) currentCameraStream.getTracks().forEach(track => track.stop());
    document.getElementById('camera-feed').srcObject = null;
    modal.classList.add('hidden');
};

export const capturePhoto = async () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    
    // Flip horizontally if using front camera for mirror effect
    if (currentFacingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    closeCameraModal();
    
    canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const btn = document.querySelector(`button[data-challenge-id="${currentChallengeIdForCamera}"]`);
        const originalText = btn ? btn.innerText : 'Uploading...';
        if(btn) { btn.innerText = 'Uploading...'; btn.disabled = true; }
        
        try {
            const imageUrl = await uploadToCloudinary(file);
            const { error } = await supabase.from('challenge_submissions').insert({ challenge_id: currentChallengeIdForCamera, user_id: state.currentUser.id, submission_url: imageUrl, status: 'pending' });
            if (error) throw error;
            await loadChallengesData();
            alert('Challenge submitted successfully!');
        } catch (err) {
            console.error('Camera Upload Error:', err); alert('Failed to upload photo.');
            if(btn) { btn.innerText = originalText; btn.disabled = false; }
        }
    }, 'image/jpeg', 0.8);
};

export const openEcoQuizModal = async (challengeId) => {
    const challenge = state.dailyChallenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.rawQuiz) return;
    
    currentQuiz = challenge.rawQuiz;
    
    document.getElementById('eco-quiz-modal').classList.add('open');
    document.getElementById('eco-quiz-modal').classList.remove('invisible');
    
    document.getElementById('eco-quiz-modal-question').textContent = currentQuiz.question;
    const optsContainer = document.getElementById('eco-quiz-modal-options');
    optsContainer.innerHTML = '';
    document.getElementById('eco-quiz-modal-result').classList.add('hidden');
    
    // Parse options (stored as JSONB in SQL)
    const options = typeof currentQuiz.options === 'string' ? JSON.parse(currentQuiz.options) : currentQuiz.options;
    
    options.forEach((opt, idx) => {
        optsContainer.innerHTML += `
            <button onclick="handleQuizAnswer(${idx})" class="w-full text-left p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-200 mb-2 relative group">
                <span class="mr-2 font-bold text-purple-600">${['A','B','C','D'][idx]}.</span> ${opt}
            </button>
        `;
    });
};

export const handleQuizAnswer = async (selectedIdx) => {
    if (!currentQuiz) return;
    
    const isCorrect = (selectedIdx === currentQuiz.correct_option_index);
    const resultDiv = document.getElementById('eco-quiz-modal-result');
    const optsContainer = document.getElementById('eco-quiz-modal-options');
    
    // Disable buttons
    const btns = optsContainer.querySelectorAll('button');
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === currentQuiz.correct_option_index) btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
        else if (idx === selectedIdx && !isCorrect) btn.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
    });

    resultDiv.classList.remove('hidden');
    
    if (isCorrect) {
        resultDiv.innerHTML = `<div class="text-green-600 font-bold text-lg mb-2">Correct! 🎉</div><p class="text-sm text-gray-500">You earned ${currentQuiz.points_reward} points.</p>`;
        // Submit to DB
        await supabase.from('quiz_submissions').insert({ quiz_id: currentQuiz.id, user_id: state.currentUser.id, is_correct: true });
        await supabase.from('points_ledger').insert({ user_id: state.currentUser.id, source_type: 'challenge', points_delta: currentQuiz.points_reward, description: 'Daily Quiz Win' });
        await refreshUserData();
    } else {
        resultDiv.innerHTML = `<div class="text-red-500 font-bold text-lg mb-2">Oops! That wasn't it.</div><p class="text-sm text-gray-500">Better luck next time.</p>`;
        await supabase.from('quiz_submissions').insert({ quiz_id: currentQuiz.id, user_id: state.currentUser.id, is_correct: false });
    }
    
    setTimeout(() => {
        closeEcoQuizModal();
        loadChallengesData(); // Refresh UI state
    }, 2500);
};

export const closeEcoQuizModal = () => {
    document.getElementById('eco-quiz-modal').classList.remove('open');
    setTimeout(() => document.getElementById('eco-quiz-modal').classList.add('invisible'), 300);
};

// Window Exports
window.renderChallengesPageWrapper = renderChallengesPage;
window.renderEventsPageWrapper = renderEventsPage;
window.startCamera = startCamera;
window.closeCameraModal = closeCameraModal;
window.capturePhoto = capturePhoto;
window.switchCamera = switchCamera;
window.openEcoQuizModal = openEcoQuizModal;
window.closeEcoQuizModal = closeEcoQuizModal;
window.handleQuizAnswer = handleQuizAnswer;
window.rsvpEvent = rsvpEvent;
window.openParticipantsModal = openParticipantsModal;
window.closeParticipantsModal = closeParticipantsModal;
