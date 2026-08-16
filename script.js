// NASA API Key
const NASA_KEY = 'MvW2S9gIph3u7LrPt59OHMOpN58jLA9xRzlFaLb6';

// Starfield Background
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Star {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.twinkleSpeed = Math.random() * 0.01 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.twinklePhase += this.twinkleSpeed;
        const twinkle = Math.sin(this.twinklePhase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * twinkle})`;
        ctx.fill();
    }
}

function initStars() {
    resizeCanvas();
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push(new Star());
    }
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => star.update());
    requestAnimationFrame(animateStars);
}

initStars();
animateStars();
window.addEventListener('resize', initStars);

// Clock
function updateClock() {
    const now = new Date();
    const timeStr = now.toISOString().split('T')[1].split('.')[0];
    document.getElementById('clock').textContent = timeStr + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

// APOD (Astronomy Picture of the Day)
let apodData = [];
let apodIndex = 0;

async function fetchAPOD() {
    try {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const requests = dates.map(date => 
            fetch(`https://api.nasa.gov/planetary/apod?date=${date}&api_key=${NASA_KEY}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        );

        apodData = (await Promise.all(requests)).filter(d => d !== null);
        
        if (apodData.length > 0) {
            renderAPOD();
            document.getElementById('apod-nav').style.display = 'flex';
            document.getElementById('api-status').textContent = 'nasa api: online ✓';
            document.getElementById('api-status').style.color = '#4ade80';
        }
    } catch (e) {
        document.getElementById('apod-container').innerHTML = 
            '<div class="loading">Couldn\'t load space pics right now. Try again later!</div>';
    }
}

function renderAPOD() {
    const data = apodData[apodIndex];
    if (!data) return;

    const container = document.getElementById('apod-container');
    const media = data.media_type === 'video' 
        ? `<iframe width="100%" height="250" src="${data.url}" frameborder="0" allowfullscreen style="border-radius: 8px; margin-bottom: 15px;"></iframe>`
        : `<img src="${data.url}" alt="${data.title}" class="apod-image" onerror="this.src='https://apod.nasa.gov/apod/image/2308/M51_Webb_960.jpg'">`;

    container.innerHTML = `
        ${media}
        <div class="apod-title">${data.title}</div>
        <div class="apod-date">${data.date} | ${data.copyright || 'NASA'}</div>
        <div class="apod-desc">${data.explanation}</div>
    `;

    // Update button states
    document.getElementById('prev-btn').disabled = apodIndex >= apodData.length - 1;
    document.getElementById('next-btn').disabled = apodIndex <= 0;
}

function nextAPOD() {
    if (apodIndex > 0) {
        apodIndex--;
        renderAPOD();
    }
}

function prevAPOD() {
    if (apodIndex < apodData.length - 1) {
        apodIndex++;
        renderAPOD();
    }
}

// NEO (Near Earth Objects) Radar
async function fetchNEO() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
        const data = await res.json();

        const neos = data.near_earth_objects[today] || [];
        document.getElementById('neo-count').textContent = `${neos.length} objects nearby today`;

        const list = document.getElementById('neo-list');
        list.innerHTML = '';

        if (neos.length === 0) {
            list.innerHTML = '<div class="loading">All clear! No close approaches today.</div>';
            return;
        }

        neos.slice(0, 8).forEach(neo => {
            const isHazard = neo.is_potentially_hazardous_asteroid;
            const dist = parseFloat(neo.close_approach_data[0].miss_distance.kilometers).toLocaleString();
            const size = Math.round(neo.estimated_diameter.meters.estimated_diameter_max);

            const item = document.createElement('div');
            item.className = `neo-item ${isHazard ? 'hazard' : ''}`;
            item.innerHTML = `
                <div>
                    <div class="neo-name">${neo.name.replace(/[()]/g, '')}
                        ${isHazard ? '<span class="neo-hazard-badge">CLOSE</span>' : ''}
                    </div>
                    <div class="neo-size">~${size}m across</div>
                </div>
                <div class="neo-distance">${Math.round(dist / 1000)}k km</div>
            `;
            list.appendChild(item);
        });
    } catch (e) {
        document.getElementById('neo-list').innerHTML = 
            '<div class="loading">Couldn\'t load asteroid data. Rate limited maybe?</div>';
        document.getElementById('api-status').textContent = 'nasa api: limited ⚠';
        document.getElementById('api-status').style.color = '#fbbf24';
    }
}

