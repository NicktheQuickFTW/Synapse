/**
 * FlexTime Wrestling Scheduling Application
 * XII-OS Platform Component
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme based on user preference or system setting
    initializeTheme();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize school data
    initializeSchoolData();
    
    // Initialize COMPASS data
    initializeCompassData();
});

/**
 * Initialize theme (dark by default)
 */
function initializeTheme() {
    // Default to dark theme if not set
    if (!localStorage.getItem('flextime-theme')) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('flextime-theme', 'dark');
    } else if (localStorage.getItem('flextime-theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // Update toggle button icon based on current theme
    updateThemeToggleIcon();
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', function() {
        toggleTheme();
    });
    
    // Create schedule button
    const createScheduleBtn = document.querySelector('.compass-header-actions .compass-button--primary');
    if (createScheduleBtn) {
        createScheduleBtn.addEventListener('click', function() {
            createOptimizedSchedule();
        });
    }
    
    // Generate insights button
    const generateInsightsBtn = document.querySelector('.ai-header .compass-button--primary');
    if (generateInsightsBtn) {
        generateInsightsBtn.addEventListener('click', function() {
            generateAIInsights();
        });
    }
    
    // Apply suggestion buttons
    const applySuggestionBtns = document.querySelectorAll('.ai-actions .compass-button:first-child');
    applySuggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestionCard = this.closest('.ai-suggestion-card');
            applySuggestion(suggestionCard);
        });
    });
    
    // Dismiss suggestion buttons
    const dismissSuggestionBtns = document.querySelectorAll('.ai-actions .compass-button:last-child');
    dismissSuggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestionCard = this.closest('.ai-suggestion-card');
            dismissSuggestion(suggestionCard);
        });
    });
    
    // Edit match buttons
    const editMatchBtns = document.querySelectorAll('.schedule-table .compass-button');
    editMatchBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const matchRow = this.closest('tr');
            editMatch(matchRow);
        });
    });
    
    // COMPASS assessment button
    const runAssessmentBtn = document.querySelector('.compass-controls .compass-button--primary');
    if (runAssessmentBtn) {
        runAssessmentBtn.addEventListener('click', function() {
            runCompassAssessment();
        });
    }
    
    // COMPASS tool cards
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', function() {
            activateCompassTool(card);
        });
    });
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    // Update localStorage
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('flextime-theme', 'dark');
    } else {
        localStorage.setItem('flextime-theme', 'light');
    }
    
    // Update button icon
    updateThemeToggleIcon();
}

/**
 * Update theme toggle button icon based on current theme
 */
function updateThemeToggleIcon() {
    const themeToggleIcon = document.querySelector('#theme-toggle svg');
    if (!themeToggleIcon) return;
    
    if (document.body.classList.contains('dark-theme')) {
        themeToggleIcon.innerHTML = '<path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z" fill="#C0C0C0"/><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" fill="#C0C0C0"/>';
    } else {
        themeToggleIcon.innerHTML = '<path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z" fill="currentColor"/><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" fill="currentColor"/>';
    }
}

/**
 * Initialize school data array
 */
