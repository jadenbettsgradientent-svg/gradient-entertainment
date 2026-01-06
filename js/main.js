// --- CONFIGURATION ---
const CURATED_SLUGS = [
    "the-valley-versus-everyone", "fiducia", "wiped", "its-meant-to-make-you-calm",
    "higher-education", "one-of-the-good-ones", "temporal-anomalies-and-other-bad-decisions", "black-flag"
];

let projectsData = [];

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
    // 1. SPLASH SCREEN
    if (document.getElementById("hero-anim")) initHome();
    
    // 2. GLOBAL UI
    initNav();
    if (typeof initBrandHover === "function") initBrandHover();

    // 3. LOAD DATA (Contentful)
    await loadData();

    // 4. PAGE SPECIFIC INITS
    if (document.getElementById("bio-drawer")) initAbout();
    if (document.getElementById("slate-list")) initDevelopment();
    if (document.getElementById("p-logline")) initProjectDetail();
    if (document.getElementById("subject-line")) initContact();
});

// --- DATA LOADER (Contentful) ---
async function loadData() {
    const SPACE_ID = "ut9h8w91o4u6"; 
    const ACCESS_TOKEN = "P18QDYKr8dwHgqmwoNSG-1bQ0lbfmpD0BYaENeptYAo";
    
    // Ensure "gradientSlate" matches your Content Type ID exactly
    const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries?access_token=${ACCESS_TOKEN}&content_type=gradientSlate`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fetch failed");
        
        const data = await response.json();
        
        projectsData = data.items.map(item => {
            const f = item.fields;
            
            // 1. Handle Poster URL (Safe Check)
            let posterUrl = "";
            if (f.poster && data.includes && data.includes.Asset) {
                // Find the matching asset in the includes array
                const asset = data.includes.Asset.find(a => a.sys.id === f.poster.sys.id);
                if (asset && asset.fields && asset.fields.file) {
                    posterUrl = "https:" + asset.fields.file.url;
                }
            }

            // 2. Handle Materials Text
            // Check if field ID is "materialsAvailable" OR "materials" just in case
            const matText = f.materialsAvailable || f.materials || "Assets Coming Soon";

            // DEBUG: See exactly what we found in the console
            console.log(`Loaded: ${f.title} | Poster: ${posterUrl ? "YES" : "NO"} | Materials: ${matText}`);

            return {
                title: f.title,
                slug: f.slug,
                format: f.format,
                genres: f.genre ? f.genre.split(",").map(s => s.trim()) : [], 
                logline: f.logline,
                poster: posterUrl, 
                materialsAvailable: matText,
                assets: [], 
                tags: [] 
            };
        });

    } catch (e) {
        console.error("Error loading Contentful data:", e);
        if (window.LOCAL_PROJECTS_DATA) projectsData = window.LOCAL_PROJECTS_DATA;
    }
}

// --- PAGE: PROJECT DETAIL ---
function initProjectDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("p");
    const container = document.querySelector("main");
    
    const p = projectsData.find(x => x.slug === slug);
    
    if(!p) {
        container.innerHTML = "<div style='padding:4rem; text-align:center;'><h1>Project not found.</h1><a href='development.html' style='color:white;'>Back to Slate</a></div>";
        return;
    }

    document.title = `${p.title} | Gradient Entertainment`;
    
    // Basic Info
    const titleEl = document.getElementById("p-title");
    if(titleEl) titleEl.innerText = p.title;

    const metaEl = document.getElementById("p-meta");
    if(metaEl) metaEl.innerText = `${p.format} • ${p.genres.join(", ")}`;

    const loglineEl = document.getElementById("p-logline");
    if(loglineEl) loglineEl.innerText = p.logline;
    
    // --- FIX 1: POSTER IMAGE ---
    const posterEl = document.getElementById("p-image");
    if(posterEl) {
        if (p.poster) {
            posterEl.src = p.poster;
            posterEl.style.display = "block"; // Ensure it's visible
        } else {
            posterEl.style.display = "none"; // Hide if no poster
        }
    }

    // --- FIX 2: MATERIALS TEXT ---
    const assetContainer = document.getElementById("asset-container");
    if(assetContainer) {
        assetContainer.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 0.5rem;">Materials Available</h3>
                <p style="font-size: 1.1rem; color: white;">${p.materialsAvailable}</p>
            </div>
            <a href="contact.html?project=${p.slug}" class="btn-primary">Request Materials</a>
        `;
    }

    // Back Link
    const backLink = document.getElementById("back-link");
    if(backLink) backLink.href = "development.html";
}