// Weight Calculator - NEW FEATURE
const planetGravity = {
    'Mercury': 0.38,
    'Venus': 0.91,
    'Mars': 0.38,
    'Jupiter': 2.34,
    'Saturn': 1.06,
    'Uranus': 0.92,
    'Neptune': 1.19,
    'Moon': 0.16
};

document.getElementById('earth-weight').addEventListener('input', function(e) {
    const earthWeight = parseFloat(e.target.value);
    const resultsDiv = document.getElementById('weight-results');
    
    if (!earthWeight || earthWeight <= 0) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    let html = '';
    for (const [planet, gravity] of Object.entries(planetGravity)) {
        const weight = (earthWeight * gravity).toFixed(1);
        html += `
            <div class="weight-result">
                <div class="planet-name">${planet}</div>
                <div class="weight-value">${weight} kg</div>
            </div>
        `;
    }
    resultsDiv.innerHTML = html;
});

// Random Space Facts - NEW FEATURE
const spaceFacts = [
    "A day on Venus is longer than a year on Venus! It takes 243 Earth days to rotate once but only 225 days to orbit the Sun.",
    "Neutron stars are so dense that a teaspoon of their material would weigh about 6 billion tons on Earth.",
    "Space is completely silent. There's no medium for sound waves to travel through in the vacuum of space.",
    "The footprints left by Apollo astronauts on the Moon will likely remain there for at least 100 million years.",
    "There's a planet made largely of diamond, called 55 Cancri e. It's twice the size of Earth!",
    "The Sun accounts for 99.86% of all the mass in our entire solar system.",
    "One million Earths could fit inside the Sun. Mind-blowing, right?",
    "The largest known star, UY Scuti, is so big that if it replaced our Sun, its surface would extend beyond Jupiter's orbit.",
    "There are more stars in the universe than grains of sand on all of Earth's beaches combined.",
    "Astronauts can grow up to 2 inches taller in space because their spines elongate without gravity compressing them.",
    "Saturn would float in water if you could find a bathtub big enough, because it's less dense than water!",
    "The Milky Way galaxy is moving through space at about 1.3 million miles per hour.",
    "There's a massive cloud of alcohol in Sagittarius B2, a gas cloud near the center of our galaxy.",
    "Olympus Mons on Mars is the largest volcano in the solar system - about three times taller than Mount Everest!",
    "A year on Mercury is just 88 Earth days, but a single day lasts 59 Earth days."
];

function showRandomFact() {
    const container = document.getElementById('fact-container');
    const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
    
    container.innerHTML = `<p class="fact-text">${randomFact}</p>`;
    
    // Add a little animation
    container.style.animation = 'none';
    setTimeout(() => {
        container.style.animation = 'fadeIn 0.5s ease';
    }, 10);
}

