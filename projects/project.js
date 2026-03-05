import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* =========================
BENTO GALLERY WITH SUPABASE
========================= */


// --- CONFIGURATION ---
const supabase = createClient(
    "https://nsmioyqhnefljfpmzksk.supabase.co",
    "sb_publishable_skwyA6GX4YTiiRpvF8PWFw_iHUFgXCZ"
);

// Fallback Data (Used if DB is empty or fails)
const fallbackData = [
    {
        id: 1,
        type: "image",
        title: "Data Visualization",
        desc: "Turning complex data into insights using D3.js",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        spanClass: "span-col-1-row-3"
    },
    {
        id: 2,
        type: "video",
        title: "AI Processing",
        desc: "Real-time neural network visualization demo",
        url: "https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4",
        spanClass: "span-col-2-row-2"
    },
    {
        id: 3,
        type: "image",
        title: "Cloud Architecture",
        desc: "Scalable infrastructure design patterns",
        url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
        spanClass: "span-col-1-row-3"
    },
    {
        id: 4,
        type: "image",
        title: "Machine Learning",
        desc: "Predictive models in action",
        url: "https://images.unsplash.com/photo-1527430253228-e93688616381?q=80&w=800&auto=format&fit=crop",
        spanClass: "span-col-2-row-2"
    },
    {
        id: 5,
        type: "video",
        title: "Robotics Lab",
        desc: "Automation and control systems",
        url: "https://cdn.pixabay.com/video/2024/07/24/222837_large.mp4",
        spanClass: "span-col-1-row-3"
    },
    {
        id: 6,
        type: "image",
        title: "Big Data Pipeline",
        desc: "Processing petabytes of information",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
        spanClass: "span-col-2-row-2"
    },
    {
        id: 7,
        type: "image",
        title: "Cyber Security",
        desc: "Protecting digital assets",
        url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
        spanClass: "span-col-1-row-3"
    },
];

// State
let mediaItems = [];
let currentItemIndex = 0;
let isDraggingGrid = false;
let draggedElement = null;

// DOM Elements
const gridContainer = document.getElementById('bento-grid');
const modal = document.getElementById('bento-modal');
const closeBtn = document.getElementById('bento-close-btn');
const mediaContainer = document.getElementById('bento-media-container');
const modalTitle = document.getElementById('bento-modal-title');
const modalDesc = document.getElementById('bento-modal-desc');
const dock = document.getElementById('bento-dock');
const dockItemsContainer = document.getElementById('bento-dock-items');

/* =========================
DATA LOADING
========================= */
async function loadProjects() {
    try {
        // Attempt to fetch from Supabase
        // Expected Table: db_projects
        // Columns: id, title, description, media_url, media_type, span_class
        const { data, error } = await supabase
            .from("db_projects")
            .select("*")
            .order("sort_order", { ascending: true }); // Optional: add sort_order column to DB

        if (error) throw error;

        if (data && data.length > 0) {
            // Map DB data to our internal structure
            mediaItems = data.map(item => ({
                id: item.id,
                type: item.media_type || 'image', // Default to image if null
                title: item.title,
                desc: item.description,
                url: item.media_url,
                spanClass: item.span_class || 'span-col-1-row-2'
            }));
            console.log("Loaded from Supabase:", mediaItems.length, "items");
        } else {
            console.warn("No projects found in DB. Using fallback data.");
            mediaItems = [...fallbackData];
        }

        init();

    } catch (error) {
        console.error("Supabase fetch failed:", error);
        console.warn("Falling back to local data.");
        mediaItems = [...fallbackData];
        init();
    }
}

/* =========================
INITIALIZATION
========================= */
function init() {
    renderKineticShowcase();
    renderDock();
    setupModalEvents();
    setupDockDrag();
    setupPageAnimations();
}

/* =========================
RENDER DOCK
========================= */
function renderDock() {
    dockItemsContainer.innerHTML = '';
    mediaItems.forEach((item, index) => {
        const dot = document.createElement('div');
        dot.className = `bento-dock-item ${index === currentItemIndex ? 'active' : ''}`;

        let mediaHtml = '';
        if (item.type === 'video') {
            mediaHtml = `<video src="${item.url}" muted loop playsinline></video>`;
        } else {
            mediaHtml = `<img src="${item.url}" alt="${item.title}">`;
        }

        dot.innerHTML = mediaHtml;
        dot.addEventListener('click', () => switchItem(index));
        dockItemsContainer.appendChild(dot);
    });
}