function initializeSchoolData() {
    window.wrestlingSchools = [
        { 
            id: 1, 
            name: 'Arizona State', 
            mascot: 'Sun Devils',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Arizona_State_Sun_Devils_logo.svg/1200px-Arizona_State_Sun_Devils_logo.svg.png',
            venue: 'Desert Financial Arena',
            location: 'Tempe, AZ',
            rivals: [13] // Utah Valley
        },
        { 
            id: 2, 
            name: 'Iowa State', 
            mascot: 'Cyclones',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Iowa_State_Cyclones_logo.svg/1200px-Iowa_State_Cyclones_logo.svg.png',
            venue: 'Hilton Coliseum',
            location: 'Ames, IA',
            rivals: [3, 10] // Oklahoma State, Northern Iowa
        },
        { 
            id: 3, 
            name: 'Oklahoma State', 
            mascot: 'Cowboys',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Oklahoma_State_University_logo.svg/1200px-Oklahoma_State_University_logo.svg.png',
            venue: 'Gallagher-Iba Arena',
            location: 'Stillwater, OK',
            rivals: [2, 11] // Iowa State, Oklahoma
        },
        { 
            id: 4, 
            name: 'West Virginia', 
            mascot: 'Mountaineers',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/West_Virginia_Mountaineers_logo.svg/1200px-West_Virginia_Mountaineers_logo.svg.png',
            venue: 'WVU Coliseum',
            location: 'Morgantown, WV',
            rivals: []
        },
        { 
            id: 5, 
            name: 'Air Force', 
            mascot: 'Falcons',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Air_Force_Falcons_logo.svg/1200px-Air_Force_Falcons_logo.svg.png',
            venue: 'Clune Arena',
            location: 'Colorado Springs, CO',
            rivals: [14] // Wyoming
        },
        { 
            id: 6, 
            name: 'Cal Baptist', 
            mascot: 'Lancers',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/California_Baptist_University_seal.svg/1200px-California_Baptist_University_seal.svg.png',
            venue: 'CBU Events Center',
            location: 'Riverside, CA',
            rivals: []
        },
        { 
            id: 7, 
            name: 'Missouri', 
            mascot: 'Tigers',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Missouri_Tigers_logo.svg/1200px-Missouri_Tigers_logo.svg.png',
            venue: 'Hearnes Center',
            location: 'Columbia, MO',
            rivals: [10] // Northern Iowa
        },
        { 
            id: 8, 
            name: 'North Dakota State', 
            mascot: 'Bison',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/North_Dakota_State_Bison_logo.svg/1200px-North_Dakota_State_Bison_logo.svg.png',
            venue: 'Scheels Center',
            location: 'Fargo, ND',
            rivals: [12] // South Dakota State
        },
        { 
            id: 9, 
            name: 'Northern Colorado', 
            mascot: 'Bears',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/Northern_Colorado_Bears_logo.svg/1200px-Northern_Colorado_Bears_logo.svg.png',
            venue: 'Bank of Colorado Arena',
            location: 'Greeley, CO',
            rivals: []
        },
        { 
            id: 10, 
            name: 'Northern Iowa', 
            mascot: 'Panthers',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Northern_Iowa_Panthers_logo.svg/1200px-Northern_Iowa_Panthers_logo.svg.png',
            venue: 'McLeod Center',
            location: 'Cedar Falls, IA',
            rivals: [2, 7] // Iowa State, Missouri
        },
        { 
            id: 11, 
            name: 'Oklahoma', 
            mascot: 'Sooners',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Oklahoma_Sooners_logo.svg/1200px-Oklahoma_Sooners_logo.svg.png',
            venue: 'Lloyd Noble Center',
            location: 'Norman, OK',
            rivals: [3] // Oklahoma State
        },
        { 
            id: 12, 
            name: 'South Dakota State', 
            mascot: 'Jackrabbits',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/15/South_Dakota_State_University_logo.svg/1200px-South_Dakota_State_University_logo.svg.png',
            venue: 'Frost Arena',
            location: 'Brookings, SD',
            rivals: [8] // North Dakota State
        },
        { 
            id: 13, 
            name: 'Utah Valley', 
            mascot: 'Wolverines',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Utah_Valley_Wolverines_logo.svg/1200px-Utah_Valley_Wolverines_logo.svg.png',
            venue: 'UCCU Center',
            location: 'Orem, UT',
            rivals: [1] // Arizona State
        },
        { 
            id: 14, 
            name: 'Wyoming', 
            mascot: 'Cowboys',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Wyoming_Cowboys_logo.svg/1200px-Wyoming_Cowboys_logo.svg.png',
            venue: 'Arena-Auditorium',
            location: 'Laramie, WY',
            rivals: [5] // Air Force
        }
    ];
}

/**
 * Initialize COMPASS data
 */
function initializeCompassData() {
    window.compassScores = [
        {
            schoolId: 3, // Oklahoma State
            totalScore: 92.7,
            components: {
                performance: 94,
                roster: 91,
                infrastructure: 95,
                prestige: 98,
                academics: 90
            }
        },
        {
            schoolId: 2, // Iowa State
            totalScore: 90.4,
            components: {
                performance: 92,
                roster: 89,
                infrastructure: 91,
                prestige: 93,
                academics: 94
            }
        },
        {
            schoolId: 13, // Utah Valley
            totalScore: 87.1,
            components: {
                performance: 88,
                roster: 87,
                infrastructure: 86,
                prestige: 84,
                academics: 89
            }
        },
        {
            schoolId: 1, // Arizona State
            totalScore: 86.5,
            components: {
                performance: 89,
                roster: 85,
                infrastructure: 90,
                prestige: 82,
                academics: 87
            }
        },
        {
            schoolId: 7, // Missouri
            totalScore: 85.9,
            components: {
                performance: 87,
                roster: 86,
                infrastructure: 85,
                prestige: 88,
                academics: 83
            }
        }
    ];
    
    window.compassTools = {
        dataCollection: ['ProgramDataMiner', 'TransferPortalTracker', 'RecruitingInsight'],
        analysis: ['RosterValueEngine', 'InfrastructureAnalyzer', 'PrestigeQuantifier'],
        scheduling: ['ScheduleOptimizer', 'RevenueSensor', 'CompetitiveBalanceGuardian'],
        visualization: ['InsightDashboard', 'ForecastSimulator', 'ExecutiveBriefingAgent'],
        improvement: ['PerformanceValidationAgent', 'BenchmarkMonitor']
    };
}

