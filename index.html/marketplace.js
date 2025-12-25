// marketplace.js - FreeImages: search, single upload, preview, download
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  const productsContainer = document.getElementById('images') || document.getElementById('productsz') || document.querySelector('.products-grid');
  const singleUploadBtn = document.getElementById('singleUploadBtn');

  if (!productsContainer) {
    console.warn('products container not found');
    return;
  }

  // Helpers
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const normalize = s => (s||'').toString().toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu,'');

  // Search: filter by name or tags
  function filterImages() {
    const q = normalize(searchInput?.value || '').trim();
    const cards = Array.from(productsContainer.querySelectorAll('.product-card'));
    if (!q) {
      cards.forEach(c => { c.style.display = ''; restoreTitle(c); });
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    cards.forEach(card => {
      const name = normalize(card.dataset.name || '');
      const tags = normalize(card.dataset.tags || '');
      const hay = name + ' ' + tags;
      const match = terms.every(t => hay.includes(t));
      card.style.display = match ? '' : 'none';
      if (match) highlightTitle(card, terms); else restoreTitle(card);
    });
  }

  const onSearch = debounce(filterImages, 160);
  if (searchInput) searchInput.addEventListener('input', onSearch);

  // Highlight title
  function highlightTitle(card, terms) {
    const el = card.querySelector('.product-title');
    if (!el) return;
    const orig = el.getAttribute('data-original') || el.textContent;
    el.setAttribute('data-original', orig);
    let html = orig;
    terms.forEach(t => {
      const safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(safe, 'ig'), m => `<mark>${m}</mark>`);
    });
    el.innerHTML = html;
  }
  function restoreTitle(card) {
    const el = card && card.querySelector('.product-title');
    if (!el) return;
    const orig = el.getAttribute('data-original');
    if (orig != null) el.innerHTML = orig;
  }

  // Single uploader: add image to grid and save to localStorage
  function initSingleUploader() {
    if (!singleUploadBtn) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none';
    document.body.appendChild(input);
    singleUploadBtn.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        const defaultName = (file.name || 'image').replace(/\.[^/.]+$/, '');
        openNameModal({ dataUrl, defaultName, file });
      };
      reader.readAsDataURL(file);
      // reset will be handled after modal actions
    });
  }

  // Modal to ask user for image name and tags before saving
  function openNameModal({ dataUrl, defaultName='', file }) {
    // prevent multiple modals
    if (document.getElementById('fi-name-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'fi-name-modal';
    overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:1300;padding:20px;';

    const form = document.createElement('form');
    form.style.cssText = 'background:#fff;padding:18px;border-radius:8px;max-width:420px;width:100%;box-shadow:0 8px 24px rgba(0,0,0,0.35);';

    const title = document.createElement('h3'); title.textContent = 'Detail Gambar'; title.style.marginTop='0';
    const preview = document.createElement('div'); preview.style.cssText = 'height:160px;background-size:cover;background-position:center;border-radius:6px;margin-bottom:12px;'; preview.style.backgroundImage = `url('${dataUrl}')`;

    const nameLabel = document.createElement('label'); nameLabel.textContent = 'Nama gambar'; nameLabel.style.display='block'; nameLabel.style.marginBottom='6px';
    const nameInput = document.createElement('input'); nameInput.type='text'; nameInput.value = defaultName; nameInput.required = true; nameInput.style.cssText='width:100%;padding:8px;margin-bottom:12px;border:1px solid #ddd;border-radius:4px;';

    const tagLabel = document.createElement('label'); tagLabel.textContent = 'Tag (pisahkan dengan spasi)'; tagLabel.style.display='block'; tagLabel.style.marginBottom='6px';
    const tagInput = document.createElement('input'); tagInput.type='text'; tagInput.placeholder='mis. pemandangan alam sunrise'; tagInput.style.cssText='width:100%;padding:8px;margin-bottom:12px;border:1px solid #ddd;border-radius:4px;';

    const actions = document.createElement('div'); actions.style.cssText='display:flex;gap:8px;justify-content:flex-end;';
    const cancel = document.createElement('button'); cancel.type='button'; cancel.textContent='Batal'; cancel.className='btn btn--ghost';
    const save = document.createElement('button'); save.type='submit'; save.textContent='Simpan & Unggah'; save.className='btn';

    actions.appendChild(cancel); actions.appendChild(save);
    form.appendChild(title); form.appendChild(preview);
    form.appendChild(nameLabel); form.appendChild(nameInput);
    form.appendChild(tagLabel); form.appendChild(tagInput);
    form.appendChild(actions);

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    cancel.addEventListener('click', () => { closeNameModal(); });

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = nameInput.value.trim() || defaultName || 'image';
      const tags = tagInput.value.trim();
      const id = 'u' + Date.now();
      const card = createImageCard({ id, name, src: dataUrl, tags });
      productsContainer.insertBefore(card, productsContainer.firstChild);
      try { localStorage.setItem('freeimg_' + id, JSON.stringify({ id, name, src: dataUrl, tags })); } catch (err) { console.warn('save failed', err); }
      closeNameModal();
    });

    function closeNameModal() { overlay.remove(); }
  }

  // Create card DOM
  function createImageCard({ id, name, src, tags='' }) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.id = id;
    article.dataset.name = name;
    article.dataset.tags = tags;
    article.dataset.src = src;

    const thumb = document.createElement('div'); thumb.className = 'thumb'; thumb.style.backgroundImage = `url('${src}')`;
    thumb.setAttribute('role','img'); thumb.setAttribute('aria-label', name);
    const h3 = document.createElement('h3'); h3.className = 'product-title'; h3.textContent = name;
    const meta = document.createElement('p'); meta.className = 'price'; meta.textContent = 'Free • JPG';
    const actions = document.createElement('div'); actions.className = 'card-actions';
    const dl = document.createElement('button'); dl.className = 'btn btn--download'; dl.dataset.action = 'download'; dl.textContent = 'Download';
    const del = document.createElement('button'); del.className = 'btn btn--delete btn--danger'; del.dataset.action = 'delete'; del.textContent = 'Hapus';
    actions.appendChild(dl);
    actions.appendChild(del);

    article.appendChild(thumb); article.appendChild(h3); article.appendChild(meta); article.appendChild(actions);
    return article;
  }

  // Hapus gambar yang diunggah
  function deleteImage(card) {
    if (!card) return;
    const id = card.dataset.id;
    const isSaved = id && localStorage.getItem('freeimg_' + id);
    const ok = confirm('Hapus gambar ini? Tindakan ini tidak dapat dibatalkan.');
    if (!ok) return;
    if (isSaved) {
      try { localStorage.removeItem('freeimg_' + id); } catch (e) { console.warn('hapus gagal', e); }
    }
    card.remove();
  }

  // Load saved images from localStorage
  function loadSavedImages() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('freeimg_')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        // avoid duplicate if card with same id exists
        if (productsContainer.querySelector(`.product-card[data-id="${obj.id}"]`)) continue;
        const card = createImageCard(obj);
        productsContainer.appendChild(card);
      }
    } catch (e) { /* ignore */ }
  }

  // Download handler
  function handleDownload(card) {
    const src = card.dataset.src || getThumbUrl(card.querySelector('.thumb')) || '';
    if (!src) return alert('Gambar tidak tersedia');
    const ext = src.indexOf('data:') === 0 ? 'png' : (src.split('.').pop().split(/[#?]/)[0] || 'jpg');
    const name = (card.dataset.name || 'image') + '.' + ext;

    // create link and click
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function getThumbUrl(thumbEl) {
    if (!thumbEl) return '';
    const bg = getComputedStyle(thumbEl).backgroundImage || '';
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    return (m && m[1]) ? m[1] : '';
  }

  // Lightbox preview
  function openLightbox(src, title) {
    let overlay = document.getElementById('fi-lightbox');
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = 'fi-lightbox';
      overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);z-index:1200;padding:20px;';
      const img = document.createElement('img'); img.id = 'fi-lightbox-img'; img.style.maxWidth='100%'; img.style.maxHeight='90vh'; img.style.borderRadius='8px';
      const cap = document.createElement('div'); cap.id='fi-lightbox-cap'; cap.style.color='#fff'; cap.style.marginTop='12px'; cap.style.textAlign='center';
      const close = document.createElement('button'); close.textContent='×'; close.style.cssText='position:absolute;right:18px;top:18px;background:#111;color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer;';
      close.addEventListener('click', closeLightbox);
      overlay.appendChild(img); overlay.appendChild(cap); overlay.appendChild(close);
      overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
      document.body.appendChild(overlay);
    }
    document.getElementById('fi-lightbox-img').src = src;
    document.getElementById('fi-lightbox-cap').textContent = title || '';
    overlay.style.display = 'flex';
  }
  function closeLightbox(){ const o = document.getElementById('fi-lightbox'); if(o) o.style.display='none'; }

  // Delegated interactions: download and thumbnail click
  document.body.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn--delete');
    if (delBtn) { const card = delBtn.closest('.product-card'); if (card) { deleteImage(card); } return; }
    const dlBtn = e.target.closest('.btn--download');
    if (dlBtn) {
      const card = dlBtn.closest('.product-card'); if (card) handleDownload(card);
      return;
    }
    const thumb = e.target.closest('.thumb');
    if (thumb) {
      const card = thumb.closest('.product-card');
      const src = card?.dataset.src || getThumbUrl(thumb);
      const title = card?.dataset.name || card?.querySelector('.product-title')?.textContent || '';
      if (src) openLightbox(src, title);
    }
  });

  // load saved images on start
  loadSavedImages();
  initSingleUploader();

});
