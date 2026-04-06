/* ============================================
   HomeLoan Pro — Warm Modern Interactivity
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Nav scroll ───
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // ─── Dark Mode Toggle ───
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Detect saved preference or system preference
    function getPreferredTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme, animate = true) {
        if (animate) {
            document.body.classList.add('theme-transitioning');
            setTimeout(() => document.body.classList.remove('theme-transitioning'), 600);
        }
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Re-draw donut with correct separator color
        if (window._calcEMI) window._calcEMI();
    }

    // Apply on load (no animation)
    applyTheme(getPreferredTheme(), false);

    themeToggle.addEventListener('click', () => {
        const current = htmlEl.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark', true);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // ─── Mobile nav toggle ───
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // ─── Smooth anchor scroll ───
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const id = link.getAttribute('href');
            if (id === '#') return;
            const el = document.querySelector(id);
            if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ─── Scroll Reveal ───
    const revealEls = document.querySelectorAll(
        '.bento__card, .step, .story-card, .accordion, .section-head, .calc__wrapper, .apply__card'
    );
    revealEls.forEach(el => el.classList.add('reveal'));

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 60);
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach(el => revealObs.observe(el));

    // ─── Animate rate bar on bento-1 visibility ───
    const bentoRate = document.getElementById('bento-1');
    if (bentoRate) {
        const rateObs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const fill = bentoRate.querySelector('.illo-rate__fill');
                if (fill) fill.style.width = '35%';
                rateObs.unobserve(bentoRate);
            }
        }, { threshold: 0.3 });
        rateObs.observe(bentoRate);
    }

    // ─── Counter animation (float pills) ───
    function animateCount(el, target, duration = 2000) {
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.floor(target * eased).toLocaleString('en-IN');
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    document.querySelectorAll('[data-count]').forEach(el => {
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                animateCount(el, parseInt(el.dataset.count));
                obs.unobserve(el);
            }
        }, { threshold: 0.5 });
        obs.observe(el);
    });

    // ─── EMI Calculator ───
    const slAmount = document.getElementById('sl-amount');
    const slRate   = document.getElementById('sl-rate');
    const slTenure = document.getElementById('sl-tenure');

    const outAmount = document.getElementById('sl-amount-out');
    const outRate   = document.getElementById('sl-rate-out');
    const outTenure = document.getElementById('sl-tenure-out');

    const emiVal      = document.getElementById('emi-val');
    const legPrincipal = document.getElementById('leg-principal');
    const legInterest  = document.getElementById('leg-interest');
    const legTotal     = document.getElementById('leg-total');

    function fmt(n) {
        return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    function updateSliderTrack(slider) {
        const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const trackBg = isDark ? '#2A2A42' : '#EBE4D6';
        slider.style.background = `linear-gradient(to right, #0C7C6E 0%, #23B09A ${pct}%, ${trackBg} ${pct}%)`;
    }

    function calcEMI() {
        // exposed globally for theme toggle
        window._calcEMI = calcEMI;
        const P = parseFloat(slAmount.value);
        const annR = parseFloat(slRate.value);
        const yrs = parseInt(slTenure.value);
        const r = annR / 12 / 100;
        const n = yrs * 12;

        let emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const total = emi * n;
        const interest = total - P;

        outAmount.textContent = fmt(P);
        outRate.textContent   = annR + '%';
        outTenure.textContent = yrs + (yrs === 1 ? ' Year' : ' Years');

        emiVal.textContent       = fmt(emi);
        legPrincipal.textContent = fmt(P);
        legInterest.textContent  = fmt(interest);
        legTotal.textContent     = fmt(total);

        updateSliderTrack(slAmount);
        updateSliderTrack(slRate);
        updateSliderTrack(slTenure);

        drawDonut(P, interest);
    }

    function drawDonut(principal, interest) {
        const canvas = document.getElementById('emiDonut');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        canvas.width = 200 * dpr;
        canvas.height = 200 * dpr;
        canvas.style.width = '200px';
        canvas.style.height = '200px';
        ctx.scale(dpr, dpr);

        const total = principal + interest;
        const pAngle = (principal / total) * 2 * Math.PI;
        const iAngle = (interest / total) * 2 * Math.PI;
        const cx = 100, cy = 100, oR = 90, iR = 62;

        ctx.clearRect(0, 0, 200, 200);

        // Principal — teal
        ctx.beginPath();
        ctx.arc(cx, cy, oR, -Math.PI / 2, -Math.PI / 2 + pAngle);
        ctx.arc(cx, cy, iR, -Math.PI / 2 + pAngle, -Math.PI / 2, true);
        ctx.closePath();
        const gP = ctx.createLinearGradient(0, 0, 200, 200);
        gP.addColorStop(0, '#0C7C6E');
        gP.addColorStop(1, '#23B09A');
        ctx.fillStyle = gP;
        ctx.fill();

        // Interest — coral
        ctx.beginPath();
        ctx.arc(cx, cy, oR, -Math.PI / 2 + pAngle, -Math.PI / 2 + pAngle + iAngle);
        ctx.arc(cx, cy, iR, -Math.PI / 2 + pAngle + iAngle, -Math.PI / 2 + pAngle, true);
        ctx.closePath();
        const gI = ctx.createLinearGradient(0, 0, 200, 200);
        gI.addColorStop(0, '#F07A56');
        gI.addColorStop(1, '#E8603C');
        ctx.fillStyle = gI;
        ctx.fill();

        // Separator gap
        const sepAngle = -Math.PI / 2 + pAngle;
        ctx.beginPath();
        ctx.arc(cx, cy, oR, sepAngle - 0.015, sepAngle + 0.015);
        ctx.arc(cx, cy, iR, sepAngle + 0.015, sepAngle - 0.015, true);
        ctx.closePath();
        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDarkTheme ? '#151525' : '#FBF8F2';
        ctx.fill();
    }

    [slAmount, slRate, slTenure].forEach(s => s.addEventListener('input', calcEMI));
    calcEMI();

    // ─── FAQ Accordion ───
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(acc => {
        const btn = acc.querySelector('.accordion__btn');
        btn.addEventListener('click', () => {
            const isActive = acc.classList.contains('active');
            accordions.forEach(a => a.classList.remove('active'));
            if (!isActive) acc.classList.add('active');
        });
    });

    // ─── Form Submissions ───
    const modal = document.getElementById('modal');

    function showModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    function handleForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async e => {
            e.preventDefault();

            // --- Honeypot / Bot Shield ---
            const botField = form.querySelector('[name="bot_verify"]');
            if (botField && botField.value) {
                console.warn("Automation detected.");
                // Silently fake success to trick the bot
                form.reset();
                showModal();
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const orig = btn.innerHTML;
            btn.innerHTML = 'Processing...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            // Extract data robustly from both forms
            const payload = {
                name: form.querySelector('[id$="-name"]')?.value || '',
                phone: form.querySelector('[id$="-phone"]')?.value || '',
                type: form.querySelector('[id$="-type"]')?.value || 'Home Loan',
                income: form.querySelector('[id$="-income"]')?.value || '',
                loanNeeded: form.querySelector('[id$="-amount"], [id$="-loan"]')?.value || ''
            };

            try {
                // IMPORTANT: Replace this URL with your deployed Google Apps Script Web App URL
                const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwf-JFtnCctsO-5JvBGFtc7TIRHH57w-zyLYxtaW_QVr0px3hAqf0JwP4KGzmrcrkoe/exec';
                
                // Google Apps Script requires 'no-cors' mode to bypass strict cross-origin policies
                const res = await fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                // When using 'no-cors', the response is 'opaque' meaning we can't read res.ok
                // If it didn't throw a network error into the catch block, it worked.
                form.reset();
                showModal();
            } catch(error) {
                console.error(error);
                alert('Connection error. Please try again later.');
            } finally {
                btn.innerHTML = orig;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    }

    handleForm('quick-form');
    handleForm('apply-form');

});
