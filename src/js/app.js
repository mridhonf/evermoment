import '../css/style.css';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const fallbackSettings = {
  brand_name: 'Evermoment',
  tagline: 'Photo · Video · Story',
  whatsapp_number: '6281234567890',
  logo_url: '/default-logo.svg',
  favicon_url: '/favicon.svg'
};

const fallbackPhotos = [
  {
    id: 'p1',
    title: 'Elegant Wedding Detail',
    category: 'Wedding',
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
    sort_order: 1
  },
  {
    id: 'p2',
    title: 'Prewedding Outdoor',
    category: 'Prewedding',
    image_url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1000&q=80',
    sort_order: 2
  },
  {
    id: 'p3',
    title: 'Commercial Product Shoot',
    category: 'Commercial',
    image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
    sort_order: 3
  },
  {
    id: 'p4',
    title: 'Event Documentation',
    category: 'Event',
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80',
    sort_order: 4
  },
  {
    id: 'p5',
    title: 'Portrait Session',
    category: 'Portrait',
    image_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80',
    sort_order: 5
  }
];

const fallbackVideos = [
  {
    id: 'v1',
    title: 'Wedding Highlight',
    category: 'Wedding',
    thumbnail_url: 'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    sort_order: 1
  },
  {
    id: 'v2',
    title: 'Brand Story Film',
    category: 'Commercial',
    thumbnail_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    sort_order: 2
  }
];

const fallbackPackages = [
  {
    id: 'pkg1',
    name: 'Basic',
    price: 'Rp 750.000',
    description: 'Untuk kebutuhan sesi foto personal dan dokumentasi ringan.',
    features: ['1 fotografer', '2 jam sesi', '30 foto edit', 'Online gallery'],
    category: 'Photo',
    sort_order: 1
  },
  {
    id: 'pkg2',
    name: 'Signature',
    price: 'Rp 1.500.000',
    description: 'Paket khusus video untuk highlight acara dan momen utama.',
    features: ['1 videografer', '4 jam coverage', 'Highlight video 1 menit', 'Color grading basic'],
    category: 'Video',
    sort_order: 2
  },
  {
    id: 'pkg3',
    name: 'Premium',
    price: 'Rp 2.800.000',
    description: 'Paket gabungan untuk kebutuhan dokumentasi lengkap.',
    features: ['Full day coverage', '150 foto edit', 'Cinematic video 3-5 menit', 'Thumbnail & preview cepat'],
    category: 'Lainnya',
    sort_order: 3
  }
];

let state = {
  settings: fallbackSettings,
  photos: fallbackPhotos,
  videos: fallbackVideos,
  packages: fallbackPackages,
  activePhotoFilter: 'Semua',
  activePackageCategory: null
};

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function setText(selector, value) {
  const el = qs(selector);
  if (el) el.textContent = value;
}


function normalizePackageCategory(category) {
  const value = String(category || '').trim().toLowerCase();
  if (['foto', 'photo', 'photography'].includes(value)) return 'Photo';
  if (['video', 'videography', 'videografi'].includes(value)) return 'Video';
  return 'Lainnya';
}

function normalizeFeatures(features) {
  if (Array.isArray(features)) return features.filter(Boolean);
  if (typeof features === 'string') {
    return features.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function setBrand(settings) {
  setText('#brand-name', settings.brand_name || fallbackSettings.brand_name);
  setText('#brand-tagline', settings.tagline || fallbackSettings.tagline);

  const logo = qs('#site-logo');
  if (logo) logo.src = settings.logo_url || fallbackSettings.logo_url;

  const favicon = qs('#favicon-link');
  if (favicon) favicon.href = settings.favicon_url || fallbackSettings.favicon_url;

  document.title = `${settings.brand_name || fallbackSettings.brand_name} — Photo Video Story`;
}

async function fetchTable(tableName, fallback) {
  if (!isSupabaseConfigured) return fallback;

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn(`Gagal mengambil ${tableName}:`, error.message);
    return fallback;
  }

  return data || [];
}

async function fetchSettings() {
  if (!isSupabaseConfigured) return fallbackSettings;

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Gagal mengambil site_settings:', error.message);
    return fallbackSettings;
  }

  return data ? { ...fallbackSettings, ...data } : fallbackSettings;
}