// --- NAVIGATION ---
function initNav() {
    const links = document.querySelectorAll(".nav-links a");
    const currentPath = window.location.pathname;
    links.forEach(link => {
        const href = link.getAttribute("href");
        if(href && currentPath.includes(href)) link.classList.add("active");
    });
}

// --- HOME (SPLASH) ---
function initHome() {
    const contentWrapper = document.getElementById("hero-content");
    const video = document.getElementById("hero-anim");
    const audio = document.getElementById("hero-audio"); 

    if(audio) { audio.volume = 0.5; audio.play().catch(() => {}); }

    const triggerExit = () => {
        if(contentWrapper) contentWrapper.classList.add("zoom-exit");
        setTimeout(() => { window.location.href = "about.html"; }, 800);
    };

    if(video) {
        video.play().then(() => { setTimeout(triggerExit, 3500); })
             .catch(() => { setTimeout(triggerExit, 500); });
    } else {
        triggerExit();
    }
}

// --- HEADER LOGO ---
function initBrandHover() {
    const container = document.getElementById("brand-logo");
    if (container) {
        const video = container.querySelector(".brand-video");
        container.addEventListener("mouseenter", () => {
            container.classList.add("playing");
            if (video) { video.currentTime = 0; video.play().catch(e => {}); }
        });
        container.addEventListener("mouseleave", () => {
            setTimeout(() => {
                container.classList.remove("playing");
                if (video) video.pause();
            }, 300); 
        });
    }
}