/* =========================
KINETIC SHOWCASE (Vertical Gear)
========================= */
function renderKineticShowcase() {
    const leftRack = document.getElementById('rack-left');
    const rightRack = document.getElementById('rack-right');
    if (!leftRack || !rightRack) return;

    leftRack.innerHTML = '';
    rightRack.innerHTML = '';

    let leftCount = 0;
    let rightCount = 0;

    mediaItems.forEach((item, index) => {
        const node = document.createElement('div');
        node.className = 'k-node';
        node.dataset.index = index;

        let mediaHtml = '';
        if (item.type === 'video') {
            mediaHtml = `<video class="k-media" src="${item.url}" muted loop playsinline></video>`;
        } else {
            mediaHtml = `<img class="k-media" src="${item.url}" alt="${item.title}">`;
        }

        node.innerHTML = `
            <div class="k-icon">${(index + 1).toString().padStart(2, '0')}</div>
            <div class="k-glass-card">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                ${mediaHtml}
            </div>
        `;

        node.addEventListener('click', () => {
            openModal(index);
        });

        // Alternate sides
        if (index % 2 === 0) {
            // Left Rack - moves UP
            // Top starts at 20vh, each node is 70vh lower
            node.style.top = `${20 + (leftCount * 80)}vh`;
            leftRack.appendChild(node);
            leftCount++;
        } else {
            // Right Rack - moves DOWN
            // Bottom starts at 20vh, each node is 70vh higher (absolute bottom)
            node.style.bottom = `${20 + (rightCount * 80)}vh`;
            rightRack.appendChild(node);
            rightCount++;
        }
    });

    const maxItems = Math.max(leftCount, rightCount);
    // Base height for the scroll duration
    const requiredHeight = Math.max(maxItems * 80 + 100, 200);
    document.getElementById('kinetic-showcase').style.height = `${requiredHeight}vh`;

    setupKineticAnimations(requiredHeight);
}

function setupKineticAnimations(totalVh) {
    if (typeof gsap === 'undefined') return;

    ScrollTrigger.getAll().forEach(t => {
        if (t.vars.id === "kinetic-main") t.kill();
    });

    const mainTl = gsap.timeline({
        scrollTrigger: {
            id: "kinetic-main",
            trigger: "#kinetic-showcase",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5
        }
    });

    // Assume 1 full rotation (360) per 100vh
    mainTl.to("#kinetic-main-gear", {
        rotation: (totalVh / 100) * 360,
        ease: "none"
    }, 0);

    // Left rack translates up 
    mainTl.fromTo("#rack-left",
        { y: "0vh" },
        { y: `-${totalVh - 100}vh`, ease: "none" }, 0
    );

    // Right rack translates down
    mainTl.fromTo("#rack-right",
        { y: "0vh" },
        { y: `${totalVh - 100}vh`, ease: "none" }, 0
    );

    // Node Highlighting
    const kNodes = document.querySelectorAll(".k-node");
    kNodes.forEach(node => {
        ScrollTrigger.create({
            trigger: "#kinetic-showcase",
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
                const rect = node.getBoundingClientRect();
                const viewportCenter = window.innerHeight / 2;
                const nodeCenter = rect.top + rect.height / 2;

                // If node is within 180px of center vertical
                if (Math.abs(nodeCenter - viewportCenter) < 180) {
                    if (!node.classList.contains('active')) {
                        node.classList.add('active');
                        const vid = node.querySelector('video');
                        if (vid) vid.play().catch(() => { });
                        gsap.to("#kinetic-main-gear", { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1 });
                    }
                } else {
                    if (node.classList.contains('active')) {
                        node.classList.remove('active');
                        const vid = node.querySelector('video');
                        if (vid) vid.pause();
                    }
                }
            }
        });
    });
}

