import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://nsmioyqhnefljfpmzksk.supabase.co",
  "sb_publishable_skwyA6GX4YTiiRpvF8PWFw_iHUFgXCZ"
);

const fileInput = document.getElementById('upload-json');
const fileNameDisplay = document.getElementById('file-name');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

fileInput.addEventListener('change', () => {
  const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file chosen';
  fileNameDisplay.textContent = fileName;
});

// Show login form or user info depending on auth state
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    loginForm.style.display = 'none';
    userInfo.textContent = `Logged in as ${session.user.email}`;
    userInfo.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
  } else {
    loginForm.style.display = 'block';
    userInfo.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  const { data,error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    alert('Login successful!');
    checkAuth();
  }
});

// Handle logout button click
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  alert('Logged out');
  checkAuth();
});

// Initial auth check on page load
checkAuth();

/* =========================
DOWNLOAD JSON
========================= */
document.getElementById("download-json").addEventListener("click", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Please log in to download JSON");
    return;
  }

  const { data, error } = await supabase
    .from("modules")
    .select(`
      id,
      title,
      description,
      duration,
      sort_order,
      chapters (
        id,
        title,
        video_id,
        duration,
        description,
        links,
        sort_order
      )
    `)
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "chapters", ascending: true });

  if (error) {
    alert("Failed to download JSON");
    console.error(error);
    return;
  }

  const json = {
    modules: data.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      duration: m.duration,
      chapters: (m.chapters || []).map(c => ({
        id: c.id,
        title: c.title,
        videoId: c.video_id || "",
        duration: c.duration,
        description: c.description,
        links: c.links || []
      }))
    }))
  };

  downloadFile("learning-data.json", JSON.stringify(json, null, 2));
});

/* =========================
UPLOAD JSON
========================= */
document.getElementById("upload-btn").addEventListener("click", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Please log in to upload JSON");
    return;
  }

  const fileInput = document.getElementById("upload-json");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a JSON file first");
    return;
  }

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    validateJSON(json);

    await syncToSupabase(json);

    alert("JSON uploaded and synced successfully 🎉");
  } catch (err) {
    console.error(err);
    alert("Upload failed: " + err.message);
  }
});

/* =========================
SYNC LOGIC
========================= */
async function syncToSupabase(json) {
  await supabase.from("chapters").delete().neq("id", "");
  await supabase.from("modules").delete().neq("id", "");

  const modulesPayload = json.modules.map((m, index) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    duration: m.duration,
    sort_order: index + 1
  }));

  const { error: modulesError } = await supabase
    .from("modules")
    .insert(modulesPayload);

  if (modulesError) throw modulesError;

  const chaptersPayload = json.modules.flatMap((m) =>
    (m.chapters || []).map((c, cIndex) => ({
      id: c.id,
      module_id: m.id,
      title: c.title,
      video_id: c.videoId || "",
      duration: c.duration,
      description: c.description,
      links: Array.isArray(c.links) ? c.links : [],
      sort_order: cIndex + 1
    }))
  );

  const { error: chaptersError } = await supabase
    .from("chapters")
    .insert(chaptersPayload);

  if (chaptersError) throw chaptersError;
}

/* =========================
VALIDATION
========================= */
function validateJSON(json) {
  if (!json.modules || !Array.isArray(json.modules)) {
    throw new Error("Invalid JSON: missing or invalid modules array");
  }

  json.modules.forEach(m => {
    if (!m.id || !m.title || !Array.isArray(m.chapters)) {
      throw new Error(`Invalid module: ${m.id || "missing id"}`);
    }

    m.chapters.forEach(c => {
      if (!c.id || !c.title) {
        throw new Error(`Invalid chapter: ${c.id || "missing id"}`);
      }
      if (!("videoId" in c)) {
        throw new Error(`Invalid chapter: ${c.id} missing videoId`);
      }
      if ("links" in c && !Array.isArray(c.links)) {
        throw new Error(`Invalid chapter: ${c.id} links must be an array`);
      }
    });
  });
}

/* =========================
UTIL
========================= */
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
SIDEBAR NAVIGATION
========================= */
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".admin-section");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();

    const target = item.getAttribute("data-target");

    sections.forEach(sec => sec.classList.remove("active"));

    const targetSection = document.getElementById(target);
    if (targetSection) targetSection.classList.add("active");

    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const headerTitle = document.querySelector('.admin-header h1');
    const headerSubtitle = document.querySelector('.admin-header p');
    if (headerTitle && headerSubtitle) {
      headerTitle.textContent = item.querySelector('span').textContent;
      headerSubtitle.textContent = '';
    }
  });
});
