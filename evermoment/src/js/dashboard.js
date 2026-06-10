import '../css/style.css';
import { supabase, isSupabaseConfigured, publicUrl } from './supabaseClient.js';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

let currentUser = null;
let settingsRowId = null;

function setMessage(selector, text, isError = false) {
  const el = qs(selector);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('error', isError);
}

function hideView(selector) {
  const el = qs(selector);
  if (!el) return;
  el.hidden = true;
  el.classList.add('is-hidden');
  el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('display', 'none', 'important');
}

function showView(selector) {
  const el = qs(selector);
  if (!el) return;
  el.hidden = false;
  el.classList.remove('is-hidden');
  el.removeAttribute('aria-hidden');
  el.style.removeProperty('display');
}

function showLogin(message = '', isError = false) {
  showView('#login-view');
  hideView('#dashboard-view');
  setMessage('#login-message', message, isError);
}

function showDashboard() {
  hideView('#login-view');
  showView('#dashboard-view');
  setMessage('#login-message', '');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function normalizePackageCategory(category) {
  const value = String(category || '').trim().toLowerCase();
  if (['foto', 'photo', 'photography'].includes(value)) return 'Foto';
  if (['video', 'videography', 'videografi'].includes(value)) return 'Video';
  return 'Lainnya';
}

function normalizeFeaturesInput(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uploadFile(bucket, file, folder = '') {
  if (!file) return '';
  if (!currentUser) throw new Error('User belum login.');

  const safeName = normalizeFileName(file.name);
  const path = `${folder ? `${folder}/` : ''}${currentUser.id}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw error;
  return publicUrl(bucket, path);
}

async function loadSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    settingsRowId = data.id;
    qs('#brand-name-input').value = data.brand_name || '';
    qs('#tagline-input').value = data.tagline || '';
    qs('#whatsapp-input').value = data.whatsapp_number || '';

    const favicon = qs('#favicon-link');
    if (favicon && data.favicon_url) favicon.href = data.favicon_url;
  }
}

async function saveSettings(event) {
  event.preventDefault();
  setMessage('#settings-message', 'Menyimpan setting...');

  try {
    const logoFile = qs('#logo-input').files[0];
    const faviconFile = qs('#favicon-input').files[0];

    const payload = {
      brand_name: qs('#brand-name-input').value.trim() || 'Evermoment',
      tagline: qs('#tagline-input').value.trim() || 'Photo · Video · Story',
      whatsapp_number: qs('#whatsapp-input').value.trim() || '6281234567890',
      updated_at: new Date().toISOString()
    };

    if (logoFile) payload.logo_url = await uploadFile('logos', logoFile, 'brand');
    if (faviconFile) payload.favicon_url = await uploadFile('logos', faviconFile, 'favicon');

    if (settingsRowId) {
      const { error } = await supabase.from('site_settings').update(payload).eq('id', settingsRowId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('site_settings').insert(payload).select('id').single();
      if (error) throw error;
      settingsRowId = data.id;
    }

    setMessage('#settings-message', 'Setting berhasil disimpan. Refresh website utama untuk melihat perubahan.');
  } catch (error) {
    setMessage('#settings-message', error.message || 'Gagal menyimpan setting.', true);
  }
}

async function loadPackages() {
  const list = qs('#packages-admin-list');
  list.innerHTML = '<p class="muted">Memuat paket...</p>';

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    list.innerHTML = `<p class="form-message error">${error.message}</p>`;
    return;
  }

  if (!data?.length) {
    list.innerHTML = '<p class="empty-state">Belum ada paket. Klik tombol tambah paket.</p>';
    return;
  }

  list.innerHTML = data.map((pkg) => `
    <article class="package-admin-card" data-package-id="${pkg.id}">
      <label>Nama paket <input type="text" data-field="name" value="${pkg.name || ''}" /></label>
      <label>Harga <input type="text" data-field="price" value="${pkg.price || ''}" /></label>
      <label>Urutan <input type="number" data-field="sort_order" value="${pkg.sort_order ?? 0}" /></label>
      <label class="checkbox-line"><input type="checkbox" data-field="is_active" ${pkg.is_active ? 'checked' : ''} /> Aktif</label>
      <label class="wide-input">Deskripsi <textarea data-field="description">${pkg.description || ''}</textarea></label>
      <label class="wide-input">Fitur paket <textarea data-field="features">${Array.isArray(pkg.features) ? pkg.features.join('\n') : ''}</textarea></label>
      <div class="row-actions wide-input">
        <button class="btn btn-primary" type="button" data-save-package>Simpan Paket</button>
        <button class="btn danger" type="button" data-delete-package>Hapus</button>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-save-package]').forEach((button) => button.addEventListener('click', savePackage));
  list.querySelectorAll('[data-delete-package]').forEach((button) => button.addEventListener('click', deletePackage));
}

async function addPackage() {
  const { error } = await supabase.from('packages').insert({
    name: 'Paket Baru',
    category: 'Lainnya',
    price: 'Rp 0',
    description: 'Tulis deskripsi paket di sini.',
    features: ['Fitur pertama', 'Fitur kedua'],
    sort_order: 99,
    is_active: true
  });

  if (error) alert(error.message);
  await loadPackages();
}

async function savePackage(event) {
  const card = event.target.closest('[data-package-id]');
  const id = card.dataset.packageId;

  const payload = {
    name: card.querySelector('[data-field="name"]').value.trim(),
    category: card.querySelector('[data-field="category"]').value.trim(),
    price: card.querySelector('[data-field="price"]').value.trim(),
    description: card.querySelector('[data-field="description"]').value.trim(),
    features: normalizeFeaturesInput(card.querySelector('[data-field="features"]').value),
    sort_order: Number(card.querySelector('[data-field="sort_order"]').value || 0),
    is_active: card.querySelector('[data-field="is_active"]').checked,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('packages').update(payload).eq('id', id);
  if (error) alert(error.message);
  else alert('Paket berhasil disimpan.');
}

async function deletePackage(event) {
  if (!confirm('Hapus paket ini?')) return;
  const card = event.target.closest('[data-package-id]');
  const { error } = await supabase.from('packages').delete().eq('id', card.dataset.packageId);
  if (error) alert(error.message);
  await loadPackages();
}

async function savePhoto(event) {
  event.preventDefault();
  setMessage('#photo-message', 'Mengupload foto...');

  try {
    const file = qs('#photo-file').files[0];
    const imageUrl = await uploadFile('photos', file, 'portfolio');

    const payload = {
      title: qs('#photo-title').value.trim(),
      category: qs('#photo-category').value.trim(),
      image_url: imageUrl,
      sort_order: Number(qs('#photo-order').value || 0),
      is_active: qs('#photo-active').checked
    };

    const { error } = await supabase.from('photos').insert(payload);
    if (error) throw error;

    qs('#photo-form').reset();
    qs('#photo-active').checked = true;
    setMessage('#photo-message', 'Foto berhasil ditambahkan.');
    await loadMediaLists();
  } catch (error) {
    setMessage('#photo-message', error.message || 'Gagal upload foto.', true);
  }
}

async function saveVideo(event) {
  event.preventDefault();
  setMessage('#video-message', 'Menyimpan video...');

  try {
    const thumbnailFile = qs('#video-thumbnail').files[0];
    const videoFile = qs('#video-file').files[0];
    const manualVideoUrl = qs('#video-url').value.trim();

    if (!videoFile && !manualVideoUrl) throw new Error('Isi file video atau link video.');

    const thumbnailUrl = await uploadFile('video-thumbnails', thumbnailFile, 'thumbnails');
    const videoUrl = videoFile ? await uploadFile('videos', videoFile, 'portfolio') : manualVideoUrl;

    const payload = {
      title: qs('#video-title').value.trim(),
      category: qs('#video-category').value.trim(),
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      sort_order: Number(qs('#video-order').value || 0),
      is_active: qs('#video-active').checked
    };

    const { error } = await supabase.from('videos').insert(payload);
    if (error) throw error;

    qs('#video-form').reset();
    qs('#video-active').checked = true;
    setMessage('#video-message', 'Video berhasil ditambahkan.');
    await loadMediaLists();
  } catch (error) {
    setMessage('#video-message', error.message || 'Gagal menyimpan video.', true);
  }
}

async function loadMediaLists() {
  await Promise.all([loadPhotosAdmin(), loadVideosAdmin()]);
}

async function loadPhotosAdmin() {
  const container = qs('#photos-admin-list');
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    container.innerHTML = `<p class="form-message error">${error.message}</p>`;
    return;
  }

  container.innerHTML = data?.length
    ? data.map((item) => `
      <article class="admin-media-card" data-photo-id="${item.id}">
        <img src="${item.image_url}" alt="${item.title || 'Foto'}" />
        <div class="body">
          <strong>${item.title || 'Tanpa judul'}</strong>
          <span>${item.category || 'Kategori'} · ${item.is_active ? 'Aktif' : 'Nonaktif'}</span>
          <button class="btn danger" type="button" data-delete-photo>Hapus Foto</button>
        </div>
      </article>
    `).join('')
    : '<p class="empty-state">Belum ada foto.</p>';

  container.querySelectorAll('[data-delete-photo]').forEach((button) => button.addEventListener('click', deletePhoto));
}

async function loadVideosAdmin() {
  const container = qs('#videos-admin-list');
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    container.innerHTML = `<p class="form-message error">${error.message}</p>`;
    return;
  }

  container.innerHTML = data?.length
    ? data.map((item) => `
      <article class="admin-media-card" data-video-id="${item.id}">
        <img src="${item.thumbnail_url}" alt="${item.title || 'Video'}" />
        <div class="body">
          <strong>${item.title || 'Tanpa judul'}</strong>
          <span>${item.category || 'Kategori'} · ${item.is_active ? 'Aktif' : 'Nonaktif'}</span>
          <button class="btn danger" type="button" data-delete-video>Hapus Video</button>
        </div>
      </article>
    `).join('')
    : '<p class="empty-state">Belum ada video.</p>';

  container.querySelectorAll('[data-delete-video]').forEach((button) => button.addEventListener('click', deleteVideo));
}

