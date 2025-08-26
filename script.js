document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const stickyPanel = document.querySelector('.sticky-panel');
    const visualCards = document.querySelectorAll('.visual-card');
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const selectedDateEl = document.getElementById('selectedDate');
    const moodOptionsContainer = document.getElementById('moodOptions');
    const colorPieContainer = document.getElementById('colorPieContainer');
    const medsTakenCheckbox = document.getElementById('medsTakenCheckbox');
    const saveBtn = document.getElementById('saveBtn');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    // --- Data ---
    const moodData = [
        { mood: 10, emoji: '😂' }, { mood: 9, emoji: '😄' }, { mood: 8, emoji: '😊' },
        { mood: 7, emoji: '🙂' }, { mood: 6, emoji: '😌' }, { mood: 5, emoji: '😐' },
        { mood: 4, emoji: '😕' }, { mood: 3, emoji: '😟' }, { mood: 2, emoji: '😢' },
        { mood: 1, emoji: '😭' }
    ];
    const colors = ['#0d47a1', '#1565c0', '#1e88e5', '#2e7d32', '#388e3c', '#43a047', '#66bb6a', '#fdd835', '#ffeb3b', '#fff176', '#ef6c00', '#f57c00', '#fb8c00', '#d32f2f', '#e53935', '#f44336'];
    const colorMoodMapping = {
        '#0d47a1': { range: [1, 2] }, '#1565c0': { range: [1, 2] }, '#1e88e5': { range: [1, 2] },
        '#2e7d32': { range: [3, 5] }, '#388e3c': { range: [3, 5] }, '#43a047': { range: [3, 5] }, '#66bb6a': { range: [3, 5] },
        '#fdd835': { range: [6, 7] }, '#ffeb3b': { range: [6, 7] }, '#fff176': { range: [6, 7] },
        '#ef6c00': { range: [8, 9] }, '#f57c00': { range: [8, 9] }, '#fb8c00': { range: [8, 9] },
        '#d32f2f': { range: [10, 10] }, '#e53935': { range: [10, 10] }, '#f44336': { range: [10, 10] }
    };
    
    // --- App State ---
    let currentDate = new Date();
    let dailyLog = { date: null, mood: null, color: null, tookMeds: false };
    let moodChart = null;
    let colorTrendChart = null;
    let masterLog = JSON.parse(localStorage.getItem('masterLog')) || {};
    const scroller = scrollama();

    // --- Initialization ---
    const init = () => {
        populateMoods();
        generateColorPie();
        renderCalendar();
        setupScrollama();
    };

    // --- UI Generation ---
    const populateMoods = () => {
        moodOptionsContainer.innerHTML = '';
        moodData.forEach(item => {
            const moodEl = document.createElement('div');
            moodEl.classList.add('mood');
            moodEl.dataset.mood = item.mood;
            moodEl.textContent = item.emoji;
            moodOptionsContainer.appendChild(moodEl);
        });
    };
    
    const generateColorPie = () => {
        const size = 300;
        const radius = size / 2;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        const numSlices = colors.length;
        const sliceAngle = 360 / numSlices;
        const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
        };
        const describeArc = (x, y, radius, startAngle, endAngle) => {
            const start = polarToCartesian(x, y, radius, endAngle);
            const end = polarToCartesian(x, y, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            return `M ${x},${y} L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag} 0 ${end.x},${end.y} Z`;
        };
        for (let i = 0; i < numSlices; i++) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', describeArc(radius, radius, radius, i * sliceAngle, (i + 1) * sliceAngle));
            path.setAttribute('fill', colors[i]);
            path.classList.add('color-slice');
            path.dataset.color = colors[i];
            svg.appendChild(path);
        }
        colorPieContainer.appendChild(svg);
    };

    // --- Calendar & Chart Rendering ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        currentMonthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
            const weekdayEl = document.createElement('div');
            weekdayEl.classList.add('weekday');
            weekdayEl.textContent = day;
            calendarGrid.appendChild(weekdayEl);
        });

        for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.appendChild(document.createElement('div'));

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;
            let dayContent = `<span>${day}</span>`;
            if (masterLog[dateStr]) {
                dayCell.dataset.mood = masterLog[dateStr].mood;
                if (masterLog[dateStr].color) {
                    dayContent += `<div class="mood-dot" style="background-color: ${masterLog[dateStr].color};"></div>`;
                }
            }
            dayCell.innerHTML = dayContent;
            dayCell.addEventListener('click', () => {
                dailyLog.date = dateStr;
                selectedDateEl.textContent = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
                dayCell.classList.add('selected');
            });
            calendarGrid.appendChild(dayCell);
        }
        renderCharts();
    };
    
    const renderCharts = () => {
        const sortedDates = Object.keys(masterLog).sort();
        const labels = sortedDates.map(date => new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Mood Chart
        const moodData = sortedDates.map(date => masterLog[date].mood);
        const moodCtx = document.getElementById('moodChart').getContext('2d');
        if (moodChart) moodChart.destroy();
        moodChart = new Chart(moodCtx, { type: 'line', data: { labels, datasets: [{ label: 'Mood', data: moodData, borderColor: 'var(--primary-color)', backgroundColor: 'rgba(94, 114, 228, 0.1)', fill: true, tension: 0.4 }] }, options: { scales: { y: { beginAtZero: true, max: 10 } }, responsive: true, maintainAspectRatio: false } });

        // Color Chart
        const colorData = sortedDates.map(date => masterLog[date].color).filter(Boolean);
        const colorCtx = document.getElementById('colorTrendChart').getContext('2d');
        if (colorTrendChart) colorTrendChart.destroy();
        if (colorData.length < 2) {
            if(colorTrendChart) colorTrendChart.destroy();
            colorCtx.clearRect(0, 0, colorCtx.canvas.width, colorCtx.canvas.height);
            if (colorData.length === 1) {
                colorCtx.fillStyle = colorData[0];
                colorCtx.fillRect(0, 0, colorCtx.canvas.width, colorCtx.canvas.height);
            }
            return;
        }
        const gradient = colorCtx.createLinearGradient(0, 0, colorCtx.canvas.clientWidth, 0);
        colorData.forEach((color, index) => gradient.addColorStop(index / (colorData.length - 1), color));
        colorTrendChart = new Chart(colorCtx, { type: 'line', data: { labels, datasets: [{ label: 'Color', data: labels.map(() => 5), backgroundColor: gradient, borderColor: 'transparent', fill: true, pointRadius: 0 }] }, options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 10 } }, responsive: true, maintainAspectRatio: false } });
    };

    // --- Scrollytelling Logic ---
    const handleStepEnter = (response) => {
        const step = response.element;
        step.classList.add('is-active');

        // Switch the visual card based on a data attribute
        const visual = step.dataset.triggerVisual;
        if (visual) {
            visualCards.forEach(card => card.classList.remove('active-visual'));
            document.querySelector(`.visual-card[data-visual="${visual}"]`).classList.add('active-visual');
        } else {
             // Default back to calendar if no specific visual is triggered
             visualCards.forEach(card => card.classList.remove('active-visual'));
            document.querySelector('.visual-card[data-visual="calendar"]').classList.add('active-visual');
        }
    };
    
    const handleStepExit = (response) => {
        const step = response.element;
        step.classList.remove('is-active');
    };

    const setupScrollama = () => {
        scroller
            .setup({
                step: '.scrolling-steps .step',
                offset: 0.6, // Trigger when step is 60% from the top
                debug: false,
            })
            .onStepEnter(handleStepEnter)
            .onStepExit(handleStepExit);
    };

    // --- Event Handlers ---
    const handleMoodSelect = (e) => {
        const target = e.target.closest('.mood');
        if (!target) return;
        dailyLog.mood = target.dataset.mood;
        document.querySelectorAll('.mood').forEach(m => m.classList.remove('selected'));
        target.classList.add('selected');
    };
    
    const handleColorSelect = (e) => {
        const target = e.target.closest('.color-slice');
        if (!target) return;
        dailyLog.color = target.dataset.color;
        document.querySelectorAll('.color-slice').forEach(s => s.classList.remove('selected'));
        target.classList.add('selected');
    };

    const handleSave = () => {
        if (!dailyLog.date || !dailyLog.mood || !dailyLog.color) {
            alert('Please ensure you have selected a date, mood, and color before saving.');
            return;
        }

        const moodNum = parseInt(dailyLog.mood, 10);
        const colorInfo = colorMoodMapping[dailyLog.color];
        let proceed = true;

        if (colorInfo) {
            const [minMood, maxMood] = colorInfo.range;
            if (moodNum < (minMood - 1) || moodNum > (maxMood + 1)) {
                proceed = confirm("Clinical Note: The selected color is not typically associated with this mood. This may indicate mood incongruence. Save anyway?");
            }
        }

        if (proceed) {
            dailyLog.tookMeds = medsTakenCheckbox.checked;
            masterLog[dailyLog.date] = { ...dailyLog };
            localStorage.setItem('masterLog', JSON.stringify(masterLog));
            renderCalendar(); // Re-render to show dot and update charts
            saveBtn.textContent = 'Saved! ✔';
            setTimeout(() => { saveBtn.textContent = 'Complete & Save Entry' }, 2000);
        }
    };

    // --- Attach Event Listeners ---
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    moodOptionsContainer.addEventListener('click', handleMoodSelect);
    colorPieContainer.addEventListener('click', handleColorSelect);
    saveBtn.addEventListener('click', handleSave);

    // Run on page load
    init();
});