// Import the Supabase client
import { supabase } from './supabase-client.js';

// --- DOM Elements ---
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const authMessage = document.getElementById('auth-message');

// --- Helper Functions ---

/**
 * Shows an error message to the user.
 * @param {string} message The error message to display.
 */
function showMessage(message, isError = true) {
    authMessage.textContent = message;
    authMessage.className = isError ? 'text-red-500 text-sm text-center mb-4 h-5' : 'text-green-500 text-sm text-center mb-4 h-5';
}

/**
 * Toggles the loading state of a button.
 * @param {HTMLButtonElement} button The button element.
 * @param {boolean} isLoading Whether to show the loading state.
 */
function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const loader = button.querySelector('i');
    
    if (isLoading) {
        button.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        button.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

// --- Auth Logic ---

/**
 * Handles the login form submission.
 */
async function handleLogin(event) {
    event.preventDefault();
    setLoading(loginButton, true);
    showMessage('', false); // Clear previous messages

    const studentId = document.getElementById('login-studentid').value;
    const password = document.getElementById('login-password').value;

    // Step 1: Find the user's email from their Student ID
    // Note: This requires RLS to allow read access to the 'users' table 
    // for non-authenticated users, but *only* for the 'student_id' and 'email' columns.
    // If RLS is strict, this query will fail.
    // An alternative is to create a Supabase Edge Function (e.g., 'get-email-from-studentid')
    // that runs with elevated privileges.
    
    const { data: userData, error: userError } = await supabase
        .from('users') // From the public 'users' table
        .select('email') // Select their email
        .eq('student_id', studentId) // Where the student_id matches
        .single(); // Expect only one result

    if (userError || !userData) {
        showMessage("Student ID not found.");
        setLoading(loginButton, false);
        return;
    }

    // Step 2: Use the fetched email to log in
    const email = userData.email;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (authError) {
        // This error is usually "Invalid login credentials"
        showMessage(authError.message);
    } else if (authData.session) {
        // Login successful, redirect to the main app
        window.location.href = 'index.html';
    }
    setLoading(loginButton, false);
}


/**
 * Checks if a user is already logged in.
 * If so, redirects them to the main app.
 */
async function checkUserSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        // User is already logged in, redirect to index.html
        window.location.href = 'index.html';
    }
    // If no session, do nothing, let them log in.
}

// --- Event Listeners ---
loginForm.addEventListener('submit', handleLogin);

// Check for existing session on page load
checkUserSession();