/**
 * Create and optimize a wrestling schedule
 */
function createOptimizedSchedule() {
    // In a real implementation, this would:
    // 1. Use constraint-based scheduling algorithms
    // 2. Integrate with Claude API for optimization suggestions
    // 3. Apply MCP (Model Context Protocol) for AI-driven decisions
    
    // For now, simulate loading and add a sample match
    simulateLoading('.compass-header-actions .compass-button--primary', function() {
        // Add a demonstration match to the schedule
        const scheduleTable = document.querySelector('.schedule-table tbody');
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>Sat, Feb 14, 2026</td>
            <td>Oklahoma vs. Oklahoma State</td>
            <td>Lloyd Noble Center, Norman, OK</td>
            <td>
                <button class="compass-button compass-button--small">Edit</button>
            </td>
        `;
        
        scheduleTable.appendChild(newRow);
        
        // Add event listener to the new edit button
        const newEditBtn = newRow.querySelector('.compass-button');
        newEditBtn.addEventListener('click', function() {
            editMatch(newRow);
        });
        
        // Show a notification
        showNotification('Schedule updated with new matches based on rivalry optimization');
    });
}

/**
 * Generate AI insights for the current schedule
 */
function generateAIInsights() {
    // Simulate loading
    simulateLoading('.ai-header .compass-button--primary', function() {
        // Add a new AI suggestion
        const aiContainer = document.querySelector('.ai-container');
        
        const newSuggestion = document.createElement('div');
        newSuggestion.className = 'ai-suggestion-card';
        newSuggestion.innerHTML = `
            <h3 class="suggestion-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Competitive Balance Enhancement
            </h3>
            <p class="suggestion-body">Based on historical performance data, the current schedule creates an imbalance for some teams. Redistributing the matchups to ensure each team faces a mix of top, middle, and developing programs would improve overall competitiveness by approximately 18%.</p>
            <div class="ai-actions">
                <button class="compass-button compass-button--small">Apply</button>
                <button class="compass-button compass-button--small">Dismiss</button>
            </div>
        `;
        
        // Insert before the first suggestion
        const firstSuggestion = document.querySelector('.ai-suggestion-card');
        aiContainer.insertBefore(newSuggestion, firstSuggestion);
        
        // Add event listeners to the new buttons
        const applyBtn = newSuggestion.querySelector('.ai-actions .compass-button:first-child');
        const dismissBtn = newSuggestion.querySelector('.ai-actions .compass-button:last-child');
        
        applyBtn.addEventListener('click', function() {
            applySuggestion(newSuggestion);
        });
        
        dismissBtn.addEventListener('click', function() {
            dismissSuggestion(newSuggestion);
        });
        
        // Show notification
        showNotification('New AI insights generated based on current schedule');
    });
}

/**
 * Apply an AI suggestion to the schedule
 */
function applySuggestion(suggestionCard) {
    const suggestionTitle = suggestionCard.querySelector('.suggestion-title').textContent.trim();
    
    // Simulate loading
    simulateLoading(suggestionCard.querySelector('.ai-actions .compass-button:first-child'), function() {
        if (suggestionTitle.includes('Rivalry')) {
            // Add rivalry matchup
            const scheduleTable = document.querySelector('.schedule-table tbody');
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>Sat, Feb 21, 2026</td>
                <td>Iowa State vs. Northern Iowa</td>
                <td>Hilton Coliseum, Ames, IA</td>
                <td>
                    <button class="compass-button compass-button--small">Edit</button>
                </td>
            `;
            scheduleTable.appendChild(newRow);
            
            // Add event listener to the new edit button
            const newEditBtn = newRow.querySelector('.compass-button');
            newEditBtn.addEventListener('click', function() {
                editMatch(newRow);
            });
        } else if (suggestionTitle.includes('Travel Optimization')) {
            // Apply travel optimization
            showNotification('Applying travel optimization to the schedule...');
            setTimeout(() => {
                // Replace a match with optimized travel routing
                const scheduleTable = document.querySelector('.schedule-table tbody');
                const rows = scheduleTable.querySelectorAll('tr');
                if (rows.length >= 3) {
                    // Update the third row with optimized match
                    rows[2].cells[1].textContent = 'Air Force vs. Northern Colorado';
                    rows[2].cells[2].textContent = 'Clune Arena, Colorado Springs, CO';
                    showNotification('Updated match to optimize travel patterns');
                }
            }, 1000);
        } else if (suggestionTitle.includes('Competitive Balance')) {
            // Apply competitive balance enhancements
            buildBalancedSchedule(3); // Add 3 balanced matches
        }
        
        // Remove the suggestion
        suggestionCard.classList.add('fade-out');
        setTimeout(() => {
            suggestionCard.remove();
        }, 300);
        
        // Show notification
        showNotification(`Applied "${suggestionTitle}" to the schedule`);
    });
}

