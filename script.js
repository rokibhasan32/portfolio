(function () {
    'use strict';

    /* ────────────────────────────────────────────
       0.  GLOBALS
       ──────────────────────────────────────────── */
    let mouseX = 0, mouseY = 0;
    const discovered = new Set(JSON.parse(localStorage.getItem('discovered') || '[]'));
    const PLANETS = ['hero', 'about', 'skills', 'projects', 'research', 'experience', 'achievements', 'certifications', 'leadership', 'command-center', 'contact'];

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
       2.  CLEAN MODERN BACKGROUND (Canvas)
       ──────────────────────────────────────────── */
    function initStarfield() {
        const canvas = document.getElementById('starfield-canvas');
        const ctx = canvas.getContext('2d');
        let W, H;
        let time = 0;

        function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        // Smooth flowing diagonal lines
        const flowingLines = [];
        for (let i = 0; i < 12; i++) {
            flowingLines.push({
                x1: -300 + (i * 150),
                y1: -300,
                x2: W + 300 + (i * 150),
                y2: H + 300,
                speed: Math.random() * 1.5 + 0.8,
                hue: Math.random() < 0.5 ? 200 : 270,
                width: Math.random() * 1.2 + 0.6,
                opacity: Math.random() * 0.35 + 0.25,
                offset: Math.random() * 2000
            });
        }

        // Small floating particles/lights
        const particles = [];
        function createParticle() {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                life: 1,
                size: Math.random() * 2.5 + 1,
                hue: Math.random() < 0.4 ? 30 : Math.random() < 0.5 ? 200 : 270,
                decay: Math.random() * 0.002 + 0.0015
            });
        }
        
        // Create initial particles
        for (let i = 0; i < 25; i++) {
            createParticle();
        }

        function drawBackground() {
            // Clean dark background
            const mainGrad = ctx.createLinearGradient(0, 0, W, H);
            mainGrad.addColorStop(0, '#040810');
            mainGrad.addColorStop(0.5, '#080d18');
            mainGrad.addColorStop(1, '#040810');
            ctx.fillStyle = mainGrad;
            ctx.fillRect(0, 0, W, H);

            // Subtle glow from mouse area
            const glowGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 800);
            glowGrad.addColorStop(0, `rgba(100, 200, 255, 0.06)`);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, W, H);
        }

        function drawFlowingLines() {
            flowingLines.forEach(line => {
                line.offset += line.speed;
                if (line.offset > 4000) {
                    line.offset = -1000;
                }

                // Calculate line position with smooth offset
                const dist = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
                const dirX = (line.x2 - line.x1) / dist;
                const dirY = (line.y2 - line.y1) / dist;

                const offsetX = dirX * line.offset;
                const offsetY = dirY * line.offset;

                const x1 = line.x1 + offsetX;
                const y1 = line.y1 + offsetY;
                const x2 = line.x2 + offsetX;
                const y2 = line.y2 + offsetY;

                // Draw glow effect (wider, more transparent)
                ctx.strokeStyle = `hsla(${line.hue}, 100%, 50%, ${line.opacity * 0.3})`;
                ctx.lineWidth = line.width * 5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = `hsl(${line.hue}, 100%, 50%)`;
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Draw main line
                ctx.strokeStyle = `hsla(${line.hue}, 100%, 50%, ${line.opacity})`;
                ctx.lineWidth = line.width;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            });
        }

        function drawParticles() {
            particles.forEach((p, idx) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                // Wrap around screen
                if (p.x < -50) p.x = W + 50;
                if (p.x > W + 50) p.x = -50;
                if (p.y < -50) p.y = H + 50;
                if (p.y > H + 50) p.y = -50;

                // Respawn if dead
                if (p.life <= 0) {
                    particles[idx] = {
                        x: Math.random() * W,
                        y: Math.random() * H,
                        vx: (Math.random() - 0.5) * 0.8,
                        vy: (Math.random() - 0.5) * 0.8,
                        life: 1,
                        size: Math.random() * 2.5 + 1,
                        hue: Math.random() < 0.4 ? 30 : Math.random() < 0.5 ? 200 : 270,
                        decay: Math.random() * 0.002 + 0.0015
                    };
                    p = particles[idx];
                }

                // Draw particle glow
                ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.life * 0.5})`;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();

                // Draw particle core
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life * 0.8})`;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.4 * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        }

        function drawMouseGlow() {
            // Interactive cursor glow
            const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 400);
            grad.addColorStop(0, `rgba(100, 200, 255, 0.15)`);
            grad.addColorStop(0.5, `rgba(100, 200, 255, 0.05)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        function loop() {
            time++;

            // Draw all layers
            drawBackground();
            drawFlowingLines();
            drawParticles();
            drawMouseGlow();

            // Create new particles to maintain count
            if (time % 50 === 0 && particles.length < 30) {
                createParticle();
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
            'What is he learning?',
            'Education background?',
            'How to contact him?'
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
                answer: `<strong>Rokib Hasan</strong> is a Software Engineering graduate majoring in <em>Data Science</em> from Daffodil International University, Dhaka, Bangladesh. Check his <strong>My Journey</strong> section to learn more! 🚀`
            },
            projects: {
                keywords: ['project', 'built', 'portfolio', 'work', 'develop', 'libra', 'zerowaste', 'blood', 'supply chain', 'pc build', 'innovation'],
                answer: `Rokib has built several impressive projects in his <strong>What I've Built</strong> section:<br>
                    🔹 <strong>LibraAI</strong> — AI-powered virtual librarian using NLP & ML<br>
                    🔹 <strong>ZeroWaste</strong> — AI for sustainable waste management<br>
                    🔹 <strong>Football Match Analysis</strong> — AI-based football analysis system with custom-trained model<br>
                    🔹 <strong>MedicartAI</strong> — AI-powered healthcare platform with 24/7 AI chatbot<br>
                    🔹 <strong>BloodSupport</strong> — Blood bank system in C<br>
                    Check the <strong>What I've Built</strong> section for full details! 💻`
            },
            awards: {
                keywords: ['award', 'achievement', 'trophy', 'win', 'won', 'hackathon', 'nasa', 'competition', 'hall of fame', 'prize', 'runner', 'champion', 'nominee'],
                answer: `Rokib has an impressive record in <strong>My Wins</strong>! 🏆<br>
                    🥇 <strong>1st Runner-Up</strong> — DIU Agentic AI Excellence Award<br>
                    🏁 <strong>2nd Runner-Up</strong> — Robotics Project Exhibition<br>
                    🌟 <strong>7th Place — Top 1.4%</strong> — Data Hackathon, DIU Data Science Summit<br>
                    Check the <strong>My Wins</strong> section for all achievements! ✨`
            },
            skills: {
                keywords: ['skill', 'technology', 'tech', 'stack', 'programming', 'language', 'python', 'java', 'sql', 'power bi', 'tool', 'can she', 'proficient', 'expertise', 'capable'],
                answer: `Rokib's key skills in <strong>My Toolkit</strong>:<br>
                    🐍 <strong>Python</strong> — Advanced (950 XP)<br>
                    🗄️ <strong>MySQL/SQL</strong> — Advanced (900 XP)<br>
                    📊 <strong>Power BI</strong> — Advanced (920 XP)<br>
                    ☕ <strong>Java</strong> — Intermediate (880 XP)<br>
                    🤖 <strong>Machine Learning</strong> — Advanced (820 XP)<br>
                    🧠 <strong>AI Engineering</strong> — Advanced <br>
                    Plus C/C++, Web Design & Problem Solving! 💪`
            },
            research: {
                keywords: ['research', 'interest', 'focus', 'future', 'phd', 'master', 'goal', 'vision', 'ai for social', 'study', 'academic', 'paper', 'publication', 'football', 'sports', 'analytics'],
                answer: `Rokib's research work includes:<br>
                    <strong>📄 Ongoing Research Paper:</strong><br>
                    "Enhancing Sports Performance with Big Data and Machine Learning-Powered Predictive Analytics"<br><br>
                    🎯 <strong>Focus:</strong> Interpretable AI framework for tactical football analysis using XAI techniques<br>
                    🤖 <strong>Tech Stack:</strong> YOLOv8, DeepSORT, Grad-CAM, SHAP, Computer Vision<br>
                    📊 <strong>Key Metric:</strong> mAP@0.5 = 0.677 with Player AP: 0.990, Referee AP: 0.995<br>
                    ⚽ <strong>Application:</strong> Actionable insights for coaching staff including event recognition & performance metrics<br><br>
                    🎯 <strong>Research Interests:</strong> Explainable AI, Machine Learning, Data Analytics, AI for Social Good<br>
                    🚀 <strong>Future Goal:</strong> Pursuing Master's & PhD in AI and Data Science<br>
                    Check the <strong>Research</strong> section for detailed publication! 🔬`
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
                answer: `Rokib holds certifications from top platforms in his <strong>Certificates</strong> section:<br>
                    ☁️ AWS — ML for NLP & ML Foundations<br>
                    🧠 DeepLearning.AI — Supervised ML<br>
                    Constantly learning and growing! 📚`
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
                answer: `Hello, friend! 👋 Welcome to Rokib's Portfolio. I can tell you about his <strong>journey</strong>, <strong>toolkit</strong>, <strong>projects</strong>, <strong>career</strong>, <strong>achievements</strong>, <strong>certifications</strong>, or <strong>contact info</strong>. What would you like to know? 🚀`
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