async function deletePhoto(event) {
  if (!confirm('Hapus foto ini dari database?')) return;
  const card = event.target.closest('[data-photo-id]');
  const { error } = await supabase.from('photos').delete().eq('id', card.dataset.photoId);
  if (error) alert(error.message);
  await loadPhotosAdmin();
}

async function deleteVideo(event) {
  if (!confirm('Hapus video ini dari database?')) return;
  const card = event.target.closest('[data-video-id]');
  const { error } = await supabase.from('videos').delete().eq('id', card.dataset.videoId);
  if (error) alert(error.message);
  await loadVideosAdmin();
}

function bindTabs() {
  qsa('[data-admin-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.adminTab;
      qsa('[data-admin-tab]').forEach((btn) => btn.classList.toggle('active', btn === button));
      qs('#photos-admin-list').hidden = tab !== 'photos';
      qs('#videos-admin-list').hidden = tab !== 'videos';
    });
  });
}

async function verifyOwnerAccess() {
  if (!currentUser?.id) return false;

  // Versi database project terbaru memakai table admin_users dengan kolom id = auth.users.id.
  // Sebagian setup awal memakai app_admins dengan kolom user_id. Dua-duanya dicek agar aman.
  const checks = [
    { table: 'admin_users', column: 'id' },
    { table: 'app_admins', column: 'user_id' }
  ];

  let lastError = null;

  for (const check of checks) {
    const { data, error } = await supabase
      .from(check.table)
      .select('*')
      .eq(check.column, currentUser.id)
      .maybeSingle();

    if (!error && data) return true;
    if (error) lastError = error;
  }

  // Kalau table admin memang belum dibuat, tampilkan pesan yang lebih jelas.
  if (lastError && ['42P01', '42703'].includes(lastError.code)) {
    throw new Error('Table admin owner belum cocok. Jalankan ulang SQL database project, lalu masukkan User UID owner ke table admin_users.');
  }

  return false;
}