/**
 * Dismiss an AI suggestion
 */
function dismissSuggestion(suggestionCard) {
    // Add fade out animation
    suggestionCard.classList.add('fade-out');
    
    // Remove after animation completes
    setTimeout(() => {
        suggestionCard.remove();
    }, 300);
}

/**
 * Edit a match in the schedule
 */
function editMatch(matchRow) {
    // Get match details
    const date = matchRow.cells[0].textContent;
    const matchup = matchRow.cells[1].textContent;
    const location = matchRow.cells[2].textContent;
    
    // In a real implementation, this would open a modal or form
    // For now, just show a notification
    showNotification(`Editing match: ${matchup} on ${date}`);
}

/**
 * Run a COMPASS assessment on the wrestling programs
 */
function runCompassAssessment() {
    // Simulate loading
    simulateLoading('.compass-controls .compass-button--primary', function() {
        // Update the score display for schools beyond the top 3 that are already shown
        // In a real implementation, this would trigger a full assessment

        // Add Arizona State as the 4th school
        const programScoresGrid = document.querySelector('.program-scores-grid');
        const newCard = document.createElement('div');
        newCard.className = 'program-score-card';
        newCard.innerHTML = `
            <div class="program-rank">#4</div>
            <div class="program-logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Arizona_State_Sun_Devils_logo.svg/1200px-Arizona_State_Sun_Devils_logo.svg.png" alt="Arizona State">
            </div>
            <div class="program-details">
                <h3>Arizona State</h3>
                <div class="program-score">86.5</div>
            </div>
            <div class="score-breakdown">
                <div class="score-bar">
                    <div class="score-segment performance" style="width: 35%;" title="Performance: 89"></div>
                    <div class="score-segment roster" style="width: 25%;" title="Roster: 85"></div>
                    <div class="score-segment infrastructure" style="width: 20%;" title="Infrastructure: 90"></div>
                    <div class="score-segment prestige" style="width: 15%;" title="Prestige: 82"></div>
                    <div class="score-segment academics" style="width: 5%;" title="Academics: 87"></div>
                </div>
            </div>
        `;
        
        programScoresGrid.appendChild(newCard);
        
        // Show notification
        showNotification('COMPASS assessment completed for all 14 wrestling programs');
    });
}

/**
 * Activate a COMPASS tool
 */
function activateCompassTool(toolCard) {
    // Remove active state from all tools
    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.remove('tool-active');
    });
    
    // Add active state to selected tool
    toolCard.classList.add('tool-active');
    
    // Get tool name
    const toolName = toolCard.querySelector('h5').textContent;
    
    // Simulate tool activation
    showNotification(`Activated COMPASS tool: ${toolName}`);
    
    // If Schedule Optimizer is selected, show a specific notification about its connection to FlexTime
    if (toolName === 'ScheduleOptimizer') {
        setTimeout(() => {
            showNotification('Schedule Optimizer is analyzing current schedule data...');
        }, 1500);
    }
}

/**
 * Show a notification
 */
