// Import the Supabase client
import { supabase } from './supabase-client.js';

// --- DOM Elements ---
// We'll get these *after* the DOM has loaded
let loginForm;
let loginButton;
let authMessage;

// --- Helper Functions ---

/**
 * Shows an error message to the user.
 * @param {string} message The error message to display.
 */
function showMessage(message, isError = true) {
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = isError ? 'text-red-500 text-sm text-center mb-4 h-5' : 'text-green-500 text-sm text-center mb-4 h-5';
    }
}

/**
 * Toggles the loading state of a button.
 * @param {HTMLButtonElement} button The button element.
 * @param {boolean} isLoading Whether to show the loading state.
 */
function setLoading(button, isLoading) {
    if (!button) return;
    const btnText = button.querySelector('.btn-text');
    const loader = button.querySelector('i');
    
    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (loader) loader.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (loader) loader.classList.add('hidden');
    }
}

// --- Auth Logic ---

/**
 * Handles the login form submission by calling our Edge Function.
 */
async function handleLogin(event) {
    event.preventDefault();
    setLoading(loginButton, true);
    showMessage('', false); // Clear previous messages

    const studentId = document.getElementById('login-studentid').value;
    const password = document.getElementById('login-password').value;

    // Step 1: Securely call the Edge Function
    const { data, error } = await supabase.functions.invoke('login-with-studentid', {
        body: { studentId, password },
    });

    if (error) {
        // This could be a function error (e.g., 500)
        console.error("Function error:", error);
        showMessage("An error occurred. Please try again.");
    } else if (data.error) {
        // This is an error message from *within* our function
        showMessage(data.error);
    } else if (data.session) {
        // Step 2: The function returned a valid session.
        // We must manually set the session in the client-side library.
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        
        if (sessionError) {
            console.error("Session set error:", sessionError);
            showMessage("Login failed. Please try again.");
        } else {
            // Login successful, redirect to the main app
            window.location.href = 'index.html';
        }
    } else {
        // Fallback for unknown issues
        showMessage("An unexpected error occurred.");
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
// Wait for the DOM to be fully loaded before adding listeners
// This fixes the error "Cannot read properties of null (reading 'addEventListener')"
document.addEventListener('DOMContentLoaded', () => {
    // Now assign the elements
    loginForm = document.getElementById('login-form');
    loginButton = document.getElementById('login-button');
    authMessage = document.getElementById('auth-message');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error("Login form not found!");
    }

    // Check for existing session on page load
    checkUserSession();
});