async function login(event) {
  event.preventDefault();

  if (!isSupabaseConfigured) {
    showLogin('Supabase belum diatur. Isi .env.local atau Environment Variables di Vercel.', true);
    return;
  }

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Memeriksa...';
  setMessage('#login-message', 'Memeriksa akun...');

  try {
    const email = qs('#login-email').value.trim();
    const password = qs('#login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    currentUser = data.user;
    await startDashboard();
  } catch (error) {
    showLogin(error.message || 'Login gagal. Cek email dan password.', true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Login';
  }
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  qs('#login-form')?.reset();
  showLogin('Kamu sudah logout.');
}

async function startDashboard() {
  setMessage('#login-message', 'Memeriksa akses owner...');

  try {
    const isOwner = await verifyOwnerAccess();

    if (!isOwner) {
      await supabase.auth.signOut();
      currentUser = null;
      showLogin('Akun berhasil login, tapi belum didaftarkan sebagai owner. Copy User UID dari Supabase Auth, lalu masukkan ke table admin_users atau app_admins sesuai SQL yang kamu pakai.', true);
      return;
    }

    showDashboard();
    await Promise.all([loadSettings(), loadPackages(), loadMediaLists()]);
  } catch (error) {
    await supabase.auth.signOut();
    currentUser = null;
    showLogin(error.message || 'Gagal memuat dashboard.', true);
  }
}

async function init() {
  qs('#login-form')?.addEventListener('submit', login);
  qs('#logout-button')?.addEventListener('click', logout);
  qs('#settings-form')?.addEventListener('submit', saveSettings);
  qs('#add-package-button')?.addEventListener('click', addPackage);
  qs('#photo-form')?.addEventListener('submit', savePhoto);
  qs('#video-form')?.addEventListener('submit', saveVideo);
  bindTabs();

  showLogin('Memeriksa sesi login...');

  if (!isSupabaseConfigured) {
    showLogin('Supabase belum disambungkan. Copy .env.example menjadi .env.local lalu isi URL dan anon key.', true);
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showLogin(error.message, true);
    return;
  }

  if (data.session?.user) {
    currentUser = data.session.user;
    await startDashboard();
  } else {
    showLogin('');
  }

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    if (event === 'SIGNED_OUT') {
      showLogin('');
    }
  });
}

init();