function renderFilters() {
  const wrapper = qs('#photo-filters');
  if (!wrapper) return;

  const categories = ['Semua', ...new Set(state.photos.map((photo) => photo.category).filter(Boolean))];

  wrapper.innerHTML = categories
    .map((category) => `
      <button class="filter-button ${category === state.activePhotoFilter ? 'active' : ''}" type="button" data-filter="${category}">
        ${category}
      </button>
    `)
    .join('');

  wrapper.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activePhotoFilter = button.dataset.filter;
      renderFilters();
      renderPhotos();
    });
  });
}

function renderPhotos() {
  const grid = qs('#photo-grid');
  const empty = qs('#photo-empty');
  if (!grid) return;

  const photos = state.activePhotoFilter === 'Semua'
    ? state.photos
    : state.photos.filter((photo) => photo.category === state.activePhotoFilter);

  grid.innerHTML = photos
    .map((photo) => `
      <button class="photo-card" type="button" data-media-type="image" data-src="${photo.image_url}" data-title="${photo.title || 'Photo Project'}" data-meta="${photo.category || 'Portfolio'}">
        <img src="${photo.image_url}" alt="${photo.title || 'Portfolio photo'}" loading="lazy" />
        <span>${photo.title || 'Untitled Project'}</span>
      </button>
    `)
    .join('');

  if (empty) empty.hidden = photos.length > 0;
  bindMediaButtons(grid);
}

function renderVideos() {
  const list = qs('#video-list');
  const empty = qs('#video-empty');
  if (!list) return;

  list.innerHTML = state.videos
    .map((video) => `
      <button class="video-card" type="button" data-media-type="video" data-src="${video.video_url}" data-title="${video.title || 'Video Project'}" data-meta="${video.category || 'Video'}">
        <span class="video-thumb">
          <img src="${video.thumbnail_url || fallbackVideos[0].thumbnail_url}" alt="${video.title || 'Video thumbnail'}" loading="lazy" />
          <i class="play-button" aria-hidden="true"></i>
        </span>
        <span>
          <strong>${video.title || 'Untitled Video'}</strong><br />
          <span>${video.category || 'Video Portfolio'}</span>
        </span>
      </button>
    `)
    .join('');

  if (empty) empty.hidden = state.videos.length > 0;
  bindMediaButtons(list);
}

