(function () {
    'use strict';

    /* ────────────────────────────────────────────
       0.  GLOBALS
       ──────────────────────────────────────────── */
    let mouseX = 0, mouseY = 0;
    const discovered = new Set(JSON.parse(localStorage.getItem('discovered') || '[]'));
    const PLANETS = ['hero', 'about', 'skills', 'projects', 'experience', 'achievements', 'certifications', 'leadership', 'command-center', 'contact'];

    /* ────────────────────────────────────────────
       AUDIO  — Web Audio API synth sounds
       ──────────────────────────────────────────── */
    let audioCtx = null;
    let musicGain = null;
    let musicOscillators = [];
    let muted = false;

    function ensureAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.06;
        musicGain.connect(audioCtx.destination);
    }

    /* Ambient space music — layered low drones */
    function startAmbientMusic() {
        ensureAudio();
        const freqs = [55, 82.5, 110, 165]; // low harmonic series
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = i < 2 ? 'sine' : 'triangle';
            osc.frequency.value = f;
            g.gain.value = i === 0 ? 0.04 : 0.015;
            osc.connect(g);
            g.connect(musicGain);
            osc.start();
            musicOscillators.push({ osc, gain: g });
        });
        // Slow LFO modulation for living feel
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        lfoGain.connect(musicOscillators[0].osc.frequency);
        lfo.start();
    }

    /* UI beep */
    function playBeep() {
        ensureAudio();
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
        g.gain.setValueAtTime(0.06, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(g); g.connect(musicGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }

    /* Achievement chime */
    function playChime() {
        ensureAudio();
        [880, 1100, 1320].forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            g.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.1);
            g.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + i * 0.1 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.4);
            osc.connect(g); g.connect(musicGain);
            osc.start(audioCtx.currentTime + i * 0.1);
            osc.stop(audioCtx.currentTime + i * 0.1 + 0.5);
        });
    }

    /* Tick sound */
    function playTick() {
        ensureAudio();
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 600;
        g.gain.setValueAtTime(0.03, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(g); g.connect(musicGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    }

    /* Mute toggle */
    function addMuteButton() {
        const btn = document.createElement('button');
        btn.id = 'mute-toggle';
        btn.innerHTML = '🔊';
        btn.title = 'Toggle sound';
        document.getElementById('main-site').appendChild(btn);
        btn.addEventListener('click', () => {
            muted = !muted;
            if (musicGain) musicGain.gain.value = muted ? 0 : 0.06;
            btn.innerHTML = muted ? '🔇' : '🔊';
        });
    }

    /* ────────────────────────────────────────────
       1.  MAIN SITE INITIALIZATION (IMMEDIATE)
       ──────────────────────────────────────────── */
    function initMainSite() {
        addMuteButton();
        initStarfield();
        initTypewriter();
        initScrollReveal();
        initNavigation();
        initSkillBars();
        initKPICounters();
        initCharts();
        fetchGitHubRepos();
        initAIAssistant();
        initEasterEgg();
        initGamification();
        initMouseParallax();
        initContactForm();
        initPlanetHoverSounds();
        startAmbientMusic();
    }

    /* ────────────────────────────────────────────
       2.  ANIMATED STARFIELD (Canvas)
       ──────────────────────────────────────────── */
    function initStarfield() {
        const canvas = document.getElementById('starfield-canvas');
        const ctx = canvas.getContext('2d');
        let W, H;

        function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        // Stars – 3 parallax layers
        const layers = [
            { count: 200, speed: 0.15, maxR: 1.2, parallax: 0.02, stars: [] },
            { count: 120, speed: 0.3, maxR: 1.8, parallax: 0.05, stars: [] },
            { count: 60, speed: 0.5, maxR: 2.5, parallax: 0.1, stars: [] }
        ];
        layers.forEach(l => {
            for (let i = 0; i < l.count; i++) {
                l.stars.push({
                    x: Math.random() * W, y: Math.random() * H,
                    r: Math.random() * l.maxR + 0.3,
                    twinkle: Math.random() * Math.PI * 2,
                    twinkleSpeed: Math.random() * 0.03 + 0.01
                });
            }
        });

        // Shooting stars
        const shootings = [];
        function spawnShooting() {
            shootings.push({
                x: Math.random() * W, y: Math.random() * H * 0.4,
                angle: Math.PI * 0.2 + Math.random() * 0.3,
                speed: 8 + Math.random() * 6,
                len: 80 + Math.random() * 60,
                life: 1, decay: 0.015 + Math.random() * 0.01
            });
        }
        setInterval(() => { if (Math.random() < 0.5) spawnShooting(); }, 3000);

        function loop() {
            ctx.clearRect(0, 0, W, H);

            // Nebula background layers responding to mouse
            const mx = W * 0.5 + mouseX * 0.02, my = H * 0.5 + mouseY * 0.02;
            const ng1 = ctx.createRadialGradient(mx * 0.7, my * 0.6, 0, mx * 0.7, my * 0.6, 500);
            ng1.addColorStop(0, 'rgba(100,80,180,0.035)'); ng1.addColorStop(1, 'transparent');
            ctx.fillStyle = ng1; ctx.fillRect(0, 0, W, H);
            const ng2 = ctx.createRadialGradient(mx * 1.3, my * 1.2, 0, mx * 1.3, my * 1.2, 400);
            ng2.addColorStop(0, 'rgba(60,120,200,0.025)'); ng2.addColorStop(1, 'transparent');
            ctx.fillStyle = ng2; ctx.fillRect(0, 0, W, H);

            // Stars
            layers.forEach(l => {
                l.stars.forEach(s => {
                    s.twinkle += s.twinkleSpeed;
                    const alpha = 0.4 + Math.sin(s.twinkle) * 0.4;
                    const px = s.x + (mouseX - W / 2) * l.parallax;
                    const py = s.y + (mouseY - H / 2) * l.parallax;
                    ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(220,230,255,${alpha})`;
                    ctx.fill();
                });
            });

            // Shooting stars
            shootings.forEach(s => {
                const endX = s.x - Math.cos(s.angle) * s.len;
                const endY = s.y + Math.sin(s.angle) * s.len;
                const grad = ctx.createLinearGradient(s.x, s.y, endX, endY);
                grad.addColorStop(0, `rgba(220,235,255,${s.life})`);
                grad.addColorStop(1, 'rgba(220,235,255,0)');
                ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(endX, endY);
                ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
                s.x += Math.cos(s.angle) * s.speed;
                s.y += Math.sin(s.angle) * s.speed;
                s.life -= s.decay;
            });
            for (let i = shootings.length - 1; i >= 0; i--) {
                if (shootings[i].life <= 0) shootings.splice(i, 1);
            }

            requestAnimationFrame(loop);
        }
        loop();
    }

    /* ────────────────────────────────────────────
       3.  MOUSE PARALLAX / 3D GALAXY ROTATION
       ──────────────────────────────────────────── */
    function initMouseParallax() {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const rx = (e.clientY - cy) / cy * 2.5;
            const ry = (e.clientX - cx) / cx * 2.5;

            document.querySelectorAll('.planet-section').forEach(sec => {
                sec.style.transform = `perspective(1200px) rotateX(${-rx * 0.25}deg) rotateY(${ry * 0.25}deg)`;
            });
        });
    }

    /* ────────────────────────────────────────────
       4.  TYPEWRITER HERO TEXT
       ──────────────────────────────────────────── */
    function initTypewriter() {
        const phrases = [
            "Software Engineering Graduate",
            "Major in Data Science",
            "Data Analyst",
            "AI Research Enthusiast"
        ];
        const el = document.getElementById('typewriter-text');
        let phraseIdx = 0, charIdx = 0, deleting = false;

        function tick() {
            const current = phrases[phraseIdx];
            if (!deleting) {
                el.textContent = current.slice(0, charIdx + 1);
                charIdx++;
                if (charIdx === current.length) {
                    setTimeout(() => { deleting = true; tick(); }, 2000);
                    return;
                }
                setTimeout(tick, 70);
            } else {
                el.textContent = current.slice(0, charIdx);
                charIdx--;
                if (charIdx < 0) {
                    deleting = false; charIdx = 0;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    setTimeout(tick, 400);
                    return;
                }
                setTimeout(tick, 35);
            }
        }
        tick();
    }

    /* ────────────────────────────────────────────
       5.  SCROLL REVEAL
       ──────────────────────────────────────────── */
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('revealed');
                    e.target.querySelectorAll('.xp-fill').forEach(bar => {
                        bar.style.width = bar.dataset.width + '%';
                    });
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal-element').forEach(el => observer.observe(el));

        // Planet discovery
        const planetObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const planet = e.target.dataset.planet;
                    if (planet && !discovered.has(planet)) {
                        discovered.add(planet);
                        localStorage.setItem('discovered', JSON.stringify([...discovered]));
                        showToast('🪐 Planet Discovered!', `You found the ${planet.replace('-', ' ')} sector!`);
                        playChime();
                        updateProgress();
                    }
                    document.querySelectorAll('#nav-links a').forEach(a => a.classList.remove('active'));
                    const navLink = document.querySelector(`#nav-links a[data-planet="${planet}"]`);
                    if (navLink) navLink.classList.add('active');
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.planet-section').forEach(s => planetObserver.observe(s));
    }

    /* ────────────────────────────────────────────
       6.  SKILL BARS — handled by scroll reveal
       ──────────────────────────────────────────── */
    function initSkillBars() { }

    /* ────────────────────────────────────────────
       7.  KPI COUNTERS
       ──────────────────────────────────────────── */
    function initKPICounters() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !e.target.dataset.counted) {
                    e.target.dataset.counted = '1';
                    const target = +e.target.dataset.target;
                    let current = 0;
                    const step = Math.max(1, Math.floor(target / 40));
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) { current = target; clearInterval(timer); }
                        e.target.textContent = current + '+';
                    }, 40);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.kpi-value').forEach(el => observer.observe(el));
    }

    /* ────────────────────────────────────────────
       8.  CHARTS (Canvas)
       ──────────────────────────────────────────── */
    function initCharts() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !e.target.dataset.drawn) {
                    e.target.dataset.drawn = '1';
                    drawSkillsChart();
                    drawTimelineChart();
                }
            });
        }, { threshold: 0.3 });
        const chartArea = document.querySelector('.charts-area');
        if (chartArea) observer.observe(chartArea);
    }

    function drawSkillsChart() {
        const canvas = document.getElementById('chart-skills');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const skills = [
            { name: 'Python', val: 95 }, { name: 'SQL', val: 90 },
            { name: 'Power BI', val: 92 }, { name: 'Java', val: 88 },
            { name: 'ML', val: 82 }, { name: 'C/C++', val: 85 },
            { name: 'Web', val: 75 }, { name: 'Problem\nSolving', val: 90 },
            { name: 'AI Eng.', val: 78 }
        ];
        const cx = W / 2, cy = H / 2 + 10, radius = Math.min(W, H) * 0.35;
        const n = skills.length, angleStep = (Math.PI * 2) / n;

        [0.25, 0.5, 0.75, 1].forEach(f => {
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const a = -Math.PI / 2 + i * angleStep;
                const x = cx + Math.cos(a) * radius * f;
                const y = cy + Math.sin(a) * radius * f;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.stroke();
        });

        ctx.beginPath();
        skills.forEach((s, i) => {
            const a = -Math.PI / 2 + i * angleStep;
            const r = radius * (s.val / 100);
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(100,140,255,0.12)';
        ctx.strokeStyle = 'rgba(130,170,255,0.6)'; ctx.lineWidth = 2;
        ctx.fill(); ctx.stroke();

        skills.forEach((s, i) => {
            const a = -Math.PI / 2 + i * angleStep;
            const r = radius * (s.val / 100);
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#7cacff'; ctx.shadowColor = '#7cacff'; ctx.shadowBlur = 8;
            ctx.fill(); ctx.shadowBlur = 0;
            const lx = cx + Math.cos(a) * (radius + 20);
            const ly = cy + Math.sin(a) * (radius + 20);
            ctx.font = '10px Orbitron'; ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(s.name, lx, ly);
        });
    }

    function drawTimelineChart() {
        const canvas = document.getElementById('chart-timeline');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const data = [
            { year: '2022', val: 2 }, { year: '2023', val: 4 },
            { year: '2024', val: 7 }, { year: '2025', val: 10 }
        ];
        const pad = 50, chartW = W - pad * 2, chartH = H - pad * 2, maxVal = 12;

        for (let i = 0; i <= 4; i++) {
            const y = pad + chartH - (i / 4) * chartH;
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + chartW, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke();
            ctx.font = '9px Orbitron'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right';
            ctx.fillText(Math.round((i / 4) * maxVal), pad - 8, y + 3);
        }

        const barW = chartW / data.length * 0.5;
        data.forEach((d, i) => {
            const x = pad + (i + 0.5) * (chartW / data.length) - barW / 2;
            const h = (d.val / maxVal) * chartH;
            const y = pad + chartH - h;
            const grad = ctx.createLinearGradient(x, y, x, pad + chartH);
            grad.addColorStop(0, 'rgba(130,180,255,0.8)');
            grad.addColorStop(1, 'rgba(100,120,200,0.25)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]); ctx.fill();
            ctx.shadowColor = '#6cacff'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
            ctx.font = '10px Orbitron'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center';
            ctx.fillText(d.year, x + barW / 2, pad + chartH + 16);
            ctx.fillStyle = '#7cacff'; ctx.fillText(d.val, x + barW / 2, y - 8);
        });
        ctx.font = '9px Orbitron'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center';
        ctx.fillText('Achievements per Year', W / 2, H - 5);
    }

    /* ────────────────────────────────────────────
       9.  GITHUB API
       ──────────────────────────────────────────── */
    async function fetchGitHubRepos() {
        const container = document.getElementById('github-repos');
        try {
            const resp = await fetch('https://api.github.com/users/rokibhasan32/repos?sort=updated&per_page=12');
            if (!resp.ok) throw new Error('API error');
            const repos = await resp.json();
            const featured = ['libraal', 'zerowaste', 'football-analysis', 'medicartai', 'bloodsupport'];
            const filtered = repos.filter(r => !featured.some(f => r.name.toLowerCase().includes(f)));
            if (filtered.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">No additional repositories found.</p>';
                return;
            }
            container.innerHTML = '';
            filtered.forEach(repo => {
                const langColors = {
                    Python: '#3572A5', Java: '#b07219', JavaScript: '#f1e05a',
                    HTML: '#e34c26', CSS: '#563d7c', C: '#555', 'C++': '#f34b7d',
                    'Jupyter Notebook': '#DA5B0B'
                };
                const lc = langColors[repo.language] || '#7cacff';
                const card = document.createElement('div');
                card.className = 'glass-card project-card reveal-element revealed';
                card.innerHTML = `
                    <div class="project-status">📡 GitHub</div>
                    <h3>${repo.name.replace(/-/g, ' ')}</h3>
                    <p>${repo.description || 'Exploring the frontiers of code...'}</p>
                    <div class="tech-tags">
                        ${repo.language ? `<span class="tech-tag" style="border-color:${lc};color:${lc}">${repo.language}</span>` : ''}
                        ${repo.stargazers_count > 0 ? `<span class="tech-tag">⭐ ${repo.stargazers_count}</span>` : ''}
                    </div>
                    <a href="${repo.html_url}" target="_blank" class="project-link">View on GitHub →</a>
                `;
                container.appendChild(card);
            });
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">⚠️ Could not reach the GitHub constellation. Featured projects above!</p>';
        }
    }

    /* ────────────────────────────────────────────
       10. AI ASSISTANT
       ──────────────────────────────────────────── */
    function initAIAssistant() {
        const toggle = document.getElementById('ai-toggle');
        const chat = document.getElementById('ai-chat');
        const close = document.getElementById('ai-close');
        const input = document.getElementById('ai-input');
        const send = document.getElementById('ai-send');
        const messages = document.getElementById('ai-chat-messages');

        // Suggested prompts
        const suggestedDiv = document.createElement('div');
        suggestedDiv.className = 'ai-suggested-prompts';
        const suggestions = [
            'Who is Rokib Hasan?',
            'Tell me about his projects',
            'What awards did he win?',
            'What are his skills?',
            'Research interests?',
            'Education background?',
            'Work experience?'
        ];
        suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'ai-suggested-btn';
            btn.textContent = s;
            btn.addEventListener('click', () => { input.value = s; handleSend(); });
            suggestedDiv.appendChild(btn);
        });
        chat.insertBefore(suggestedDiv, chat.querySelector('.ai-chat-input'));

        toggle.addEventListener('click', () => {
            const visible = chat.style.display !== 'none';
            chat.style.display = visible ? 'none' : 'flex';
            if (!visible) playTick();
        });
        close.addEventListener('click', () => chat.style.display = 'none');
        send.addEventListener('click', handleSend);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

        function addMsg(text, who) {
            const d = document.createElement('div');
            d.className = `ai-msg ${who}`;
            d.innerHTML = text;
            messages.appendChild(d);
            messages.scrollTop = messages.scrollHeight;
        }

        function handleSend() {
            const q = input.value.trim();
            if (!q) return;
            addMsg(q, 'user');
            input.value = '';
            setTimeout(() => {
                addMsg(getAnswer(q), 'bot');
                playTick();
            }, 400 + Math.random() * 400);
        }

        const KB = {
            identity: {
                keywords: ['who', 'rokib', 'hasan', 'about', 'introduce', 'tell me about', 'herself', 'background', 'bio'],
                answer: `<strong>Rokib Hasan</strong> is a Software Engineering graduate majoring in <em>Data Science</em> from Daffodil International University, Dhaka, Bangladesh. He's passionate about AI, data analytics, and building intelligent systems for social impact. 🚀`
            },
            projects: {
                keywords: ['project', 'built', 'portfolio', 'work', 'develop', 'libra', 'zerowaste', 'blood', 'supply chain', 'pc build', 'innovation'],
                answer: `Rokib has built several impactful projects:<br>
                    🔹 <strong>LibraAI</strong> — AI-powered virtual librarian using NLP & ML<br>
                    🔹 <strong>ZeroWaste</strong> — AI for sustainable waste management<br>
                    🔹 <strong>Football Match Analysis</strong> — Built an AI-based football analysis system using a custom-trained model to detect players, ball, and referees, performing real-time and recorded match analytics including player speed, distance covered, team positioning, and camera motion estimation.<br>
                    🔹 <strong>MedicartAI</strong> — Built an AI-powered healthcare platform with pharmacy services, prescription uploads, and a 24/7 AI chatbot (Groq + Llama 3.3) using FastAPI, SQLite, and JWT authentication.<br>
                    🔹 <strong>BloodSupport</strong> — Blood bank system in C<br>
                    Check the <strong>Innovation Station</strong> planet for details! 🛰️`
            },
            awards: {
                keywords: ['award', 'achievement', 'trophy', 'win', 'won', 'hackathon', 'nasa', 'competition', 'hall of fame', 'prize', 'runner', 'champion', 'nominee'],
                answer: `Rokib has an impressive achievement record! 🏆<br>
                    🥇 <strong>1st Runner-Up</strong> — DIU Agentic AI Excellence Award<br>
                    🏁 <strong>2nd Runner-Up</strong> — Robotics Project Exhibition<br>
                    🌌 <strong>7th</strong> — Data Hackathon,DIU Data Science Summit<br>
                    ...and many more in the <strong>Hall of Fame</strong>! ✨`
            },
            skills: {
                keywords: ['skill', 'technology', 'tech', 'stack', 'programming', 'language', 'python', 'java', 'sql', 'power bi', 'tool', 'can she', 'proficient', 'expertise', 'capable'],
                answer: `Rokib's key skills include:<br>
                    🐍 <strong>Python</strong> — Advanced (950 XP)<br>
                    🗄️ <strong>MySQL/SQL</strong> — Advanced (900 XP)<br>
                    📊 <strong>Power BI</strong> — Advanced (920 XP)<br>
                    ☕ <strong>Java</strong> — Intermediate (880 XP)<br>
                    🤖 <strong>Machine Learning</strong> — Advanced (820 XP)<br>
                    🧠 <strong>AI Engineering</strong> — Advanced <br>
                    Plus C/C++, Web Design & Problem Solving! 💪`
            },
            research: {
                keywords: ['research', 'interest', 'focus', 'future', 'phd', 'master', 'goal', 'vision', 'ai for social', 'study', 'academic'],
                answer: `Rokib's research interests include:<br>
                    🎯 <strong>Current Focus:</strong> Applied Data Science & AI for Social Good<br>
                    🔬 <strong>Areas:</strong> NLP, Machine Learning, Explainable AI, Data Analytics<br>
                    🚀 <strong>Future Goal:</strong> Pursuing Master's & PhD in AI and Data Science<br>
                    🤝 <strong>Open to:</strong> Research collaboration & impactful AI projects<br>
                    He envisions AI as a transparent partner for humanitarian impact. 🌍`
            },
            education: {
                keywords: ['education', 'university', 'degree', 'study', 'graduate', 'college', 'school', 'daffodil', 'diu', 'major'],
                answer: `🎓 <strong>B.Sc. in Software Engineering</strong><br>
                    Major: <strong>Data Science</strong><br>
                    University: <strong>Daffodil International University</strong>, Dhaka, Bangladesh<br>
                    His academic journey blends software engineering with deep data science specialization. 📚`
            },
            experience: {
                keywords: ['experience', 'work', 'job', 'career', 'outlier', 'save the children', 'trainer', 'analyst', 'professional', 'employ'],
                answer: `Rokib's professional experience:<br>
                    🤖 <strong>AI Trainer</strong> — Outlier (August 2024 – April 2025)<br>
                    Reviewed & refined code to improve AI model training remotely. 🌐`
            },
            certifications: {
                keywords: ['certification', 'certificate', 'course', 'certified', 'microsoft', 'aws', 'kaggle', 'coursera', 'deeplearning'],
                answer: `Rokib holds certifications from top platforms:<br>
                    ☁️ AWS — ML for NLP & ML Foundations<br>
                    🧠 DeepLearning.AI — Supervised ML<br>`
            },
            contact: {
                keywords: ['contact', 'email', 'phone', 'reach', 'connect', 'linkedin', 'github', 'hire', 'message'],
                answer: `📧 <strong>Email:</strong> rokibhasan5039l@gmail.com<br>
                    📱 <strong>Phone:</strong> 01716529578<br>
                    💼 <a href="https://www.linkedin.com/in/rokib-hasan/" target="_blank">LinkedIn</a> | 
                    🐙 <a href="https://github.com/rokibhasan32" target="_blank">GitHub</a><br>
                    📍 Dhaka, Bangladesh 🇧🇩`
            },
            greeting: {
                keywords: ['hi', 'hello', 'hey', 'good', 'morning', 'evening', 'afternoon', 'sup', 'yo'],
                answer: `Hello, explorer! 👋 Welcome to Rokib's Universe. I can tell you about his <strong>projects</strong>, <strong>awards</strong>, <strong>skills</strong>, <strong>research interests</strong>, <strong>education</strong>, or <strong>experience</strong>. What would you like to know? 🚀`
            }
        };

        function getAnswer(q) {
            const lower = q.toLowerCase();
            let bestMatch = null, bestScore = 0;
            for (const [, data] of Object.entries(KB)) {
                let score = 0;
                data.keywords.forEach(kw => { if (lower.includes(kw)) score += kw.length; });
                if (score > bestScore) { bestScore = score; bestMatch = data; }
            }
            if (bestMatch && bestScore > 0) return bestMatch.answer;
            return `Hmm, that's beyond my star charts! 🌌 Try asking about Rokib's <strong>projects</strong>, <strong>awards</strong>, <strong>skills</strong>, <strong>research</strong>, <strong>education</strong>, or <strong>experience</strong>.`;
        }
    }

    /* ────────────────────────────────────────────
       11. EASTER EGG
       ──────────────────────────────────────────── */
    function initEasterEgg() {
        const egg = document.getElementById('easter-egg');
        const hidden = document.getElementById('hidden-research');
        if (!egg) return;
        egg.addEventListener('click', () => {
            if (hidden.style.display === 'none') {
                hidden.style.display = 'flex';
                showToast('🔓 Achievement Unlocked!', 'Data Explorer — You found the hidden research vision!');
                playChime();
                hidden.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    /* ────────────────────────────────────────────
       12. GAMIFICATION
       ──────────────────────────────────────────── */
    function initGamification() { updateProgress(); }

    function updateProgress() {
        const pct = Math.round((discovered.size / PLANETS.length) * 100);
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-text');
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = pct + '% Explored';
        if (discovered.size === PLANETS.length && !localStorage.getItem('allDiscovered')) {
            localStorage.setItem('allDiscovered', '1');
            setTimeout(() => {
                showToast('🌟 Universe Master!', "You explored every planet in Rokib's Universe!");
                playChime();
            }, 1000);
        }
    }

    function showToast(title, msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<div class="toast-title">${title}</div><div>${msg}</div>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    /* ────────────────────────────────────────────
       13. NAVIGATION
       ──────────────────────────────────────────── */
    function initNavigation() {
        const toggle = document.getElementById('nav-toggle');
        const links = document.getElementById('nav-links');
        toggle.addEventListener('click', () => links.classList.toggle('show'));
        links.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') links.classList.remove('show');
        });
        document.getElementById('start-exploration')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    /* ────────────────────────────────────────────
       14. CONTACT FORM
       ──────────────────────────────────────────── */
    function initContactForm() {
        const form = document.getElementById('contact-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = '🛸 Transmitting...';
            btn.disabled = true;
            try {
                const resp = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });
                if (resp.ok) {
                    showToast('📡 Transmission Sent!', 'Your message has been delivered across the cosmos!');
                    playChime();
                    form.reset();
                } else {
                    showToast('⚠️ Transmission Failed', 'Something went wrong. Please try again.');
                }
            } catch (err) {
                showToast('⚠️ Transmission Failed', 'Network error. Please try again.');
            }
            btn.textContent = '🚀 Transmit Message';
            btn.disabled = false;
        });
    }

    /* ────────────────────────────────────────────
       15. PLANET HOVER SOUNDS
       ──────────────────────────────────────────── */
    function initPlanetHoverSounds() {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                try { playTick(); } catch (e) { }
            });
        });
    }

    // Initialize on page load
    initMainSite();

})();