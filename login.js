import { supabase } from "./supabase-client.js";

console.log("Login script loaded.");

document.getElementById("loginForm").addEventListener("submit", handleLogin);

async function handleLogin(evt) {
    evt.preventDefault();

    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("loginError");
    const loginBtn = document.getElementById("loginBtn");

    errorBox.classList.add("hidden");

    if (!/^\d{7}$/.test(studentId)) {
        return showError("Student ID must be exactly 7 digits.");
    }

    loginBtn.disabled = true;
    loginBtn.innerText = "Verifying...";

    // Hidden Supabase email mapping
    const email = `${studentId}@ecobirla.internal`;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showError("Invalid Student ID or Password.");
        loginBtn.disabled = false;
        loginBtn.innerText = "Login";
        return;
    }

    console.log("Logged in:", data.user);
    window.location.href = "index.html"; // redirect to main app
}

function showError(message) {
    const errorBox = document.getElementById("loginError");
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}