// --- ABOUT ---
function initAbout() {
    const overlay = document.getElementById("drawer-overlay");
    const closeBtn = document.getElementById("close-drawer");
    const imgEl = document.getElementById("bio-image");
    const nameEl = document.getElementById("bio-name");
    const headlineEl = document.getElementById("bio-headline");
    const textEl = document.getElementById("bio-text");
    
    const bios = {
        "jaden": {
            name: "Jaden Isaiah Betts",
            headline: "Actor / Writer / Producer",
            image: "assets/founders/jaden.jpeg", 
            text: `Jaden Betts is a Los Angeles native and proud product of the San Fernando Valley. A natural storyteller, he’s been working in the entertainment industry since he was just 8 months old. With over 30 film and television credits—including Scandal, Doc McStuffins, The Conners, Schooled, SEAL Team, and The Stinky & Dirty Show—Jaden quite literally grew up on set, carving out a career defined by range, nuance, and quiet charisma.<br><br>He spent five years training and performing improv and sketch at UCB, sharpening his comedic instincts, and deepening his storytelling craft through programs with the Hillman Grad Foundation. Today, Jaden brings the same grounded, emotionally honest sensibility to both sides of the camera. Whether he’s acting, writing, or developing new work, his focus remains the same: telling stories with heart, humor, and just the right amount of chaos—much like the Valley that raised him.`
        },
        "jake": {
            name: "Jake Elliott",
            headline: "Actor / Writer",
            image: "assets/founders/jake.jpg",
            text: `Jake Elliott is a half Middle Eastern actor and writer who started acting at the age five years old and never stopped; landing roles in shows like 2 Broke Girls, How I Met Your Mother, and most recently Netflix’s Monsters. He worked on his comedic timing and improv at Second City LA, training for over 5 years and eventually joining Second City's Teen Troupe. When not on set, he was busy graduating top of his class from UCSB with a degree in Economics. Growing up both mixed and apart of Gen Z, Jake focuses on stories about finding yourself and how sometimes the best way to fit in is to stand out.`
        },
        "cameron": {
            name: "Cameron Cortes",
            headline: "Actor / Writer / Producer",
            image: "assets/founders/cameron.jpg",
            text: `Born October 18, 2000 in Burbank, CA, Carlos “Cameron” Cortes is a young Afro Latino actor, writer, & producer raised in the South Side of Chicago. He has garnered training from his studies at Trinity College in Hartford, CT, Morehouse College in Atlanta, GA, as well as the La Mama Theatre Company in New York City. He’s been both in front and behind the camera since the age of 7 through his work with Ford Modeling Agency, as well as his own experiences with his father and DP at CBS, Carlos Cortes Sr.<br><br>Cameron is a young creative whose main prerogative is to be apart of producing great & memorable stories that resonate with his audience.`
        }
    };

    document.querySelectorAll(".founder-card button").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const data = bios[id];
            if(imgEl) imgEl.src = data.image;
            nameEl.innerText = data.name;
            headlineEl.innerText = data.headline;
            textEl.innerHTML = data.text;
            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
            closeBtn.focus();
        });
    });

    const close = () => {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        setTimeout(() => { if(imgEl) imgEl.src = ""; }, 400); 
    };

    if(closeBtn) closeBtn.addEventListener("click", close);
    if(overlay) overlay.addEventListener("click", (e) => { if(e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => { if(e.key === "Escape") close(); });
}

// --- DEVELOPMENT ---
function initDevelopment() {
    const listContainer = document.getElementById("slate-list");
    const searchInput = document.getElementById("search-input");
    const toggle = document.getElementById("slate-toggle");
    const filterContainer = document.getElementById("filter-chips");
    
    let activeFilter = "All";
    let isCurated = false;

    const genres = new Set();
    projectsData.forEach(p => p.genres.forEach(g => genres.add(g)));
    
    filterContainer.innerHTML = `<button class="chip active" data-filter="All">All</button>`;
    genres.forEach(g => {
        filterContainer.innerHTML += `<button class="chip" data-filter="${g}">${g}</button>`;
    });

    filterContainer.addEventListener("click", (e) => {
        if(e.target.classList.contains("chip")) {
            document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            e.target.classList.add("active");
            activeFilter = e.target.getAttribute("data-filter");
            renderSlate();
        }
    });

    searchInput.addEventListener("input", renderSlate);
    toggle.addEventListener("change", (e) => {
        isCurated = e.target.checked;
        renderSlate();
    });

    function renderSlate() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filtered = projectsData.filter(p => {
            if (isCurated && !CURATED_SLUGS.includes(p.slug)) return false;
            const textMatch = p.title.toLowerCase().includes(searchTerm) || p.logline.toLowerCase().includes(searchTerm);
            if (!textMatch) return false;
            if (activeFilter !== "All") {
                if (!p.genres.includes(activeFilter) && p.format !== activeFilter) return false;
            }
            return true;
        });

        listContainer.innerHTML = "";
        
        filtered.forEach(p => {
            const card = document.createElement("div");
            card.className = "project-card";
            card.onclick = () => window.location.href = `project.html?p=${p.slug}`;
            
            const displayGenres = p.genres.slice(0, 2).join(" / ");

            card.innerHTML = `
                <div>
                    <div class="card-format">${p.format}</div>
                    <h3 class="card-title">${p.title}</h3>
                    <p class="card-logline">${p.logline}</p>
                </div>
                
                <div class="card-footer">
                    <span class="card-genres">${displayGenres}</span>
                    <span class="card-arrow">&rarr;</span>
                </div>
            `;
            listContainer.appendChild(card);
        });
        
        const cards = document.querySelectorAll(".project-card");
        cards.forEach((c, index) => {
            c.style.opacity = "0";
            c.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.05}s`;
        });
    }
    renderSlate();
}

// --- CONTACT ---
function initContact() {
    const params = new URLSearchParams(window.location.search);
    const projectSlug = params.get("project");
    
    const select = document.getElementById("project-select");
    const subjectLine = document.getElementById("subject-line");

    if(projectsData && select) {
        projectsData.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.title; 
            opt.innerText = p.title;
            select.appendChild(opt);
        });
    }

    if(projectSlug && select) {
        const p = projectsData.find(x => x.slug === projectSlug);
        if(p) {
            select.value = p.title;
            if(subjectLine) subjectLine.innerText = `Inquiry — ${p.title}`;
        }
    }

    if(select && subjectLine) {
        select.addEventListener("change", (e) => {
            const val = e.target.value;
            if(val && val !== "General Inquiry") {
                subjectLine.innerText = `Inquiry — ${val}`;
            } else {
                subjectLine.innerText = "Collaborate. Inquire. Create.";
            }
        });
    }
}