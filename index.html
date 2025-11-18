<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoBirla - Green Campus Initiative</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Linking to the style.css file as requested -->
    <link rel="stylesheet" href="style.css"> 
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Supabase Client Library -->
    <!-- We add this so the client is available for app.js and supabase-client.js -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        inter: ['Inter', 'sans-serif'],
                    },
                },
            },
        }
    </script>
    <style>
        /* Inline styles for specific requested features */
        
        /* Camera Modal Overlay */
        #camera-modal {
            transition: opacity 0.3s ease-in-out, visibility 0.3s;
            z-index: 60; 
        }
        #camera-modal.open {
            opacity: 1;
            visibility: visible;
        }

        /* Modern Grey Check-in Completed State */
        .checkin-completed {
            background: #F3F4F6 !important; /* Light Grey */
            background-image: none !important;
            box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) !important;
            border: 1px solid #E5E7EB !important;
            color: #9CA3AF !important; /* Grey text */
            cursor: default !important;
            transform: none !important;
        }
        .dark .checkin-completed {
            background: #1F2937 !important; /* Dark Grey */
            border-color: #374151 !important;
            color: #6B7280 !important;
        }

        /* Hide specific elements inside the button when completed */
        .checkin-completed .checkin-hide-on-complete {
            display: none !important;
        }

        /* Change text color for specific children when completed */
        .checkin-completed h3, 
        .checkin-completed span, 
        .checkin-completed i,
        .checkin-completed p {
            color: #6B7280 !important; /* Cool Grey */
        }
        .dark .checkin-completed h3, 
        .dark .checkin-completed span, 
        .dark .checkin-completed i,
        .dark .checkin-completed p {
            color: #9CA3AF !important;
        }

        /* Remove Shadow/Border from AI Chatbot Button */
        #chatbot-btn img {
            border: none !important;
            box-shadow: none !important;
        }
        
        /* Slider for Product Details */
        .slider-container {
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
        }
        .slider-item {
            scroll-snap-align: center;
        }
        .slider-dot {
            transition: all 0.3s ease;
        }
        .slider-dot.active {
            background-color: #10B981;
            transform: scale(1.25);
        }
        .dark .slider-dot.active {
            background-color: #34D399;
        }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">

    <!-- This input is used for the "upload" type challenges -->
    <input type="file" id="challenge-file-input" accept="image/*" class="hidden">

    <!-- App Loader -->
    <div id="app-loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <div class="app-loader-logo">
            <img src="https://i.ibb.co/d00b4v0n/Eco-Birla-2-modified.png"
                 class="w-40 h-40 object-contain"
                 alt="Loading Logo">
        </div>
        <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-4">
            A BKBNC GREEN CLUB INITIATIVE
        </p>
    </div>

    <!-- Sidebar Overlay -->
    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 z-30 opacity-0 hidden"></div>
    
    <!-- Sidebar -->
    <div id="sidebar" class="fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 z-40 transform -translate-x-full flex flex-col">
        <!-- Sidebar content from index (5).html -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <img id="user-avatar-sidebar" src="https://placehold.co/80x80/cccccc/FFFFFF?text=USER" class="w-16 h-16 rounded-full mb-3 border-2 border-green-500" alt="User Avatar">
            <h2 id="user-name-sidebar" class="text-xl font-bold text-gray-800 dark:text-gray-100">Loading...</h2>
            <p id="user-level-sidebar" class="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1"></p>
            <p class="text-sm text-green-600 dark:text-green-400 font-semibold">
                <span id="user-points-sidebar">0</span> EcoPoints
            </p>
        </div>

        <nav class="flex-grow p-4 space-y-2">
            <button onclick="showPage('profile')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="user" class="w-5 h-5 mr-3"></i>Profile
            </button>
            <button onclick="showPage('my-rewards')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="archive" class="w-5 h-5 mr-3"></i>Orders
            </button>
            <button onclick="showPage('history')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="history" class="w-5 h-5 mr-3"></i>History
            </button>
            <button onclick="showPage('leaderboard')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="users" class="w-5 h-5 mr-3"></i>Leaderboard
            </button>
            <button onclick="showPage('events')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="calendar" class="w-5 h-5 mr-3"></i>All Events
            </button>
            
            <button onclick="showPage('redeem-code')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="ticket" class="w-5 h-5 mr-3"></i>Redeem Code
            </button>

            <div class="pt-2 border-t border-gray-200 dark:border-gray-700"></div>

            <button onclick="showPage('about')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="info" class="w-5 h-5 mr-3"></i>About Us
            </button>
            <button onclick="showPage('help')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="help-circle" class="w-5 h-5 mr-3"></i>Help & Support
            </button>
            <button onclick="showPage('change-password')" class="sidebar-nav-item w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <i data-lucide="key-round" class="w-5 h-5 mr-3"></i>Change Password
            </button>

            <div class="pt-2 border-t border-gray-200 dark:border-gray-700"></div>
            <div class="flex items-center justify-between p-3 rounded-lg text-gray-700 dark:text-gray-300">
                <div class="flex items-center">
                    <i id="theme-icon" data-lucide="sun" class="w-5 h-5 mr-3"></i>
                    <span id="theme-text">Light Mode</span>
                </div>
                <button id="theme-toggle-btn" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-200 dark:bg-gray-600">
                    <span class="sr-only">Toggle theme</span>
                    <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform translate-x-1 dark:translate-x-6"></span>
                </button>
            </div>
        </nav>

        <div class="p-4">
            <button id="logout-button" class="w-full bg-red-100 text-red-700 font-bold py-3 px-4 rounded-lg hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 flex items-center justify-center">
                <i data-lucide="log-out" class="w-5 h-5 mr-2"></i>
                <span>Log Out</span>
            </button>
        </div>

        <div class="p-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-center text-gray-400 dark:text-gray-500">EcoBirla v7.0 (Supabase)</p>
        </div>
    </div>

    <!-- App Container -->
    <div class="app-container bg-white dark:bg-gray-950">

        <!-- Header -->
        <header class="bg-white dark:bg-gray-950 sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-800">
            <div class="flex justify-between items-center">
                <div class="w-1/3">
                    <button id="sidebar-toggle-btn" class="p-2 -ml-2 text-gray-600 dark:text-gray-300">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="w-1/3 text-center">
                    <button onclick="showPage('dashboard')" class="text-2xl font-extrabold text-green-700 dark:text-green-500">
                        EcoBirla
                    </button>
                </div>
                <div class="w-1/3 flex justify-end">
                    <button onclick="showPage('ecopoints')" class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 pr-3 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <i data-lucide="leaf" class="w-5 h-5 text-green-500 mx-1"></i>
                        <span id="user-points-header" class="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">0</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content (Pages) -->
        <main class="main-content bg-gray-50 dark:bg-gray-900">

            <!-- Dashboard Page -->
            <div id="dashboard" class="page active p-6">
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Hi, <span id="user-name-greeting"></span>!
                    </h2>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Let's make our campus greener today.
                    </p>
                </div>

                <div id="dashboard-event-card" class="glass-green-card p-5 mb-6 hidden"> <!-- Hidden by default -->
                    <div class="flex items-center mb-2">
                        <i data-lucide="calendar-check" class="w-5 h-5 mr-2 text-emerald-100"></i>
                        <h3 class="font-bold tracking-tight text-emerald-50">Upcoming Event</h3>
                    </div>
                    <p id="dashboard-event-title" class="text-lg font-semibold mb-1 text-emerald-50"></p>
                    <p id="dashboard-event-desc" class="text-sm opacity-95 mb-4 text-emerald-100"></p>
                    <button onclick="showPage('events')" class="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-50/15 text-emerald-50 border border-emerald-100/40">
                        View All Events
                    </button>
                </div>

                <button id="daily-checkin-button" class="w-full bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-500 dark:to-orange-500 p-5 rounded-2xl mb-6 flex items-center justify-between relative overflow-hidden transition-all duration-300">
                   <div>
                        <h3 class="text-lg font-bold text-white dark:text-gray-900">Daily Check-in</h3>
                        <p id="checkin-subtext" class="text-sm text-white/90 dark:text-gray-800 checkin-hide-on-complete">Tap here to get your daily points!</p>
                        <p id="checkin-done-text" class="text-sm hidden font-medium">Come back tomorrow!</p>
                    </div>
                    <div class="flex items-center space-x-2 bg-white/25 dark:bg-black/20 text-white dark:text-gray-900 py-2 px-3 rounded-full checkin-hide-on-complete">
                        <i data-lucide="sun" class="w-6 h-6"></i>
                        <span id="dashboard-streak-text" class="text-sm font-bold">0 Day Streak</span>
                    </div>
                    <div id="checkin-check-icon" class="hidden">
                        <i data-lucide="check-circle" class="w-8 h-8"></i>
                    </div>
                </button>

                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Your Impact</h3>
                <div class="grid grid-cols-3 gap-4 mb-8">
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i data-lucide="leaf" class="w-8 h-8 text-green-500 mx-auto mb-2"></i>
                        <p id="impact-co2" class="font-bold text-lg dark:text-gray-100">0 kg</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">CO₂ Saved</p>
                    </div>
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i data-lucide="recycle" class="w-8 h-8 text-blue-500 mx-auto mb-2"></i>
                        <p id="impact-recycled" class="font-bold text-lg dark:text-gray-100">0 kg</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Plastic Recycled</p>
                    </div>
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i data-lucide="calendar-check" class="w-8 h-8 text-purple-500 mx-auto mb-2"></i>
                        <p id="impact-events" class="font-bold text-lg dark:text-gray-100">0</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Events Attended</p>
                    </div>
                </div>

                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-8">Eco Tip of the Week</h3>
                <div class="glass-card border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded-xl" role="alert">
                    <div class="flex">
                        <div class="py-1">
                            <i data-lucide="lightbulb" class="w-5 h-5 text-blue-500 mr-3"></i>
                        </div>
                        <div>
                            <p class="font-bold dark:text-blue-200">Unplug chargers!</p>
                            <p class="text-sm">Chargers and electronics still draw power even when not in use. Unplug them to save energy.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Page -->
            <div id="profile" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Profile</h2>
                <div class="space-y-6">
                    <div class="glass-card rounded-2xl overflow-hidden">
                        <div class="bg-green-500 h-24"></div>
                        <div class="p-5 -mt-16 flex flex-col items-center">
                            <div class="relative group">
                                <img id="profile-avatar" src="https://placehold.co/80x80/cccccc/FFFFFF?text=USER" class="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 object-cover">
                                <!-- Add upload button here if needed -->
                            </div>
                            <h3 id="profile-name" class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3 flex items-center">Loading...</h3>
                            <p id="profile-email" class="text-gray-500 dark:text-gray-400"></p>
                            <p id="profile-joined" class="text-sm text-gray-400 dark:text-gray-500 mt-1"></p>

                            <div class="w-full px-4 mt-4">
                                <div class="flex justify-between items-center mb-1">
                                    <span id="profile-level-title" class="text-sm font-semibold text-green-600 dark:text-green-400"></span>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">Lv. <span id="profile-level-number"></span></span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div id="profile-level-progress" class="bg-green-500 h-2.5 rounded-full" style="width: 0%"></div>
                                </div>
                                <p id="profile-level-next" class="text-xs text-right text-gray-500 dark:text-gray-400 mt-1"></p>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card p-6 rounded-2xl">
                        <h4 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Personal Info</h4>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Student ID</span>
                                <span id="profile-student-id" class="font-semibold text-gray-900 dark:text-gray-100"></span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Course</span>
                                <span id="profile-course" class="font-semibold text-gray-900 dark:text-gray-100"></span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Mobile</span>
                                <span id="profile-mobile" class="font-semibold text-gray-900 dark:text-gray-100"></span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Email</span>
                                <span id="profile-email-personal" class="font-semibold text-gray-900 dark:text-gray-100"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Leaderboard Page -->
            <div id="leaderboard" class="page p-6 relative">
                 <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Eco Hall of Champions</h2>

                <div class="mb-6 p-1 bg-gray-200 dark:bg-gray-800 leaderboard-switch flex relative z-10">
                    <button id="leaderboard-tab-student" onclick="showLeaderboardTab('student')" class="leaderboard-tab-btn flex-1 py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                        Eco Warriors
                    </button>
                    <button id="leaderboard-tab-dept" onclick="showLeaderboardTab('department')" class="leaderboard-tab-btn flex-1 py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                        Departments War
                    </button>
                </div>

                <div id="leaderboard-content-department" class="hidden relative z-10">
                    <div class="glass-card p-4 rounded-2xl mb-6">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Department Rankings</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Monthly competition between departments.
                        </p>
                    </div>
                    <div id="eco-wars-page-list" class="space-y-3"></div>
                </div>

                <div id="leaderboard-content-student" class="relative">
                    <div id="lb-leaf-layer" class="leaf-layer hidden">
                        <div class="leaf"></div><div class="leaf"></div><div class="leaf"></div><div class="leaf"></div>
                        <div class="leaf"></div><div class="leaf"></div><div class="leaf"></div><div class="leaf"></div>
                    </div>
                    
                    <div class="lb-container">
                        <div id="lb-podium-container" class="podium-wrapper"></div>
                        <div id="lb-list-container" class="list"></div>
                    </div>
                </div>
            </div>

            <!-- Challenges Page -->
            <div id="challenges" class="page p-6">
                 <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Daily Challenges</h2>
                <div id="challenges-page-list" class="space-y-4"></div>
            </div>

            <!-- EcoPoints Page -->
            <div id="ecopoints" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">My EcoPoints</h2>

                <div class="glass-card p-6 rounded-2xl text-center mb-6">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Your current balance is</p>
                    <p class="text-5xl font-extrabold text-green-600 dark:text-green-400 my-2" id="ecopoints-balance"></p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Keep up the great work!</p>
                </div>

                <div class="glass-card p-6 rounded-2xl mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Level Progress</h3>
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-1">
                            <span id="ecopoints-level-title" class="text-sm font-semibold text-green-600 dark:text-green-400"></span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">Lv. <span id="ecopoints-level-number"></span></span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div id="ecopoints-level-progress" class="bg-green-500 h-2.5 rounded-full" style="width: 0%"></div>
                        </div>
                        <p id="ecopoints-level-next" class="text-xs text-right text-gray-500 dark:text-gray-400 mt-1"></p>
                    </div>
                </div>

                <div class="glass-card p-6 rounded-2xl mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">All Levels</h3>
                    <div id="all-levels-list" class="space-y-4"></div>
                </div>
                
                <div class="glass-card p-6 rounded-2xl mb-6">
                     <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Transactions</h4>
                    <div id="ecopoints-recent-activity" class="space-y-3"></div>
                </div>
            </div>

            <!-- Events Page -->
            <div id="events" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">All Events</h2>
                <div id="event-list" class="space-y-4"></div>
            </div>

            <!-- Rewards (Store) Page -->
            <div id="rewards" class="page p-6">
                <!-- Content from index (5).html -->
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Eco-Store</h2>
                    <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Rewards
                    </span>
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Redeem your EcoPoints for canteen coupons, coffee and exclusive college merch.
                </p>

                <div class="space-y-4 mb-5">
                    <div>
                        <label for="store-search-input" class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                            Search store or reward
                        </label>
                        <div class="relative">
                            <input id="store-search-input"
                                   type="text"
                                   placeholder="Try “Hoodie” or “Canteen coupon”"
                                   class="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-full bg-white/80 dark:bg-gray-900/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                            <button id="store-search-clear"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 hidden">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label for="sort-by-select" class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                            Sort by
                        </label>
                        <select id="sort-by-select"
                                class="custom-select w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80 dark:bg-gray-900/90 dark:text-white">
                            <option value="popularity">Popularity</option>
                            <option value="points-lh">Points: Low to High</option>
                            <option value="points-hl">Points: High to Low</option>
                            <option value="price-lh">Price: Low to High</option>
                            <option value="price-hl">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div id="product-grid" class="grid grid-cols-2 gap-4"></div>
            </div>
            
            <!-- Redeem Code Page -->
            <div id="redeem-code" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Redeem Code</h2>
                
                <div class="glass-card p-6 rounded-2xl mb-6">
                    <div class="flex justify-center mb-6">
                        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                            <i data-lucide="ticket" class="w-10 h-10 text-emerald-600 dark:text-emerald-400"></i>
                        </div>
                    </div>
                    
                    <p class="text-center text-gray-600 dark:text-gray-300 mb-6">
                        Got a special code from an event or challenge? Enter it below to claim your bonus EcoPoints!
                    </p>

                    <form id="redeem-code-form" class="space-y-6">
                        <div>
                            <label for="redeem-input" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">10-Digit Code</label>
                            <input id="redeem-input" name="redeem-input" type="text" maxlength="10" required
                                   class="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl text-center text-2xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-300 dark:placeholder-gray-500"
                                   placeholder="XXXXXXXXXX">
                        </div>

                        <div id="redeem-message" class="text-sm text-center h-5"></div>

                        <button type="submit" id="redeem-submit-btn"
                                class="w-full btn-eco-gradient text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:opacity-90 transform transition-transform active:scale-95">
                            Redeem Points
                        </button>
                    </form>
                </div>
            </div>

            <!-- Placeholder Pages -->
            <div id="store-detail-page" class="page dark:bg-gray-900"></div>
            <div id="product-detail-page" class="page dark:bg-gray-900"></div>
            <div id="user-profile-page" class="page dark:bg-gray-900"></div>
            <div id="department-detail-page" class="page dark:bg-gray-900"></div>

            <!-- My Rewards (Orders) Page -->
            <div id="my-rewards" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Orders</h2>
                <div id="all-rewards-list" class="space-y-4"></div>
            </div>

            <!-- History Page -->
            <div id="history" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Activity History</h2>
                <div id="history-list" class="space-y-3"></div>
            </div>

            <!-- About Page -->
            <div id="about" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">About Us</h2>
                <div class="glass-card p-6 rounded-2xl space-y-4">
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Welcome to the Green Campus Challenge, an initiative by the College Green Club to promote sustainability and eco-friendly practices among students.
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Our mission is to reduce our campus's carbon footprint through fun challenges, engaging events, and rewarding positive actions. Join us in making our campus a greener place, one EcoPoint at a time!
                    </p>
                </div>
            </div>

            <!-- Help Page -->
            <div id="help" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Help & Support</h2>
                <div class="glass-card p-6 rounded-2xl space-y-4">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Frequently Asked Questions</h3>
                    <div class="text-left space-y-4 text-sm">
                        <div>
                            <p class="font-semibold text-gray-800 dark:text-gray-200">How do I earn points?</p>
                            <p class="text-gray-600 dark:text-gray-300">You can earn EcoPoints by participating in events, completing challenges, and logging your eco-friendly activities.</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800 dark:text-gray-200">How do I redeem rewards?</p>
                            <p class="text-gray-600 dark:text-gray-300">Navigate to the 'Store' tab to purchase a reward. Then, go to 'Orders' to find your active coupons and redeem them.</p>
                        </div>
                    </div>
                    <div class="border-t dark:border-gray-700 pt-6 mt-6">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h3>
                        <p class="text-gray-600 dark:text-gray-300 mt-2">
                            For further assistance, please email us at
                            <a href="#" class="text-green-600 dark:text-green-400 font-medium">support@greencampus.edu</a>.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Change Password Page -->
            <div id="change-password" class="page p-6">
                <!-- Content from index (5).html -->
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Change Password</h2>
                <div class="glass-card p-6 rounded-2xl">
                    <form id="change-password-form" class="space-y-6">
                        <div>
                            <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                            <div class="mt-1">
                                <input id="new-password" name="new-password" type="password" required
                                       class="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
                                       placeholder="••••••••">
                            </div>
                        </div>

                        <div id="password-message" class="text-sm text-center"></div>

                        <div>
                            <button type="submit" id="change-password-button"
                                    class="w-full flex justify-center py-3 px-4 rounded-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </main>

        <!-- Chatbot Button -->
        <button onclick="openChatbotModal()" id="chatbot-btn" class="fixed z-20 bottom-24 right-6 w-16 h-16 flex items-center justify-center hover:scale-105 transition-transform">
             <img src="https://i.ibb.co/7xwsMnBc/Pngtree-green-earth-globe-clip-art-16672659-1.png" alt="EcoBot" class="w-full h-full object-contain drop-shadow-xl">
        </button>

        <!-- Bottom Navigation -->
        <nav class="glass-bottom-bar border-t border-gray-200/70 dark:border-gray-800">
            <!-- Content from index (5).html -->
            <div class="flex justify-around">
                <button onclick="showPage('dashboard')" class="nav-item active flex-1 text-center py-3 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400">
                    <i data-lucide="layout-dashboard" class="w-6 h-6 mx-auto"></i><span class="text-xs block mt-1">Dashboard</span>
                </button>
                <button onclick="showPage('leaderboard')" class="nav-item flex-1 text-center py-3 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400">
                    <i data-lucide="users" class="w-6 h-6 mx-auto"></i><span class="text-xs block mt-1">Leaderboard</span>
                </button>
                <button onclick="showPage('challenges')" class="nav-item flex-1 text-center py-3 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400">
                    <i data-lucide="award" class="w-6 h-6 mx-auto"></i><span class="text-xs block mt-1">Challenges</span>
                </button>
                <button onclick="showPage('rewards')" class="nav-item flex-1 text-center py-3 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400">
                    <i data-lucide="gift" class="w-6 h-6 mx-auto"></i><span class="text-xs block mt-1">Store</span>
                </button>
            </div>
        </nav>
    </div>

    <!-- Modals -->

    <!-- Check-in Modal -->
    <div id="checkin-modal" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center opacity-0 invisible" onclick="closeCheckinModal()">
        <!-- Content from index (5).html -->
        <div id="checkin-modal-content" class="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md p-6 transform translate-y-full" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Check-in</h3>
                <button onclick="closeCheckinModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <p class="text-center text-gray-600 dark:text-gray-300 mb-2">Your current streak:</p>
            <p id="checkin-modal-streak" class="text-center text-5xl font-extrabold text-yellow-600 dark:text-yellow-400 mb-6">0 Days</p>

            <div id="checkin-modal-calendar" class="flex justify-center space-x-2 mb-6"></div>
            <div id="checkin-modal-button-container"></div>
        </div>
    </div>

    <!-- Purchase Modal -->
    <div id="purchase-modal-overlay" class="fixed inset-0 bg-black/50 z-40 hidden" onclick="closePurchaseModal()"></div>
    <div id="purchase-modal" class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-t-2xl z-50 p-6 transform translate-y-full transition-transform duration-300 ease-in-out"></div>

    <!-- QR Modal -->
    <div id="qr-modal-overlay" class="fixed inset-0 bg-black/50 z-40 hidden" onclick="closeQrModal()"></div>
    <div id="qr-modal" class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-t-2xl z-50 p-6 transform translate-y-full transition-transform duration-300 ease-in-out"></div>

    <!-- Chatbot Modal -->
    <div id="chatbot-modal" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center opacity-0 invisible" onclick="closeChatbotModal()">
        <!-- Content from index (5).html -->
        <div id="chatbot-modal-content" class="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md h-[70vh] flex flex-col transform translate-y-full" onclick="event.stopPropagation()">
            <div class="flex-shrink-0 flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <img src="https://i.ibb.co/7xwsMnBc/Pngtree-green-earth-globe-clip-art-16672659-1.png" alt="Bot" class="w-8 h-8 mr-2 object-contain">
                    EcoBot
                </h3>
                <button onclick="closeChatbotModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            <div id="chatbot-messages" class="flex-grow p-4 space-y-4 overflow-y-auto">
                <div class="flex">
                    <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg rounded-bl-none max-w-xs">
                        <p class="text-sm text-gray-800 dark:text-gray-100">Hi! I'm EcoBot. How can I help you with your sustainability questions today?</p>
                    </div>
                </div>
            </div>
            <div class="flex-shrink-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                <form id="chatbot-form" class="flex items-center space-x-2">
                    <input id="chatbot-input" type="text" placeholder="Ask about recycling..." class="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-full focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white">
                    <button type="submit" class="bg-green-600 text-white p-2.5 rounded-full">
                        <i data-lucide="send" class="w-5 h-5"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Eco-Quiz Modal -->
    <div id="eco-quiz-modal" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center opacity-0 invisible" onclick="closeEcoQuizModal()">
        <!-- Content from index (5).html -->
        <div id="eco-quiz-modal-content" class="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md p-6 transform translate-y-full" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Eco-Quiz</h3>
                <button onclick="closeEcoQuizModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div id="eco-quiz-modal-body">
                <p id="eco-quiz-modal-question" class="text-lg text-gray-700 dark:text-gray-200 mb-4">What does the 'Rs' in 'Reduce, Reuse, Recycle' stand for?</p>
                <div id="eco-quiz-modal-options" class="space-y-3">
                    <button onclick="handleQuizAnswer(true, 'c2')" class="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Recycle</button>
                    <button onclick="handleQuizAnswer(false, 'c2')" class="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Rethink</button>
                    <button onclick="handleQuizAnswer(false, 'c2')" class="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Refuse</button>
                </div>
                <div id="eco-quiz-modal-result" class="hidden text-center mt-4"></div>
            </div>
        </div>
    </div>

    <!-- Camera Modal -->
    <div id="camera-modal" class="fixed inset-0 bg-black z-50 hidden flex flex-col">
        <!-- Content from index (5).html -->
        <div class="relative flex-grow bg-black">
            <video id="camera-feed" autoplay playsinline class="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"></video>
            <canvas id="camera-canvas" class="hidden"></canvas>
        </div>
        <div class="bg-black p-6 pb-10 flex justify-around items-center">
            <button onclick="closeCameraModal()" class="text-white p-4 rounded-full bg-gray-800">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <button onclick="capturePhoto()" class="p-1 rounded-full border-4 border-white">
                <div class="w-16 h-16 bg-white rounded-full"></div>
            </button>
            <button onclick="switchCamera()" class="text-white p-4 rounded-full bg-gray-800">
                <i data-lucide="refresh-cw" class="w-6 h-6"></i>
            </button>
        </div>
    </div>

    <!-- 
      Replaced script.js with app.js and set type="module".
      This allows app.js to import from your existing 'supabase-client.js'.
    -->
    <script type="module" src="app.js"></script>
</body>
</html>