function showNotification(message) {
    // Create notification element if it doesn't exist
    if (!document.querySelector('.flextime-notification')) {
        const notification = document.createElement('div');
        notification.className = 'flextime-notification';
        document.body.appendChild(notification);
    }
    
    const notification = document.querySelector('.flextime-notification');
    notification.textContent = message;
    notification.classList.add('active');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

/**
 * Simulate loading with a button
 */
function simulateLoading(buttonSelector, callback) {
    const button = document.querySelector(buttonSelector);
    if (!button) return;
    
    // Store original content
    const originalContent = button.innerHTML;
    
    // Show loading spinner
    button.innerHTML = `
        <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-opacity="0.3"/>
            <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
    button.disabled = true;
    
    // Simulate API call delay
    setTimeout(() => {
        // Restore button
        button.innerHTML = originalContent;
        button.disabled = false;
        
        // Execute callback
        if (typeof callback === 'function') {
            callback();
        }
    }, 1500);
}

/**
 * Build a complete schedule for all teams
 */
function buildCompleteSchedule() {
    // First clear any existing schedule
    const scheduleTable = document.querySelector('.schedule-table tbody');
    scheduleTable.innerHTML = '';
    
    // Show loading state
    simulateLoading('.compass-header-actions .compass-button--primary', function() {
        // Create a balanced schedule for all 14 teams
        const schedule = generateFullSchedule();
        
        // Add each match to the table
        schedule.forEach(match => {
            addMatchToTable(match);
        });
        
        // Show notification
        showNotification('Complete 8-meet schedule created for all 14 programs');
    });
}

/**
 * Generate a full season schedule for all teams
 * @returns {Array} Array of match objects
 */
function generateFullSchedule() {
    // This would normally use a constraint-based algorithm
    // For this demo, we'll create a reasonable schedule manually
    
    // Define available dates (Fridays and Saturdays from Jan 10 to Feb 23, 2026)
    const dates = [
        { day: 'Fri', date: 'Jan 10, 2026' },
        { day: 'Sat', date: 'Jan 11, 2026' },
        { day: 'Fri', date: 'Jan 17, 2026' },
        { day: 'Sat', date: 'Jan 18, 2026' },
        { day: 'Fri', date: 'Jan 24, 2026' },
        { day: 'Sat', date: 'Jan 25, 2026' },
        { day: 'Fri', date: 'Jan 31, 2026' },
        { day: 'Sat', date: 'Feb 1, 2026' },
        { day: 'Fri', date: 'Feb 7, 2026' },
        { day: 'Sat', date: 'Feb 8, 2026' },
        { day: 'Fri', date: 'Feb 14, 2026' },
        { day: 'Sat', date: 'Feb 15, 2026' },
        { day: 'Fri', date: 'Feb 21, 2026' },
        { day: 'Sat', date: 'Feb 22, 2026' }
    ];
    
    // Create schedule array
    const schedule = [];
    
    // First, schedule all rivalry matches to maximize interest
    // Oklahoma State vs Iowa State (top 2 programs)
    schedule.push({
        date: dates[0],
        homeTeam: getSchoolById(3), // Oklahoma State
        awayTeam: getSchoolById(2), // Iowa State
        isRivalry: true
    });
    
    // Oklahoma State vs Oklahoma (Bedlam rivalry)
    schedule.push({
        date: dates[2],
        homeTeam: getSchoolById(11), // Oklahoma
        awayTeam: getSchoolById(3), // Oklahoma State
        isRivalry: true
    });
    
    // Iowa State vs Northern Iowa (in-state rivalry)
    schedule.push({
        date: dates[4],
        homeTeam: getSchoolById(2), // Iowa State
        awayTeam: getSchoolById(10), // Northern Iowa
        isRivalry: true
    });
    
    // North Dakota State vs South Dakota State (border battle)
    schedule.push({
        date: dates[6],
        homeTeam: getSchoolById(8), // North Dakota State
        awayTeam: getSchoolById(12), // South Dakota State
        isRivalry: true
    });
    
    // Air Force vs Wyoming (regional rivalry)
    schedule.push({
        date: dates[8],
        homeTeam: getSchoolById(5), // Air Force
        awayTeam: getSchoolById(14), // Wyoming
        isRivalry: true
    });
    
    // Arizona State vs Utah Valley (western rivalry)
    schedule.push({
        date: dates[10],
        homeTeam: getSchoolById(1), // Arizona State
        awayTeam: getSchoolById(13), // Utah Valley
        isRivalry: true
    });
    
    // Now schedule additional matches to ensure each team gets 8 meets
    // We'll focus on geographical proximity to minimize travel costs
    
    // Western region matchups
    schedule.push({
        date: dates[1],
        homeTeam: getSchoolById(6), // Cal Baptist
        awayTeam: getSchoolById(13), // Utah Valley
        isRivalry: false
    });
    
    schedule.push({
        date: dates[3],
        homeTeam: getSchoolById(14), // Wyoming
        awayTeam: getSchoolById(9), // Northern Colorado
        isRivalry: false
    });
    
    // Central region matchups
    schedule.push({
        date: dates[5],
        homeTeam: getSchoolById(7), // Missouri
        awayTeam: getSchoolById(11), // Oklahoma
        isRivalry: false
    });
    
    schedule.push({
        date: dates[7],
        homeTeam: getSchoolById(10), // Northern Iowa
        awayTeam: getSchoolById(7), // Missouri
        isRivalry: false
    });
    
    // Mix regional matchups for competitive balance
    schedule.push({
        date: dates[9],
        homeTeam: getSchoolById(2), // Iowa State
        awayTeam: getSchoolById(6), // Cal Baptist
        isRivalry: false
    });
    
    schedule.push({
        date: dates[11],
        homeTeam: getSchoolById(4), // West Virginia
        awayTeam: getSchoolById(8), // North Dakota State
        isRivalry: false
    });
    
    schedule.push({
        date: dates[12],
        homeTeam: getSchoolById(9), // Northern Colorado
        awayTeam: getSchoolById(1), // Arizona State
        isRivalry: false
    });
    
    schedule.push({
        date: dates[13],
        homeTeam: getSchoolById(12), // South Dakota State
        awayTeam: getSchoolById(5), // Air Force
        isRivalry: false
    });
    
    // Create additional matchups to ensure each team has 8 meets
    // For simplicity, we're showing just a subset of the full schedule
    
    // Add more matchups for teams with less than 8 meets
    // (In a real implementation, we'd use a constraint solver to balance the schedule)
    
    // Return the generated schedule
    return schedule;
}

/**
 * Helper function to get school by ID
 * @param {number} id School ID
 * @returns {Object} School object
 */
function getSchoolById(id) {
    return window.wrestlingSchools.find(school => school.id === id);
}

/**
 * Add a match to the schedule table
 * @param {Object} match Match object with date, homeTeam, awayTeam
 */
function addMatchToTable(match) {
    const scheduleTable = document.querySelector('.schedule-table tbody');
    
    // Format the date
    const dateStr = `${match.date.day}, ${match.date.date}`;
    
    // Format the matchup
    const matchupStr = `${match.homeTeam.name} vs. ${match.awayTeam.name}`;
    
    // Format the location
    const locationStr = `${match.homeTeam.venue}, ${match.homeTeam.location}`;
    
    // Create new row
    const newRow = document.createElement('tr');
    
    // Add rivalry class if it's a rivalry match
    if (match.isRivalry) {
        newRow.classList.add('rivalry-match');
    }
    
    newRow.innerHTML = `
        <td>${dateStr}</td>
        <td>${matchupStr}</td>
        <td>${locationStr}</td>
        <td>
            <button class="compass-button compass-button--small">Edit</button>
        </td>
    `;
    
    // Add to table
    scheduleTable.appendChild(newRow);
    
    // Add event listener to the edit button
    const editBtn = newRow.querySelector('.compass-button');
    editBtn.addEventListener('click', function() {
        editMatch(newRow);
    });
}

/**
 * Add a specified number of balanced matches to the schedule
 * @param {number} count Number of matches to add
 */
function buildBalancedSchedule(count) {
    simulateLoading('.ai-header .compass-button--primary', function() {
        // Get COMPASS data to balance high and low ranked teams
        const sortedPrograms = [...window.compassScores].sort((a, b) => b.totalScore - a.totalScore);
        
        // Create matches that pair top teams with mid-tier teams
        for (let i = 0; i < count && i < sortedPrograms.length / 2; i++) {
            const topTeam = getSchoolById(sortedPrograms[i].schoolId);
            const midTierTeam = getSchoolById(sortedPrograms[i + Math.floor(sortedPrograms.length / 2)].schoolId);
            
            // Alternate home/away for fairness
            const homeTeam = i % 2 === 0 ? topTeam : midTierTeam;
            const awayTeam = i % 2 === 0 ? midTierTeam : topTeam;
            
            // Get a date in mid-late February
            const dateIndex = 10 + i; // Use later dates in February
            const date = {
                day: i % 2 === 0 ? 'Fri' : 'Sat',
                date: i % 2 === 0 ? 'Feb 21, 2026' : 'Feb 22, 2026'
            };
            
            // Create and add the match
            const match = {
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isRivalry: false
            };
            
            addMatchToTable(match);
        }
        
        showNotification(`Added ${count} competitively balanced matches`);
    });
} 