// Mission Log
function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('orbital_logs') || '[]');
    const list = document.getElementById('log-list');

    if (logs.length === 0) {
        list.innerHTML = '<p class="empty-log">Nothing here yet. Start documenting your space journey!</p>';
        return;
    }

    list.innerHTML = '';
    logs.slice().reverse().forEach((log, index) => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <div>
                <div>${log.text}</div>
                <div class="log-time">${log.time}</div>
            </div>
            <button class="delete-log" onclick="deleteLog(${logs.length - 1 - index})">×</button>
        `;
        list.appendChild(entry);
    });
}

function addLog() {
    const input = document.getElementById('log-input');
    const text = input.value.trim();
    if (!text) return;

    const logs = JSON.parse(localStorage.getItem('orbital_logs') || '[]');
    logs.push({
        text: text,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('orbital_logs', JSON.stringify(logs));
    input.value = '';
    loadLogs();
}

function deleteLog(index) {
    const logs = JSON.parse(localStorage.getItem('orbital_logs') || '[]');
    logs.splice(index, 1);
    localStorage.setItem('orbital_logs', JSON.stringify(logs));
    loadLogs();
}

document.getElementById('log-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addLog();
});

// Solar System Animation
const planets = [
    { name: 'Mercury', color: '#a0a0a0', size: 6, orbit: 50, speed: 4.1 },
    { name: 'Venus', color: '#e6b800', size: 10, orbit: 75, speed: 1.6 },
    { name: 'Earth', color: '#4ade80', size: 10, orbit: 105, speed: 1.0 },
    { name: 'Mars', color: '#ef4444', size: 8, orbit: 135, speed: 0.53 },
    { name: 'Jupiter', color: '#d4a373', size: 22, orbit: 180, speed: 0.084 },
    { name: 'Saturn', color: '#fbbf24', size: 18, orbit: 225, speed: 0.034 },
    { name: 'Uranus', color: '#7de3f4', size: 14, orbit: 265, speed: 0.012 },
    { name: 'Neptune', color: '#60a5fa', size: 14, orbit: 300, speed: 0.006 }
];

function initSolarSystem() {
    const container = document.getElementById('solar-system');
    
    planets.forEach(p => {
        const orbit = document.createElement('div');
        orbit.className = 'orbit';
        orbit.style.width = (p.orbit * 2) + 'px';
        orbit.style.height = (p.orbit * 2) + 'px';
        container.appendChild(orbit);

        const planet = document.createElement('div');
        planet.className = 'planet';
        planet.style.width = p.size + 'px';
        planet.style.height = p.size + 'px';
        planet.style.background = p.color;
        planet.dataset.angle = Math.random() * Math.PI * 2;
        planet.dataset.orbit = p.orbit;
        planet.dataset.speed = p.speed;

        const label = document.createElement('div');
        label.className = 'planet-label';
        label.textContent = p.name;
        planet.appendChild(label);

        container.appendChild(planet);
    });
    
    animatePlanets();
}

function animatePlanets() {
    const planetEls = document.querySelectorAll('.planet');
    planetEls.forEach(p => {
        let angle = parseFloat(p.dataset.angle);
        const orbit = parseFloat(p.dataset.orbit);
        const speed = parseFloat(p.dataset.speed);
        angle += speed * 0.015;
        p.dataset.angle = angle;
        const x = Math.cos(angle) * orbit;
        const y = Math.sin(angle) * orbit;
        p.style.left = `calc(50% + ${x}px)`;
        p.style.top = `calc(50% + ${y}px)`;
    });
    requestAnimationFrame(animatePlanets);
}

// Cosmic Archive (Random Historical APOD)
async function fetchArchive() {
    const ARCHIVE_FALLBACK = {
        url: 'https://apod.nasa.gov/apod/image/2207/JWST_First_Images_Carina_960.jpg',
        title: 'JWST First Image: Cosmic Cliffs',
        date: '2022-07-13',
        copyright: 'NASA / ESA / CSA / STScI',
        explanation: 'The James Webb Space Telescope\'s first deep field image reveals previously invisible areas of star birth.'
    };

    try {
        const start = new Date('2020-01-01').getTime();
        const end = new Date('2024-12-31').getTime();
        const randomTime = start + Math.random() * (end - start);
        const randomDate = new Date(randomTime).toISOString().split('T')[0];

        const res = await fetch(`https://api.nasa.gov/planetary/apod?date=${randomDate}&api_key=${NASA_KEY}`);
        const data = await res.json();
        renderArchive(data);
    } catch (e) {
        renderArchive(ARCHIVE_FALLBACK);
    }
}

function renderArchive(data) {
    const container = document.getElementById('archive-container');
    const media = data.media_type === 'video'
        ? `<iframe width="100%" height="250" src="${data.url}" frameborder="0" allowfullscreen style="border-radius: 8px; margin-bottom: 15px;"></iframe>`
        : `<img src="${data.url}" alt="${data.title}" class="nasa-image" onerror="this.onerror=null;this.src='https://apod.nasa.gov/apod/image/2207/JWST_First_Images_Carina_960.jpg'">`;

    container.innerHTML = `
        ${media}
        <div class="apod-title">${data.title}</div>
        <div class="nasa-meta">
            ${data.date} | ${data.copyright || 'NASA'}<br>
            <span style="font-size: 0.9rem; opacity: 0.8;">${data.explanation.substring(0, 150)}...</span>
        </div>
    `;
}

// Initialize everything
function initAll() {
    fetchAPOD();
    fetchNEO();
    fetchArchive();
    initSolarSystem();
    loadLogs();
}

// Start the app
initAll();

// Add fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);