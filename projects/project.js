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
    renderGrid();
    renderDock();
    setupModalEvents();
    setupDockDrag();
}

/* =========================
RENDER GRID
========================= */
function renderGrid() {
    gridContainer.innerHTML = '';
    
    // 1. Create and append all items normally
    mediaItems.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = `bento-item ${item.spanClass}`;
        el.dataset.index = index;

        // Content Generation
        let mediaHtml = '';
        if (item.type === 'video') {
            mediaHtml = `
                <div class="bento-buffering"><div class="spinner"></div></div>
                <video class="bento-media" src="${item.url}" muted loop playsinline preload="metadata"></video>
            `;
        } else {
            mediaHtml = `<img class="bento-media" src="${item.url}" alt="${item.title}" loading="lazy">`;
        }

        el.innerHTML = `
            ${mediaHtml}
            <div class="bento-item-overlay">
                <div class="bento-item-title">${item.title}</div>
                <div class="bento-item-desc">${item.desc}</div>
            </div>
        `;

        // Click to Open Modal
        el.addEventListener('click', (e) => {
            if (!isDraggingGrid) openModal(index);
        });

        // Drag Events for Reordering
        el.addEventListener('mousedown', handleMouseDown);
        el.addEventListener('touchstart', handleTouchStart, { passive: false });

        gridContainer.appendChild(el);

        // Video Observer Logic
        if (item.type === 'video') {
            const video = el.querySelector('video');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {}); 
                        el.querySelector('.bento-buffering').style.display = 'none';
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(video);
        }
    });

    // 2. EXCEPTION LOGIC: Move the last item to be before the second-to-last item
    const allItems = Array.from(gridContainer.children);
    if (allItems.length > 2) {
        const lastItem = allItems[allItems.length - 1];       // Index 6 (Item 7)
        const secondLastItem = allItems[allItems.length - 2]; // Index 5 (Item 6)
        
        // Insert the last item BEFORE the second-to-last item
        gridContainer.insertBefore(lastItem, secondLastItem);
    }
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

    dock.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX), {passive: true});
    window.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX), {passive: true});
    window.addEventListener('touchend', endDrag);
}

/* =========================
GRID REORDERING LOGIC
========================= */
function handleMouseDown(e) {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    draggedElement = target;
    
    const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - e.clientX;
        const dy = moveEvent.clientY - e.clientY;
        
        if (Math.sqrt(dx*dx + dy*dy) > 10) { 
            isDraggingGrid = true;
            target.style.position = 'fixed';
            target.style.zIndex = '1000';
            target.style.width = target.offsetWidth + 'px';
            target.style.height = target.offsetHeight + 'px';
            target.style.pointerEvents = 'none';
            
            moveAt(moveEvent.pageX, moveEvent.pageY);
        }
    };

    const moveAt = (pageX, pageY) => {
        target.style.left = pageX - target.offsetWidth / 2 + 'px';
        target.style.top = pageY - target.offsetHeight / 2 + 'px';
        
        target.style.display = 'none';
        let elemBelow = document.elementFromPoint(pageX, pageY);
        target.style.display = 'block';

        if (!elemBelow) return;
        let draggableBelow = elemBelow.closest('.bento-item');
        
        if (draggableBelow && draggableBelow !== draggedElement) {
            const rectBelow = draggableBelow.getBoundingClientRect();
            const offset = pageY - rectBelow.top;
            if (offset > rectBelow.height / 2) {
                gridContainer.insertBefore(draggedElement, draggableBelow.nextSibling);
            } else {
                gridContainer.insertBefore(draggedElement, draggableBelow);
            }
        }
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        if (isDraggingGrid) {
            target.style.position = 'relative';
            target.style.left = 'auto';
            target.style.top = 'auto';
            target.style.zIndex = '';
            target.style.width = 'auto';
            target.style.height = 'auto';
            target.style.pointerEvents = 'auto';
            updateDataOrder();
            setTimeout(() => { isDraggingGrid = false; }, 100);
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function handleTouchStart(e) {
    const target = e.currentTarget;
    draggedElement = target;

    const onTouchMove = (moveEvent) => {
        const touch = moveEvent.touches[0];
        const dx = touch.clientX - e.touches[0].clientX;
        const dy = touch.clientY - e.touches[0].clientY;

        if (Math.sqrt(dx*dx + dy*dy) > 10) {
            isDraggingGrid = true;
            moveEvent.preventDefault();
            target.style.position = 'fixed';
            target.style.zIndex = '1000';
            target.style.width = target.offsetWidth + 'px';
            target.style.height = target.offsetHeight + 'px';
            
            moveAt(touch.pageX, touch.pageY);
        }
    };

    const moveAt = (pageX, pageY) => {
        target.style.left = pageX - target.offsetWidth / 2 + 'px';
        target.style.top = pageY - target.offsetHeight / 2 + 'px';

        target.style.display = 'none';
        let elemBelow = document.elementFromPoint(pageX, pageY);
        target.style.display = 'block';

        if (!elemBelow) return;
        let draggableBelow = elemBelow.closest('.bento-item');
        
        if (draggableBelow && draggableBelow !== draggedElement) {
            const rectBelow = draggableBelow.getBoundingClientRect();
            const offset = pageY - rectBelow.top;
            if (offset > rectBelow.height / 2) {
                gridContainer.insertBefore(draggedElement, draggableBelow.nextSibling);
            } else {
                gridContainer.insertBefore(draggedElement, draggableBelow);
            }
        }
    };

    const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove, { passive: false });
        document.removeEventListener('touchend', onTouchEnd);
        
        if (isDraggingGrid) {
            target.style.position = 'relative';
            target.style.left = 'auto';
            target.style.top = 'auto';
            target.style.zIndex = '';
            target.style.width = 'auto';
            target.style.height = 'auto';
            updateDataOrder();
            setTimeout(() => { isDraggingGrid = false; }, 100);
        }
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
}

function updateDataOrder() {
    const newOrder = Array.from(gridContainer.children).map(el => {
        const originalIndex = parseInt(el.dataset.index);
        return mediaItems[originalIndex];
    });
    mediaItems.length = 0;
    mediaItems.push(...newOrder);
    Array.from(gridContainer.children).forEach((el, idx) => {
        el.dataset.index = idx;
    });
    if(modal.classList.contains('active')) renderDock();
}

/* =========================
START
========================= */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}