/* ========================================
   DAC ROADMAP - LANDING PAGE JAVASCRIPT
   GSAP ScrollTrigger animations & interactions
   ======================================== */

gsap.registerPlugin(ScrollTrigger);

// ========================================
// HEADER SCROLL EFFECT
// ========================================
const header = document.getElementById('site-header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});


// ========================================
// MOBILE NAV TOGGLE
// ========================================
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}


// ========================================
// HERO ENTRANCE ANIMATIONS
// ========================================
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

heroTl
    .to('#hero-badge', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: 0.3
    })
    .to('#hero-title', {
        opacity: 1,
        y: 0,
        duration: 0.8
    }, '-=0.4')
    .to('#hero-desc', {
        opacity: 1,
        y: 0,
        duration: 0.7
    }, '-=0.5')
    .to('#hero-actions', {
        opacity: 1,
        y: 0,
        duration: 0.7
    }, '-=0.4')
    .to('#hero-stats', {
        opacity: 1,
        y: 0,
        duration: 0.7
    }, '-=0.3');


// ========================================
// TIMELINE NODES - SCROLL ANIMATIONS
// ========================================
const timelineNodes = document.querySelectorAll('.timeline-node');

timelineNodes.forEach((node, index) => {
    gsap.to(node, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: node,
            start: 'top 85%',
            toggleActions: 'play none none none',
            onEnter: () => {
                node.classList.add('visible');
            }
        },
        delay: 0.1
    });
});


// ========================================
// TIMELINE PROGRESS LINE
// ========================================
const timelineProgress = document.getElementById('timeline-progress');
const timelineWrapper = document.querySelector('.timeline-wrapper');

if (timelineProgress && timelineWrapper) {
    ScrollTrigger.create({
        trigger: timelineWrapper,
        start: 'top 60%',
        end: 'bottom 40%',
        onUpdate: (self) => {
            const progress = self.progress;
            const wrapperHeight = timelineWrapper.offsetHeight;
            timelineProgress.style.height = (progress * wrapperHeight) + 'px';
        }
    });
}


// ========================================
// PHASE CARDS - STAGGER ANIMATION
// ========================================
const phaseCards = document.querySelectorAll('.phase-card');

gsap.to(phaseCards, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.phases-section',
        start: 'top 70%',
        toggleActions: 'play none none none'
    }
});


// ========================================
// SKILL DETAIL CARDS - STAGGER ANIMATION
// ========================================
const skillCards = document.querySelectorAll('.skill-detail-card');

gsap.to(skillCards, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.skills-detail-grid',
        start: 'top 80%',
        toggleActions: 'play none none none'
    }
});


// ========================================
// SECTION HEADERS - FADE IN
// ========================================
document.querySelectorAll('.section-header').forEach(header => {
    gsap.from(header, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            toggleActions: 'play none none none'
        }
    });
});


// ========================================
// CTA SECTION - ENTRANCE
// ========================================
const ctaSection = document.querySelector('.cta-section');
if (ctaSection) {
    gsap.from('.cta-container', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: ctaSection,
            start: 'top 75%',
            toggleActions: 'play none none none'
        }
    });
}


// ========================================
// SMOOTH SCROLL FOR NAV LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


// ========================================
// ACTIVE NAV LINK TRACKING
// ========================================
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);


// ========================================
// PARALLAX ORB EFFECT ON MOUSE MOVE
// ========================================
const heroSection = document.querySelector('.hero');

if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
        const orbs = document.querySelectorAll('.orb');
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        orbs.forEach((orb, i) => {
            const speed = (i + 1) * 15;
            gsap.to(orb, {
                x: x * speed,
                y: y * speed,
                duration: 1.2,
                ease: 'power2.out'
            });
        });
    });
}


// ========================================
// NUMBER COUNTER ANIMATION (Hero Stats)
// ========================================
function animateCounter(el, target, suffix = '') {
    const isNumber = !isNaN(parseInt(target));
    if (!isNumber) return;

    const num = parseInt(target);
    let current = 0;
    const step = Math.ceil(num / 40);
    const interval = setInterval(() => {
        current += step;
        if (current >= num) {
            current = num;
            clearInterval(interval);
        }
        el.textContent = current + suffix;
    }, 30);
}

const statElements = document.querySelectorAll('.hero-stat-num');
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
            statsAnimated = true;
            statElements.forEach(el => {
                const text = el.textContent.trim();
                const match = text.match(/^(\d+)(\+?)$/);
                if (match) {
                    animateCounter(el, match[1], match[2]);
                }
            });
        }
    });
}, { threshold: 0.5 });

const heroStats = document.getElementById('hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}


// ========================================
// SCROLL INDICATOR HIDE ON SCROLL
// ========================================
const scrollIndicator = document.getElementById('scroll-indicator');

if (scrollIndicator) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 150) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.transition = 'opacity 0.5s ease';
        }
    });
}


// ========================================
// PAGE LOAD - REFRESH SCROLL TRIGGERS
// ========================================
window.addEventListener('load', () => {
    ScrollTrigger.refresh();
});