function renderPackages() {
  const categoryGrid = qs('#package-categories');
  const panel = qs('#package-panel');
  const list = qs('#package-list');
  const empty = qs('#package-empty');
  if (!categoryGrid) return;

  if (panel) panel.hidden = true;
  if (list) list.innerHTML = '';

  const whatsapp = state.settings.whatsapp_number || fallbackSettings.whatsapp_number;
  const grouped = state.packages.reduce((acc, pkg) => {
    const key = normalizePackageCategory(pkg.category);
    (acc[key] ||= []).push(pkg);
    return acc;
  }, {});

  const order = ['Photo', 'Video', 'Lainnya'];
  const categories = order;
  const brand = state.settings.brand_name || fallbackSettings.brand_name;

  categoryGrid.innerHTML = categories.map((category) => {
    const categoryPackages = grouped[category] || [];
    const cards = categoryPackages.length
      ? categoryPackages.map((pkg) => {
        const message = encodeURIComponent(`Halo ${brand}, saya mau tanya paket ${pkg.name} (${pkg.price}). Bisa dibantu info detailnya?`);
        return `
          <article class="package-card">
            <span class="package-kind">${category}</span>
            <h3>${pkg.name || 'Paket'}</h3>
            <div class="price">${pkg.price || '-'}</div>
            <p>${pkg.description || 'Paket dokumentasi foto dan video.'}</p>
            <ul>
              ${normalizeFeatures(pkg.features).map((feature) => `<li>${feature}</li>`).join('')}
            </ul>
            <a class="btn btn-primary full" href="https://wa.me/${whatsapp}?text=${message}" target="_blank" rel="noopener">Book via WhatsApp</a>
          </article>
        `;
      }).join('')
      : `<p class="empty-state package-empty-inline">Belum ada paket ${category.toLowerCase()}. Tambahkan dari dashboard owner.</p>`;

    return `
      <article class="package-accordion" data-package-accordion>
        <button class="package-category-card package-accordion-toggle" type="button" data-package-category="${category}" aria-expanded="false">
          <span class="text">
            <strong>Paket ${category}</strong>
            <span>Klik untuk melihat pricelist ${category.toLowerCase()}.</span>
          </span>
          <span class="package-accordion-side">
            <span class="package-count">${(grouped[category] || []).length}</span>
            <span class="package-chevron" aria-hidden="true"></span>
          </span>
        </button>
        <div class="package-accordion-body" hidden>
          <div class="package-list">
            ${cards}
          </div>
        </div>
      </article>
    `;
  }).join('');

  categoryGrid.querySelectorAll('[data-package-accordion]').forEach((accordion) => {
    const button = accordion.querySelector('.package-accordion-toggle');
    const body = accordion.querySelector('.package-accordion-body');
    if (!button || !body) return;

    button.addEventListener('click', () => {
      const willOpen = body.hidden;
      body.hidden = !willOpen;
      button.classList.toggle('active', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
      accordion.classList.toggle('open', willOpen);
    });
  });

  if (empty) empty.hidden = categories.length > 0;
}


function bindBottomNav() {
  const links = qsa('.bottom-nav a');
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let navLock = false;
  let lockTimer = null;
  let ticking = false;

  const setActive = (hash) => {
    links.forEach((link) => {
      const isActive = link.getAttribute('href') === hash;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const getCurrentSectionHash = () => {
    const anchorLine = window.innerHeight * 0.42;
    let current = '#home';

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchorLine) current = `#${section.id}`;
    });

    return current;
  };

  const updateActiveFromScroll = () => {
    ticking = false;
    if (navLock) return;
    setActive(getCurrentSectionHash());
  };

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const hash = link.getAttribute('href');
      const target = document.querySelector(hash);
      if (!target) return;

      navLock = true;
      setActive(hash);
      history.pushState(null, '', hash);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => {
        navLock = false;
        setActive(getCurrentSectionHash());
      }, 1050);
    });
  });

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActiveFromScroll);
  }, { passive: true });

  setActive(window.location.hash && document.querySelector(window.location.hash) ? window.location.hash : '#home');
}

function toYoutubeEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    }
    return url;
  } catch {
    return url;
  }
}

function openModal({ type, src, title, meta }) {
  const modal = qs('#media-modal');
  const media = qs('#modal-media');
  if (!modal || !media) return;

  const isYoutube = /youtube\.com|youtu\.be/.test(src);
  const isExternalEmbed = isYoutube;

  media.innerHTML = type === 'image'
    ? `<img src="${src}" alt="${title || 'Preview'}" />`
    : isExternalEmbed
      ? `<iframe src="${toYoutubeEmbed(src)}" title="${title || 'Video'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${src}" controls autoplay playsinline></video>`;

  setText('#modal-title', title || 'Preview');
  setText('#modal-meta', meta || 'Portfolio');
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  const modal = qs('#media-modal');
  const media = qs('#modal-media');
  if (!modal || !media) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  setTimeout(() => { media.innerHTML = ''; }, 180);
}

function bindMediaButtons(scope = document) {
  scope.querySelectorAll('[data-media-type]').forEach((button) => {
    button.addEventListener('click', () => openModal({
      type: button.dataset.mediaType,
      src: button.dataset.src,
      title: button.dataset.title,
      meta: button.dataset.meta
    }));
  });
}

function bindModal() {
  qsa('[data-close-modal]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

async function init() {
  const [settings, photos, videos, packages] = await Promise.all([
    fetchSettings(),
    fetchTable('photos', fallbackPhotos),
    fetchTable('videos', fallbackVideos),
    fetchTable('packages', fallbackPackages)
  ]);

  state = { ...state, settings, photos, videos, packages };
  setBrand(state.settings);
  renderFilters();
  renderPhotos();
  renderVideos();
  renderPackages();
  bindBottomNav();
  bindModal();
}

init();