/* =========================
MODAL LOGIC
========================= */
function openModal(index) {
    currentItemIndex = index;
    updateModalContent();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderDock();
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    const video = mediaContainer.querySelector('video');
    if (video) video.pause();
}

function updateModalContent() {
    const item = mediaItems[currentItemIndex];
    modalTitle.textContent = item.title;
    modalDesc.textContent = item.desc;
    mediaContainer.innerHTML = '';

    if (item.type === 'video') {
        const vid = document.createElement('video');
        vid.src = item.url;
        vid.controls = true;
        vid.autoplay = true;
        vid.muted = false;
        vid.loop = true;
        mediaContainer.appendChild(vid);
    } else {
        const img = document.createElement('img');
        img.src = item.url;
        img.alt = item.title;
        mediaContainer.appendChild(img);
    }
    renderDock();
}

function switchItem(index) {
    mediaContainer.style.opacity = '0';
    mediaContainer.style.transform = 'scale(0.95)';

    setTimeout(() => {
        currentItemIndex = index;
        updateModalContent();
        mediaContainer.style.opacity = '1';
        mediaContainer.style.transform = 'scale(1)';
    }, 200);
}

function setupModalEvents() {
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('.bento-main-viewer')) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        if (e.key === 'ArrowRight' && modal.classList.contains('active')) {
            switchItem((currentItemIndex + 1) % mediaItems.length);
        }
        if (e.key === 'ArrowLeft' && modal.classList.contains('active')) {
            switchItem((currentItemIndex - 1 + mediaItems.length) % mediaItems.length);
        }
    });
}

/* =========================
DOCK DRAG LOGIC
========================= */
function setupDockDrag() {
    let isDraggingDock = false;
    let startX;

    const startDrag = (x) => {
        isDraggingDock = true;
        startX = x;
        dock.style.transition = 'none';
    };

    const moveDrag = (x) => {
        if (!isDraggingDock) return;
        const dx = x - startX;
        dock.style.transform = `translateX(calc(-50% + ${dx}px))`;
    };

    const endDrag = () => {
        if (isDraggingDock) {
            isDraggingDock = false;
            dock.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            dock.style.transform = 'translateX(-50%)';
        }
    };

    dock.addEventListener('mousedown', (e) => startDrag(e.clientX));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX));
    window.addEventListener('mouseup', endDrag);

    dock.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', endDrag);
}

/* =========================
NEW: PAGE ANIMATIONS (GSAP)
========================= */
function setupPageAnimations() {
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // --- Header scroll effect ---
    const header = document.getElementById('site-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Nav ---
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        });
        mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Hero entrance ---
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
        .to('#hero-badge', { opacity: 1, y: 0, duration: 0.7, delay: 0.2 })
        .to('#hero-title', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
        .to('#hero-desc', { opacity: 1, y: 0, duration: 0.7 }, '-=0.45')
        .to('#hero-metrics', { opacity: 1, y: 0, duration: 0.7 }, '-=0.3');

    // --- Counter animation ---
    const metricNums = document.querySelectorAll('.metric-num');
    let metricsAnimated = false;

    const metricsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !metricsAnimated) {
                metricsAnimated = true;
                metricNums.forEach(el => {
                    const target = parseInt(el.dataset.count);
                    if (isNaN(target)) return;
                    let current = 0;
                    const step = Math.ceil(target / 30);
                    const interval = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(interval);
                        }
                        el.textContent = current;
                    }, 35);
                });
            }
        });
    }, { threshold: 0.5 });

    const metricsEl = document.getElementById('hero-metrics');
    if (metricsEl) metricsObserver.observe(metricsEl);

    // --- Section intro fade-ins ---
    document.querySelectorAll('.section-intro').forEach(intro => {
        gsap.from(intro, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: intro,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // --- Methodology cards stagger ---
    const methodCards = document.querySelectorAll('.method-card');
    gsap.to(methodCards, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.methodology-grid',
            start: 'top 80%',
            toggleActions: 'play none none none'
        }
    });

    // --- CTA section entrance ---
    const ctaSection = document.querySelector('.projects-cta');
    if (ctaSection) {
        gsap.from('.cta-inner', {
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
}


/* =========================
START
========================= */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}