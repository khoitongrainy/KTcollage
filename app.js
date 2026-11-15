/**
 * CollageStudio - Aesthetic Multi-Card Story Generator
 * Features Intelligent Orientation Matching (Vertical in vertical frames, Horizontal in horizontal frames).
 */

// Application State
const state = {
  photos: [], // Array of { id, img, dataUrl, name, width, height, aspect, orientation, panX, panY }
  cards: [],  // Array of { id, photoIds: [], slotAssignments: [], layoutId, size }
  activeCardIndex: 0,
  dragState: {
    isDragging: false,
    cardIndex: -1,
    slotIndex: -1,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0
  },
  settings: {
    theme: 'clasico',
    aspectRatio: '9:16',
    gap: 12,
    margin: 20,
    radius: 4,
    bgColor: '#ffffff',
    photosPerCard: 'smart',
    matchOrientation: true,
    fitMode: 'cover', // 'cover' or 'contain'
    showTypography: true,
    kicker: 'adventuring in',
    headline: 'MEMORIES',
    bodyText: 'The past couple of days have been a dream. Cherishing every quiet moment.',
    exportScale: 2
  }
};

// Aesthetic Theme Palettes
const THEMES = {
  clasico: {
    name: 'Clasico',
    bg: '#ffffff',
    textMain: '#111111',
    textMuted: '#666666',
    border: 'rgba(0,0,0,0.06)',
    fontTitle: '"Cormorant Garamond", "Didot", "Playfair Display", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", -apple-system, sans-serif',
    accent: '#111111',
    hasFilmBorder: false,
    hasPaperTexture: false
  },
  paper: {
    name: 'Paper',
    bg: '#f6f2e9',
    textMain: '#2b2620',
    textMuted: '#7c7365',
    border: 'rgba(100,80,50,0.12)',
    fontTitle: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#4a3f35',
    hasFilmBorder: false,
    hasPaperTexture: true
  },
  noir: {
    name: 'Noir Studio',
    bg: '#0f0f12',
    textMain: '#f5f5f7',
    textMuted: '#9e9ea7',
    border: 'rgba(255,255,255,0.12)',
    fontTitle: '"Cormorant Garamond", "Playfair Display", serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#ffffff',
    hasFilmBorder: false,
    hasPaperTexture: false
  },
  film: {
    name: 'Film 35mm',
    bg: '#181818',
    textMain: '#f0ece1',
    textMuted: '#c59b27',
    border: '#2a2a2a',
    fontTitle: '"Space Mono", monospace',
    fontBody: '"Space Mono", monospace',
    accent: '#e69500',
    hasFilmBorder: true,
    hasPaperTexture: false
  },
  warm: {
    name: 'Warm Terra',
    bg: '#eae1d6',
    textMain: '#362b28',
    textMuted: '#75635c',
    border: 'rgba(54,43,40,0.12)',
    fontTitle: '"Playfair Display", serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#8b4513',
    hasFilmBorder: false,
    hasPaperTexture: false
  },
  minimal: {
    name: 'Minimalist',
    bg: '#fcfcfc',
    textMain: '#000000',
    textMuted: '#555555',
    border: 'transparent',
    fontTitle: '"Plus Jakarta Sans", sans-serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#000000',
    hasFilmBorder: false,
    hasPaperTexture: false
  }
};

// Aspect Ratio Dimensions (Internal base rendering resolution: 1080 base)
const DIMENSIONS = {
  '9:16': { width: 1080, height: 1920, previewWidth: 320, previewHeight: 568 },
  '4:5':  { width: 1080, height: 1350, previewWidth: 320, previewHeight: 400 },
  '1:1':  { width: 1080, height: 1080, previewWidth: 340, previewHeight: 340 },
  '16:9': { width: 1920, height: 1080, previewWidth: 500, previewHeight: 281 }
};

/**
 * Editorial Layout Catalog
 * Each layout defines slots [ { x, y, w, h } ] and its intended orientation character:
 * - 'vertical' (for all portrait photos)
 * - 'horizontal' (for all landscape photos)
 * - 'mixed' (mixed horizontal + vertical slots)
 */
const LAYOUT_CATALOG = {
  // 1 Photo layouts
  1: [
    {
      id: '1-vert-hero',
      name: 'Full Hero Portrait',
      type: 'vertical',
      slots: [{ x: 0, y: 0, w: 1, h: 1 }]
    },
    {
      id: '1-horiz-centered',
      name: 'Horizontal Landscape Frame',
      type: 'horizontal',
      slots: [{ x: 0, y: 0.22, w: 1, h: 0.56 }]
    },
    {
      id: '1-polaroid-vert',
      name: 'Polaroid Single',
      type: 'vertical',
      slots: [{ x: 0.08, y: 0.06, w: 0.84, h: 0.74 }],
      hasCaption: true,
      captionBox: { x: 0.08, y: 0.82, w: 0.84, h: 0.14 }
    }
  ],

  // 2 Photos layouts
  2: [
    {
      id: '2-vert-side-by-side',
      name: '2 Vertical Portraits (Side by Side)',
      type: 'vertical',
      slots: [
        { x: 0, y: 0.06, w: 0.49, h: 0.88 },
        { x: 0.51, y: 0.06, w: 0.49, h: 0.88 }
      ]
    },
    {
      id: '2-vert-staggered',
      name: '2 Vertical Portraits (Staggered)',
      type: 'vertical',
      slots: [
        { x: 0.04, y: 0.04, w: 0.52, h: 0.54 },
        { x: 0.44, y: 0.42, w: 0.52, h: 0.54 }
      ]
    },
    {
      id: '2-horiz-split',
      name: '2 Horizontal Landscapes (Split)',
      type: 'horizontal',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.49 },
        { x: 0, y: 0.51, w: 1, h: 0.49 }
      ]
    },
    {
      id: '2-mixed-1h-1v',
      name: 'Top Landscape + Bottom Portrait',
      type: 'mixed',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.40 },          // slot 0: horizontal
        { x: 0.12, y: 0.44, w: 0.76, h: 0.56 }   // slot 1: vertical
      ]
    },
    {
      id: '2-editorial-story',
      name: 'Editorial Article (Screenshot Style)',
      type: 'mixed',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.38 },          // slot 0: landscape
        { x: 0.14, y: 0.65, w: 0.72, h: 0.35 }   // slot 1: vertical portrait
      ],
      hasEditorialText: true,
      textBox: { x: 0.06, y: 0.40, w: 0.88, h: 0.22 }
    }
  ],

  // 3 Photos layouts
  3: [
    {
      id: '3-vert-columns',
      name: '3 Vertical Portraits (Triptych Columns)',
      type: 'vertical',
      slots: [
        { x: 0, y: 0.08, w: 0.315, h: 0.84 },
        { x: 0.342, y: 0.08, w: 0.315, h: 0.84 },
        { x: 0.685, y: 0.08, w: 0.315, h: 0.84 }
      ]
    },
    {
      id: '3-vert-center-hero',
      name: 'Center Portrait Hero + 2 Flank Portraits',
      type: 'vertical',
      slots: [
        { x: 0.23, y: 0.05, w: 0.54, h: 0.90 },  // center large vertical
        { x: 0, y: 0.18, w: 0.21, h: 0.64 },     // left small vertical
        { x: 0.79, y: 0.18, w: 0.21, h: 0.64 }   // right small vertical
      ]
    },
    {
      id: '3-mixed-1h-2v',
      name: '1 Top Landscape + 2 Bottom Portraits',
      type: 'mixed',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.38 },          // slot 0: horizontal
        { x: 0, y: 0.40, w: 0.49, h: 0.60 },    // slot 1: vertical
        { x: 0.51, y: 0.40, w: 0.49, h: 0.60 }  // slot 2: vertical
      ]
    },
    {
      id: '3-mixed-2v-1h',
      name: '2 Top Portraits + 1 Bottom Landscape',
      type: 'mixed',
      slots: [
        { x: 0, y: 0, w: 0.49, h: 0.60 },       // slot 0: vertical
        { x: 0.51, y: 0, w: 0.49, h: 0.60 },     // slot 1: vertical
        { x: 0, y: 0.62, w: 1, h: 0.38 }         // slot 2: horizontal
      ]
    },
    {
      id: '3-horiz-strips',
      name: '3 Stacked Landscapes (Screenshot Style)',
      type: 'horizontal',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.32 },
        { x: 0, y: 0.34, w: 1, h: 0.32 },
        { x: 0, y: 0.68, w: 1, h: 0.32 }
      ]
    }
  ],

  // 4 Photos layouts
  4: [
    {
      id: '4-vert-grid-2x2',
      name: '2x2 Portrait Grid (Vertical Friendly)',
      type: 'vertical',
      slots: [
        { x: 0, y: 0, w: 0.49, h: 0.49 },       // in 9:16, aspect is 0.56 (portrait!)
        { x: 0.51, y: 0, w: 0.49, h: 0.49 },
        { x: 0, y: 0.51, w: 0.49, h: 0.49 },
        { x: 0.51, y: 0.51, w: 0.49, h: 0.49 }
      ]
    },
    {
      id: '4-vert-hero-3-bottom',
      name: 'Hero Portrait + 3 Thumbnails (Screenshot Style)',
      type: 'vertical',
      slots: [
        { x: 0.05, y: 0.04, w: 0.90, h: 0.58 }, // large portrait/square
        { x: 0.03, y: 0.68, w: 0.30, h: 0.28 }, // 3 portrait thumbnails
        { x: 0.35, y: 0.68, w: 0.30, h: 0.28 },
        { x: 0.67, y: 0.68, w: 0.30, h: 0.28 }
      ]
    },
    {
      id: '4-vert-columns',
      name: '4 Vertical Strip Portraits',
      type: 'vertical',
      slots: [
        { x: 0, y: 0.08, w: 0.235, h: 0.84 },
        { x: 0.255, y: 0.08, w: 0.235, h: 0.84 },
        { x: 0.51, y: 0.08, w: 0.235, h: 0.84 },
        { x: 0.765, y: 0.08, w: 0.235, h: 0.84 }
      ]
    },
    {
      id: '4-mixed-1h-3v',
      name: 'Top Landscape + 3 Portrait Columns',
      type: 'mixed',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.40 },          // slot 0: horizontal
        { x: 0, y: 0.43, w: 0.315, h: 0.57 },   // slots 1-3: vertical
        { x: 0.342, y: 0.43, w: 0.315, h: 0.57 },
        { x: 0.685, y: 0.43, w: 0.315, h: 0.57 }
      ]
    },
    {
      id: '4-horiz-strips',
      name: '4 Horizontal Strips (Landscapes Only)',
      type: 'horizontal',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.235 },
        { x: 0, y: 0.255, w: 1, h: 0.235 },
        { x: 0, y: 0.51, w: 1, h: 0.235 },
        { x: 0, y: 0.765, w: 1, h: 0.235 }
      ]
    }
  ],

  // 5 Photos layouts
  5: [
    {
      id: '5-mixed-1h-4grid',
      name: 'Hero Top + 4 Grid (Screenshot Top Right)',
      type: 'mixed',
      slots: [
        { x: 0, y: 0, w: 1, h: 0.42 },          // slot 0: horizontal
        { x: 0, y: 0.44, w: 0.49, h: 0.27 },    // slots 1-4: portrait/square
        { x: 0.51, y: 0.44, w: 0.49, h: 0.27 },
        { x: 0, y: 0.73, w: 0.49, h: 0.27 },
        { x: 0.51, y: 0.73, w: 0.49, h: 0.27 }
      ]
    },
    {
      id: '5-vert-mosaic',
      name: '5 Portrait Mosaic (2 Top + 3 Bottom)',
      type: 'vertical',
      slots: [
        { x: 0, y: 0, w: 0.49, h: 0.48 },
        { x: 0.51, y: 0, w: 0.49, h: 0.48 },
        { x: 0, y: 0.51, w: 0.315, h: 0.49 },
        { x: 0.342, y: 0.51, w: 0.315, h: 0.49 },
        { x: 0.685, y: 0.51, w: 0.315, h: 0.49 }
      ]
    }
  ],

  // 6 Photos layouts
  6: [
    {
      id: '6-vert-gallery-2x3',
      name: '2x3 Portrait Gallery',
      type: 'vertical',
      slots: [
        { x: 0, y: 0, w: 0.49, h: 0.32 },
        { x: 0.51, y: 0, w: 0.49, h: 0.32 },
        { x: 0, y: 0.34, w: 0.49, h: 0.32 },
        { x: 0.51, y: 0.34, w: 0.49, h: 0.32 },
        { x: 0, y: 0.68, w: 0.49, h: 0.32 },
        { x: 0.51, y: 0.68, w: 0.49, h: 0.32 }
      ]
    }
  ]
};

// UI Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const thumbnailStrip = document.getElementById('thumbnail-strip');
const photoSummary = document.getElementById('photo-summary');
const photoCountBadge = document.getElementById('photo-count-badge');
const btnClearPhotos = document.getElementById('btn-clear-photos');
const btnLoadSample = document.getElementById('btn-load-sample');
const btnShuffleAll = document.getElementById('btn-shuffle-all');
const btnShuffleCurrent = document.getElementById('btn-shuffle-current');
const btnExportZip = document.getElementById('btn-export-zip');
const btnDownloadCurrent = document.getElementById('btn-download-current');
const btnPrevCard = document.getElementById('btn-prev-card');
const btnNextCard = document.getElementById('btn-next-card');
const cardsDeck = document.getElementById('cards-deck');
const storyStrip = document.getElementById('story-strip');
const cardIndicator = document.getElementById('card-indicator');
const cardsCountInfo = document.getElementById('cards-count-info');

// Theme & Settings
const themeSelector = document.getElementById('theme-selector');
const ratioSelector = document.getElementById('ratio-selector');
const photosPerCardSelect = document.getElementById('photos-per-card');
const toggleOrientationMatch = document.getElementById('toggle-orientation-match');
const selectFitMode = document.getElementById('select-fit-mode');
const sliderGap = document.getElementById('slider-gap');
const valGap = document.getElementById('val-gap');
const sliderMargin = document.getElementById('slider-margin');
const valMargin = document.getElementById('val-margin');
const sliderRadius = document.getElementById('slider-radius');
const valRadius = document.getElementById('val-radius');
const pickerBg = document.getElementById('picker-bg');
const toggleTypography = document.getElementById('toggle-typography');
const typographyControls = document.getElementById('typography-controls');
const inputKicker = document.getElementById('input-kicker');
const inputHeadline = document.getElementById('input-headline');
const inputBody = document.getElementById('input-body');
const exportScaleSelect = document.getElementById('export-scale');
const toastEl = document.getElementById('toast');

/**
 * Initialize event listeners
 */
function init() {
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length) {
      loadFiles(Array.from(files));
    }
  });

  // Buttons
  btnLoadSample.addEventListener('click', loadSamplePhotos);
  btnClearPhotos.addEventListener('click', clearAllPhotos);
  btnShuffleAll.addEventListener('click', shuffleAllLayouts);
  btnShuffleCurrent.addEventListener('click', shuffleCurrentLayout);
  btnDownloadCurrent.addEventListener('click', downloadCurrentCard);
  btnExportZip.addEventListener('click', exportAllCardsZip);

  btnPrevCard.addEventListener('click', () => setActiveCard(state.activeCardIndex - 1));
  btnNextCard.addEventListener('click', () => setActiveCard(state.activeCardIndex + 1));

  // Theme selection
  themeSelector.addEventListener('click', (e) => {
    const pill = e.target.closest('.theme-pill');
    if (!pill) return;
    document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.settings.theme = pill.dataset.theme;
    pickerBg.value = rgbToHex(THEMES[state.settings.theme].bg);
    renderAllCards();
  });

  // Aspect ratio
  ratioSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.ratio-btn');
    if (!btn) return;
    document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.settings.aspectRatio = btn.dataset.ratio;
    // Re-evaluate layouts and slot assignments under new aspect ratio
    recomputeAllCardLayouts();
    renderAllCards();
  });

  // Distribution strategy & Orientation Match
  photosPerCardSelect.addEventListener('change', (e) => {
    state.settings.photosPerCard = e.target.value;
    partitionPhotosIntoCards();
  });

  if (toggleOrientationMatch) {
    toggleOrientationMatch.addEventListener('change', (e) => {
      state.settings.matchOrientation = e.target.checked;
      partitionPhotosIntoCards();
      showToast(e.target.checked ? 'Orientation matching enabled ↕/↔' : 'Orientation matching disabled');
    });
  }

  if (selectFitMode) {
    selectFitMode.addEventListener('change', (e) => {
      state.settings.fitMode = e.target.value;
      renderAllCards();
    });
  }

  // Sliders
  sliderGap.addEventListener('input', (e) => {
    state.settings.gap = parseInt(e.target.value);
    valGap.textContent = state.settings.gap + 'px';
    renderAllCards();
  });

  sliderMargin.addEventListener('input', (e) => {
    state.settings.margin = parseInt(e.target.value);
    valMargin.textContent = state.settings.margin + 'px';
    renderAllCards();
  });

  sliderRadius.addEventListener('input', (e) => {
    state.settings.radius = parseInt(e.target.value);
    valRadius.textContent = state.settings.radius + 'px';
    renderAllCards();
  });

  pickerBg.addEventListener('input', (e) => {
    state.settings.bgColor = e.target.value;
    renderAllCards();
  });

  // Typography toggles & inputs
  toggleTypography.addEventListener('change', (e) => {
    state.settings.showTypography = e.target.checked;
    typographyControls.style.opacity = e.target.checked ? '1' : '0.4';
    typographyControls.style.pointerEvents = e.target.checked ? 'auto' : 'none';
    renderAllCards();
  });

  inputKicker.addEventListener('input', (e) => {
    state.settings.kicker = e.target.value;
    renderAllCards();
  });

  inputHeadline.addEventListener('input', (e) => {
    state.settings.headline = e.target.value;
    renderAllCards();
  });

  inputBody.addEventListener('input', (e) => {
    state.settings.bodyText = e.target.value;
    renderAllCards();
  });

  exportScaleSelect.addEventListener('change', (e) => {
    state.settings.exportScale = parseInt(e.target.value);
  });

  // Global mouse up for pan dragging
  window.addEventListener('mouseup', handleGlobalMouseUp);
  window.addEventListener('mousemove', handleGlobalMouseMove);

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') setActiveCard(state.activeCardIndex - 1);
    if (e.key === 'ArrowRight') setActiveCard(state.activeCardIndex + 1);
  });

  // Start with demo photos
  loadSamplePhotos();
}

/**
 * Handle file input selection
 */
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  if (files.length) {
    loadFiles(files);
  }
}

/**
 * Load array of File objects
 */
async function loadFiles(files) {
  showToast(`Loading ${files.length} photos...`);
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  
  if (imageFiles.length === 0) {
    showToast('Please select valid image files.');
    return;
  }

  const loadedPhotos = await Promise.all(imageFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const aspect = w / h;
          const orientation = aspect < 0.88 ? 'vertical' : (aspect > 1.15 ? 'horizontal' : 'square');

          resolve({
            id: 'photo_' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            dataUrl: event.target.result,
            img: img,
            width: w,
            height: h,
            aspect: aspect,
            orientation: orientation,
            panX: 0,
            panY: 0
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }));

  state.photos.push(...loadedPhotos);
  updateThumbnails();
  partitionPhotosIntoCards();
  showToast(`Added ${loadedPhotos.length} photos (${state.photos.length} total)`);
}

/**
 * Clear all photos
 */
function clearAllPhotos() {
  state.photos = [];
  state.cards = [];
  state.activeCardIndex = 0;
  updateThumbnails();
  renderAllCards();
  showToast('All photos cleared');
}

/**
 * Update Sidebar Thumbnails with Orientation Badges
 */
function updateThumbnails() {
  thumbnailStrip.innerHTML = '';
  if (state.photos.length === 0) {
    photoSummary.style.display = 'none';
    return;
  }

  photoSummary.style.display = 'block';
  const vertCount = state.photos.filter(p => p.orientation === 'vertical').length;
  const horizCount = state.photos.filter(p => p.orientation === 'horizontal').length;
  photoCountBadge.textContent = `${state.photos.length} photos (${vertCount} ↕, ${horizCount} ↔)`;

  state.photos.forEach((photo, idx) => {
    const slot = document.createElement('div');
    slot.className = 'thumb-slot';
    slot.title = `${photo.name} (${photo.width}x${photo.height} - ${photo.orientation})`;
    
    const img = document.createElement('img');
    img.src = photo.dataUrl;

    const badge = document.createElement('span');
    badge.className = `thumb-orientation-badge ${photo.orientation}`;
    badge.textContent = photo.orientation === 'vertical' ? '↕ Vert' : (photo.orientation === 'horizontal' ? '↔ Horiz' : '■ Sq');

    const delBtn = document.createElement('button');
    delBtn.className = 'thumb-del';
    delBtn.innerHTML = '×';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removePhoto(idx);
    };

    slot.appendChild(img);
    slot.appendChild(badge);
    slot.appendChild(delBtn);
    thumbnailStrip.appendChild(slot);
  });
}

function removePhoto(index) {
  state.photos.splice(index, 1);
  updateThumbnails();
  partitionPhotosIntoCards();
}

/**
 * Compute the effective aspect ratio (w/h) of a slot in canvas pixels
 */
function getSlotAspectRatio(slot) {
  const dim = DIMENSIONS[state.settings.aspectRatio];
  const scaleRatio = dim.width / 1080;
  const margin = state.settings.margin * scaleRatio;
  const contentW = dim.width - margin * 2;
  const contentH = dim.height - margin * 2;

  const slotW = slot.w * contentW;
  const slotH = slot.h * contentH;
  return slotW / slotH;
}

/**
 * Orientation Compatibility Scoring Engine
 * Computes optimal matching between M photos and M slots of a candidate layout.
 * Returns { penalty, assignment: [photoIndexForSlot0, photoIndexForSlot1, ...] }
 */
function scoreLayoutMatching(layout, photos) {
  const n = photos.length;
  if (layout.slots.length !== n) return { penalty: Infinity, assignment: [] };

  const slotAspects = layout.slots.map(s => getSlotAspectRatio(s));
  const photoAspects = photos.map(p => p.aspect);

  // Generate all permutations of indices [0..n-1]
  const perms = getPermutations([...Array(n).keys()]);
  let minPenalty = Infinity;
  let bestPerm = perms[0];

  for (const perm of perms) {
    let penalty = 0;
    for (let slotIdx = 0; slotIdx < n; slotIdx++) {
      const pIdx = perm[slotIdx];
      const pAspect = photoAspects[pIdx];
      const sAspect = slotAspects[slotIdx];

      // Difference in log-aspect-ratio
      const logDiff = Math.abs(Math.log(pAspect) - Math.log(sAspect));
      penalty += logDiff * logDiff;

      // Heavy penalty for cross-orientation mismatch (vertical photo forced into horizontal frame or vice versa)
      const pIsVert = pAspect < 0.90;
      const sIsVert = sAspect < 0.90;
      const pIsHoriz = pAspect > 1.15;
      const sIsHoriz = sAspect > 1.15;

      if ((pIsVert && sIsHoriz) || (pIsHoriz && sIsVert)) {
        penalty += 12.0; // severe penalty
      }
    }

    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestPerm = perm;
    }
  }

  return { penalty: minPenalty, assignment: bestPerm };
}

/**
 * Permutations helper (for N <= 6)
 */
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const perms = getPermutations(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
}

/**
 * Find the best layout for a group of photos, prioritizing orientation match!
 */
function selectBestLayoutForPhotos(photos) {
  const n = photos.length;
  const candidates = LAYOUT_CATALOG[n] || LAYOUT_CATALOG[4] || LAYOUT_CATALOG[3];
  if (!candidates || candidates.length === 0) return null;

  let bestLayout = candidates[0];
  let bestScore = Infinity;
  let bestAssignment = [...Array(n).keys()];

  for (const layout of candidates) {
    const { penalty, assignment } = scoreLayoutMatching(layout, photos);
    if (penalty < bestScore) {
      bestScore = penalty;
      bestLayout = layout;
      bestAssignment = assignment;
    }
  }

  return { layout: bestLayout, assignment: bestAssignment, score: bestScore };
}

/**
 * Smart Partitioning of 15-30 Photos into Story Cards
 * Clusters photos by orientation so vertical photos get vertical frames and horizontal photos get horizontal frames.
 */
function partitionPhotosIntoCards() {
  if (state.photos.length === 0) {
    state.cards = [];
    renderAllCards();
    return;
  }

  const allPhotos = [...state.photos];
  const chunks = [];

  if (state.settings.matchOrientation) {
    // Separate by orientation
    const verticals = allPhotos.filter(p => p.orientation === 'vertical');
    const horizontals = allPhotos.filter(p => p.orientation === 'horizontal');
    const squares = allPhotos.filter(p => p.orientation === 'square');

    // Combine squares with smaller pool
    if (verticals.length >= horizontals.length) {
      horizontals.push(...squares);
    } else {
      verticals.push(...squares);
    }

    // 1. First, create mixed cards if both vertical & horizontal are available:
    // e.g. 1 horizontal + 2 vertical (layout: 3-mixed-1h-2v)
    // e.g. 1 horizontal + 4 vertical (layout: 5-mixed-1h-4grid)
    while (horizontals.length >= 1 && verticals.length >= 2 && state.settings.photosPerCard === 'smart') {
      if (horizontals.length >= 1 && verticals.length >= 4) {
        // 1 horizontal + 4 vertical
        const hPhoto = horizontals.shift();
        const vPhotos = verticals.splice(0, 4);
        chunks.push([hPhoto, ...vPhotos]);
      } else {
        // 1 horizontal + 2 vertical
        const hPhoto = horizontals.shift();
        const vPhotos = verticals.splice(0, 2);
        chunks.push([hPhoto, ...vPhotos]);
      }
    }

    // 2. Chunk remaining vertical photos (e.g. 4 into 2x2 portrait grid, 3 into 3 columns, 2 into side-by-side)
    chunkPhotoList(verticals, chunks, state.settings.photosPerCard, [4, 3, 2]);

    // 3. Chunk remaining horizontal photos (e.g. 3 into 3-strips, 2 into split)
    chunkPhotoList(horizontals, chunks, state.settings.photosPerCard, [3, 2, 4]);

  } else {
    // Standard linear chunking
    chunkPhotoList(allPhotos, chunks, state.settings.photosPerCard, [3, 4, 2, 5]);
  }

  // Create cards from chunks
  state.cards = chunks.map((chunkPhotos, cardIndex) => {
    const { layout, assignment } = selectBestLayoutForPhotos(chunkPhotos);
    
    // Ordered photo IDs matching the slots
    const orderedPhotoIds = assignment.map(idx => chunkPhotos[idx].id);

    return {
      id: 'card_' + cardIndex,
      photoIds: orderedPhotoIds,
      layoutId: layout ? layout.id : 'single-hero',
      size: chunkPhotos.length
    };
  });

  if (state.activeCardIndex >= state.cards.length) {
    state.activeCardIndex = Math.max(0, state.cards.length - 1);
  }

  renderAllCards();
}

/**
 * Chunk a single list of photos into appropriate groups
 */
function chunkPhotoList(list, targetChunks, strategy, preferredSizes = [4, 3, 2]) {
  while (list.length > 0) {
    if (list.length <= 5) {
      if (list.length === 1 && targetChunks.length > 0) {
        // Append single photo to last chunk if possible
        const lastChunk = targetChunks[targetChunks.length - 1];
        if (lastChunk.length < 5) {
          lastChunk.push(list.shift());
          break;
        }
      }
      targetChunks.push(list.splice(0, list.length));
      break;
    }

    let size = preferredSizes[0];
    if (strategy !== 'smart') {
      size = parseInt(strategy);
    } else {
      // Pick size that minimizes remainder
      for (const s of preferredSizes) {
        if (list.length % s === 0 || (list.length - s >= 2)) {
          size = s;
          break;
        }
      }
    }

    size = Math.min(size, list.length);
    targetChunks.push(list.splice(0, size));
  }
}

/**
 * Recompute layouts for all cards (e.g. when aspect ratio or orientation toggle changes)
 */
function recomputeAllCardLayouts() {
  state.cards.forEach(card => {
    const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
    if (photos.length > 0) {
      const { layout, assignment } = selectBestLayoutForPhotos(photos);
      if (layout) {
        card.layoutId = layout.id;
        card.photoIds = assignment.map(idx => photos[idx].id);
      }
    }
  });
}

/**
 * Shuffle layouts across all cards (choosing only compatible layouts)
 */
function shuffleAllLayouts() {
  state.cards.forEach(card => {
    const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
    const available = LAYOUT_CATALOG[photos.length] || [];
    if (available.length > 1) {
      // Score all candidate layouts and pick among the top compatible ones
      const scored = available.map(l => ({
        layout: l,
        ...scoreLayoutMatching(l, photos)
      })).filter(s => s.penalty < 25); // reject severe mismatches!

      const pool = scored.length > 0 ? scored : available.map(l => ({ layout: l, ...scoreLayoutMatching(l, photos) }));
      const picked = pool[Math.floor(Math.random() * pool.length)];
      card.layoutId = picked.layout.id;
      card.photoIds = picked.assignment.map(idx => photos[idx].id);
    }
  });
  renderAllCards();
  showToast('Shuffled layouts (respecting frame orientations)!');
}

/**
 * Shuffle current card's layout
 */
function shuffleCurrentLayout() {
  const card = state.cards[state.activeCardIndex];
  if (!card) return;
  const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
  const available = LAYOUT_CATALOG[photos.length] || [];
  
  if (available.length > 1) {
    // Score all available
    const scored = available.map(l => ({
      layout: l,
      ...scoreLayoutMatching(l, photos)
    })).filter(s => s.penalty < 25);

    const pool = scored.length > 0 ? scored : available.map(l => ({ layout: l, ...scoreLayoutMatching(l, photos) }));
    const currentIdx = pool.findIndex(s => s.layout.id === card.layoutId);
    const nextItem = pool[(currentIdx + 1) % pool.length];

    card.layoutId = nextItem.layout.id;
    card.photoIds = nextItem.assignment.map(idx => photos[idx].id);
    renderAllCards();
    showToast(`Layout: ${nextItem.layout.name}`);
  }
}

/**
 * Find layout object by id
 */
function getLayoutById(layoutId, photoCount) {
  const list = LAYOUT_CATALOG[photoCount] || [];
  const found = list.find(l => l.id === layoutId);
  if (found) return found;
  return list[0] || (LAYOUT_CATALOG[3] ? LAYOUT_CATALOG[3][0] : null);
}

/**
 * Render all cards in the center deck and bottom story strip
 */
function renderAllCards() {
  cardsDeck.innerHTML = '';
  storyStrip.innerHTML = '';

  const totalCards = state.cards.length;
  cardsCountInfo.textContent = `${totalCards} ${totalCards === 1 ? 'card' : 'cards'} generated (${state.photos.length} photos)`;
  cardIndicator.textContent = totalCards > 0 ? `Card ${state.activeCardIndex + 1} of ${totalCards}` : '0 of 0';

  if (totalCards === 0) {
    cardsDeck.innerHTML = `
      <div class="empty-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <h4>No photos added yet</h4>
        <p>Drop 15 to 30 photos or click "Demo Photos" in the top bar to preview aesthetic collage templates with orientation matching.</p>
        <button class="btn btn-primary" onclick="loadSamplePhotos()">Load Demo Photos</button>
      </div>
    `;
    return;
  }

  const dim = DIMENSIONS[state.settings.aspectRatio];

  state.cards.forEach((card, idx) => {
    // 1. Deck Card Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `story-card-wrapper ${idx === state.activeCardIndex ? 'active-card' : ''}`;
    wrapper.dataset.index = idx;

    const container = document.createElement('div');
    container.className = 'story-card-container';
    container.style.width = dim.previewWidth + 'px';
    container.style.height = dim.previewHeight + 'px';

    const canvas = document.createElement('canvas');
    canvas.className = 'story-card-canvas';
    canvas.width = dim.width;
    canvas.height = dim.height;
    canvas.style.width = dim.previewWidth + 'px';
    canvas.style.height = dim.previewHeight + 'px';

    // Interactive Drag to Pan listeners
    attachCanvasPanListeners(canvas, idx);

    // Badge
    const badge = document.createElement('div');
    badge.className = 'card-header-badge';
    badge.textContent = `STORY ${idx + 1}`;

    // Add slot / replace icon (+)
    const addBtn = document.createElement('button');
    addBtn.className = 'card-add-slot-btn';
    addBtn.innerHTML = '+';
    addBtn.title = 'Switch layout template';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      cycleCardLayout(idx);
    };

    container.appendChild(canvas);
    container.appendChild(badge);
    container.appendChild(addBtn);

    // Card Action Bar beneath canvas
    const actionsBar = document.createElement('div');
    actionsBar.className = 'card-actions-bar';

    const layout = getLayoutById(card.layoutId, card.photoIds.length);
    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'action-pill-btn';
    layoutBtn.textContent = layout ? layout.name : 'Change Layout';
    layoutBtn.title = 'Click to cycle compatible layouts';
    layoutBtn.onclick = () => cycleCardLayout(idx);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'action-pill-btn';
    exportBtn.innerHTML = 'Export PNG';
    exportBtn.onclick = () => downloadSingleCard(idx);

    actionsBar.appendChild(layoutBtn);
    actionsBar.appendChild(exportBtn);

    wrapper.appendChild(container);
    wrapper.appendChild(actionsBar);

    wrapper.addEventListener('click', () => setActiveCard(idx));
    cardsDeck.appendChild(wrapper);

    // Render Canvas Content
    renderCardToCanvas(card, canvas);

    // 2. Bottom Story Strip Thumbnail
    const stripItem = document.createElement('div');
    stripItem.className = `strip-item ${idx === state.activeCardIndex ? 'active' : ''}`;
    stripItem.dataset.index = idx;

    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = 180;
    stripCanvas.height = 180 * (dim.height / dim.width);
    stripItem.appendChild(stripCanvas);

    const indexBadge = document.createElement('span');
    indexBadge.className = 'strip-index';
    indexBadge.textContent = idx + 1;
    stripItem.appendChild(indexBadge);

    renderCardToCanvas(card, stripCanvas, true);

    stripItem.addEventListener('click', () => setActiveCard(idx));
    storyStrip.appendChild(stripItem);
  });

  scrollToActiveCard();
}

/**
 * Cycle layout for a specific card respecting orientation
 */
function cycleCardLayout(cardIndex) {
  const card = state.cards[cardIndex];
  if (!card) return;
  const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
  const available = LAYOUT_CATALOG[photos.length] || [];
  
  if (available.length > 1) {
    const scored = available.map(l => ({
      layout: l,
      ...scoreLayoutMatching(l, photos)
    })).filter(s => s.penalty < 25);

    const pool = scored.length > 0 ? scored : available.map(l => ({ layout: l, ...scoreLayoutMatching(l, photos) }));
    const currentIdx = pool.findIndex(s => s.layout.id === card.layoutId);
    const nextItem = pool[(currentIdx + 1) % pool.length];

    card.layoutId = nextItem.layout.id;
    card.photoIds = nextItem.assignment.map(idx => photos[idx].id);
    renderAllCards();
  }
}

/**
 * Interactive Drag to Pan within photo slots
 */
function attachCanvasPanListeners(canvas, cardIndex) {
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const card = state.cards[cardIndex];
    if (!card) return;
    const layout = getLayoutById(card.layoutId, card.photoIds.length);
    if (!layout) return;

    // Find which slot was clicked
    const dim = DIMENSIONS[state.settings.aspectRatio];
    const marginNormX = state.settings.margin / dim.width;
    const marginNormY = state.settings.margin / dim.height;
    const contentW = 1 - marginNormX * 2;
    const contentH = 1 - marginNormY * 2;

    const slotIndex = layout.slots.findIndex(s => {
      const sx = marginNormX + s.x * contentW;
      const sy = marginNormY + s.y * contentH;
      const sw = s.w * contentW;
      const sh = s.h * contentH;
      return clickX >= sx && clickX <= sx + sw && clickY >= sy && clickY <= sy + sh;
    });

    if (slotIndex !== -1 && card.photoIds[slotIndex]) {
      const photo = state.photos.find(p => p.id === card.photoIds[slotIndex]);
      if (photo) {
        state.dragState = {
          isDragging: true,
          cardIndex: cardIndex,
          slotIndex: slotIndex,
          startX: e.clientX,
          startY: e.clientY,
          initialPanX: photo.panX || 0,
          initialPanY: photo.panY || 0,
          canvas: canvas
        };
        canvas.classList.add('is-dragging');
        e.preventDefault();
      }
    }
  });
}

function handleGlobalMouseMove(e) {
  if (!state.dragState.isDragging) return;
  const { cardIndex, slotIndex, startX, startY, initialPanX, initialPanY, canvas } = state.dragState;
  const card = state.cards[cardIndex];
  if (!card) return;
  const photo = state.photos.find(p => p.id === card.photoIds[slotIndex]);
  if (!photo) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  // Sensitivity
  const sensitivity = 0.0025;
  photo.panX = Math.max(-0.5, Math.min(0.5, initialPanX - dx * sensitivity));
  photo.panY = Math.max(-0.5, Math.min(0.5, initialPanY - dy * sensitivity));

  renderCardToCanvas(card, canvas);
}

function handleGlobalMouseUp() {
  if (state.dragState.isDragging) {
    if (state.dragState.canvas) {
      state.dragState.canvas.classList.remove('is-dragging');
    }
    state.dragState.isDragging = false;
  }
}

/**
 * Set active card and update indicators
 */
function setActiveCard(index) {
  if (index < 0 || index >= state.cards.length) return;
  state.activeCardIndex = index;
  
  cardIndicator.textContent = `Card ${state.activeCardIndex + 1} of ${state.cards.length}`;

  document.querySelectorAll('.story-card-wrapper').forEach((el, i) => {
    el.classList.toggle('active-card', i === index);
  });

  document.querySelectorAll('.strip-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  scrollToActiveCard();
}

function scrollToActiveCard() {
  const activeWrapper = document.querySelectorAll('.story-card-wrapper')[state.activeCardIndex];
  if (activeWrapper) {
    activeWrapper.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

/**
 * Canvas Rendering Core Engine
 */
function renderCardToCanvas(card, canvas, isThumbnail = false) {
  const ctx = canvas.getContext('2d');
  const cw = canvas.width;
  const ch = canvas.height;
  const theme = THEMES[state.settings.theme] || THEMES.clasico;
  const layout = getLayoutById(card.layoutId, card.photoIds.length);
  if (!layout) return;

  // Background
  const customBg = state.settings.bgColor || theme.bg;
  ctx.fillStyle = customBg;
  ctx.fillRect(0, 0, cw, ch);

  // Paper texture simulation
  if (theme.hasPaperTexture && !isThumbnail) {
    drawPaperTexture(ctx, cw, ch);
  }

  // Film borders
  if (theme.hasFilmBorder) {
    drawFilmDetails(ctx, cw, ch, card);
  }

  // Margins & Dimensions
  const scaleRatio = cw / 1080;
  const margin = state.settings.margin * scaleRatio;
  const gap = state.settings.gap * scaleRatio;
  const radius = state.settings.radius * scaleRatio;

  const contentX = margin;
  const contentY = margin;
  const contentW = cw - margin * 2;
  const contentH = ch - margin * 2;

  // Photos
  const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);

  // Render photo slots
  layout.slots.forEach((slot, slotIdx) => {
    const photo = photos[slotIdx];
    if (!photo) return;

    const sx = contentX + slot.x * contentW;
    const sy = contentY + slot.y * contentH;
    const sw = slot.w * contentW - (slot.w < 1 ? gap / 2 : 0);
    const sh = slot.h * contentH - (slot.h < 1 ? gap / 2 : 0);

    ctx.save();

    if (radius > 0) {
      roundedRectPath(ctx, sx, sy, sw, sh, radius);
      ctx.clip();
    }

    if (state.settings.fitMode === 'contain') {
      // Contain mode (no crop, letterboxed within slot)
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(sx, sy, sw, sh);
      drawImageContain(ctx, photo.img, sx, sy, sw, sh);
    } else {
      // Cover mode with interactive pan
      drawImageCoverWithPan(ctx, photo, sx, sy, sw, sh);
    }

    ctx.restore();

    // Border
    if (theme.border && theme.border !== 'transparent') {
      ctx.save();
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = Math.max(1, 1.5 * scaleRatio);
      if (radius > 0) {
        roundedRectPath(ctx, sx, sy, sw, sh, radius);
        ctx.stroke();
      } else {
        ctx.strokeRect(sx, sy, sw, sh);
      }
      ctx.restore();
    }
  });

  // Editorial Typography
  if (state.settings.showTypography && layout.hasEditorialText && layout.textBox) {
    const tb = layout.textBox;
    const tx = contentX + tb.x * contentW;
    const ty = contentY + tb.y * contentH;
    const tw = tb.w * contentW;
    const th = tb.h * contentH;

    drawEditorialTypography(ctx, tx, ty, tw, th, theme, scaleRatio);
  }
}

/**
 * Draw Editorial Typography
 */
function drawEditorialTypography(ctx, x, y, w, h, theme, scaleRatio) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.textMain;

  const centerX = x + w / 2;
  let currentY = y + 24 * scaleRatio;

  if (state.settings.kicker) {
    ctx.font = `italic ${Math.round(22 * scaleRatio)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(state.settings.kicker, centerX, currentY);
    currentY += 34 * scaleRatio;
  }

  if (state.settings.headline) {
    ctx.font = `bold ${Math.round(44 * scaleRatio)}px "Cormorant Garamond", "Playfair Display", Georgia, serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText(state.settings.headline.toUpperCase(), centerX, currentY);
    currentY += 38 * scaleRatio;
  }

  if (state.settings.bodyText) {
    ctx.font = `${Math.round(18 * scaleRatio)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.fillStyle = theme.textMuted;
    const maxWidth = w * 0.92;
    const lineHeight = 28 * scaleRatio;
    wrapText(ctx, state.settings.bodyText, centerX, currentY, maxWidth, lineHeight, 3);
  }

  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(' ');
  let line = '';
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines - 1 && n < words.length - 1) {
        ctx.fillText((line + words.slice(n + 1).join(' ')).slice(0, 45) + '...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

/**
 * Draw Image Cover with Pan Offset
 */
function drawImageCoverWithPan(ctx, photo, dx, dy, dw, dh) {
  const img = photo.img;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const imgRatio = imgW / imgH;
  const targetRatio = dw / dh;

  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    // Image is wider than target frame: pan horizontally
    sh = imgH;
    sw = imgH * targetRatio;
    const maxShiftX = imgW - sw;
    const panOffset = (photo.panX || 0) * maxShiftX;
    sx = Math.max(0, Math.min(maxShiftX, (maxShiftX / 2) + panOffset));
    sy = 0;
  } else {
    // Image is taller than target frame: pan vertically
    sw = imgW;
    sh = imgW / targetRatio;
    const maxShiftY = imgH - sh;
    const panOffset = (photo.panY || 0) * maxShiftY;
    sx = 0;
    sy = Math.max(0, Math.min(maxShiftY, (maxShiftY / 2) + panOffset));
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Draw Image Contain (no cropping)
 */
function drawImageContain(ctx, img, dx, dy, dw, dh) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = dw / dh;

  let renderW, renderH, renderX, renderY;
  if (imgRatio > targetRatio) {
    renderW = dw;
    renderH = dw / imgRatio;
    renderX = dx;
    renderY = dy + (dh - renderH) / 2;
  } else {
    renderH = dh;
    renderW = dh * imgRatio;
    renderX = dx + (dw - renderW) / 2;
    renderY = dy;
  }

  ctx.drawImage(img, renderX, renderY, renderW, renderH);
}

function roundedRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPaperTexture(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(180, 150, 100, 0.035)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const rw = Math.random() * 4;
    const rh = Math.random() * 4;
    ctx.fillRect(rx, ry, rw, rh);
  }
  ctx.restore();
}

function drawFilmDetails(ctx, w, h, card) {
  ctx.save();
  ctx.fillStyle = '#e69500';
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('PORTRA 400 • ' + (card.id.toUpperCase()), 30, h - 20);
  ctx.fillText(new Date().toISOString().slice(0, 10), w - 160, h - 20);
  ctx.restore();
}

/**
 * Download Single Card as PNG
 */
function downloadSingleCard(cardIndex) {
  const card = state.cards[cardIndex];
  if (!card) return;

  const baseDim = DIMENSIONS[state.settings.aspectRatio];
  const scale = state.settings.exportScale || 2;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = baseDim.width * scale;
  exportCanvas.height = baseDim.height * scale;

  renderCardToCanvas(card, exportCanvas);

  const link = document.createElement('a');
  link.download = `story-card-${cardIndex + 1}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();

  showToast(`Exported Story Card ${cardIndex + 1} (${exportCanvas.width}x${exportCanvas.height}px)`);
}

function downloadCurrentCard() {
  downloadSingleCard(state.activeCardIndex);
}

/**
 * Export All Cards as ZIP
 */
async function exportAllCardsZip() {
  if (state.cards.length === 0) {
    showToast('No cards to export!');
    return;
  }

  showToast(`Generating ZIP for ${state.cards.length} cards...`);

  const zip = new JSZip();
  const baseDim = DIMENSIONS[state.settings.aspectRatio];
  const scale = state.settings.exportScale || 2;

  for (let i = 0; i < state.cards.length; i++) {
    const card = state.cards[i];
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseDim.width * scale;
    exportCanvas.height = baseDim.height * scale;

    renderCardToCanvas(card, exportCanvas);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    zip.file(`story-card-${String(i + 1).padStart(2, '0')}.png`, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `CollageStudio-Stories-${new Date().toISOString().slice(0, 10)}.zip`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
  showToast('ZIP download ready!');
}

/**
 * Generate Demo Photos:
 * Includes a distinct mix of vertical portraits (Dad, Mom, Boy 1, Boy 2 like user's photo!)
 * and scenic horizontal landscapes, demonstrating automatic orientation matching!
 */
function loadSamplePhotos() {
  showToast('Generating demo photos with vertical portraits & horizontal landscapes...');
  
  const sampleDefinitions = [
    // 4 Vertical Family Portraits (similar to user's photo)
    { name: 'Dad Portrait', w: 800, h: 1200, g1: '#4a3b32', g2: '#8b6b4f', isPortrait: true, tag: 'Dad' },
    { name: 'Mom Portrait', w: 800, h: 1200, g1: '#543d3b', g2: '#9a7065', isPortrait: true, tag: 'Mom' },
    { name: 'Son 1 Portrait', w: 800, h: 1200, g1: '#5a6245', g2: '#a4ab80', isPortrait: true, tag: 'Son 1' },
    { name: 'Son 2 Portrait', w: 800, h: 1200, g1: '#634b35', g2: '#ba946e', isPortrait: true, tag: 'Son 2' },
    
    // Horizontal Landscapes
    { name: 'White Picket Fence', w: 1400, h: 800, g1: '#2b3a42', g2: '#4f6d7a', isLandscape: true, tag: 'Fence' },
    { name: 'Autumn Street & Speed 25', w: 1400, h: 800, g1: '#633d2e', g2: '#a86544', isLandscape: true, tag: 'Street' },
    { name: 'Irish Coastline', w: 1400, h: 800, g1: '#37474f', g2: '#78909c', isLandscape: true, tag: 'Coast' },
    { name: 'Alpine Ridge', w: 1400, h: 800, g1: '#263238', g2: '#546e7a', isLandscape: true, tag: 'Mountain' },
    
    // More Vertical Portraits
    { name: 'Solo Laughing Portrait', w: 800, h: 1200, g1: '#423838', g2: '#8d7575', isPortrait: true, tag: 'Solo' },
    { name: 'Candid Walk Portrait', w: 800, h: 1200, g1: '#3e4147', g2: '#7a818c', isPortrait: true, tag: 'Walk' },
    { name: 'Brothers Together', w: 800, h: 1200, g1: '#473d31', g2: '#968168', isPortrait: true, tag: 'Brothers' },
    { name: 'Front Porch Smile', w: 800, h: 1200, g1: '#324b42', g2: '#689686', isPortrait: true, tag: 'Porch' },

    // More Horizontal Landscapes & Scenes
    { name: 'Sunset Meadow', w: 1400, h: 800, g1: '#e58045', g2: '#eed19a', isLandscape: true, tag: 'Meadow' },
    { name: 'City Park Path', w: 1400, h: 800, g1: '#134e5e', g2: '#71b280', isLandscape: true, tag: 'Park' },
    { name: 'Lakeside Dock', w: 1400, h: 800, g1: '#203a43', g2: '#2c5364', isLandscape: true, tag: 'Lake' },
    { name: 'Winter Pines', w: 1400, h: 800, g1: '#2c3e50', g2: '#bdc3c7', isLandscape: true, tag: 'Pines' }
  ];

  const generated = sampleDefinitions.map((item, idx) => {
    const c = document.createElement('canvas');
    c.width = item.w;
    c.height = item.h;
    const ctx = c.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, item.h);
    grad.addColorStop(0, item.g1);
    grad.addColorStop(1, item.g2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, item.w, item.h);

    if (item.isPortrait) {
      // Silhouette / portrait avatar
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(item.w / 2, item.h * 0.35, item.w * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(item.w / 2, item.h * 0.75, item.w * 0.38, item.h * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Portrait badge
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.tag, item.w / 2, item.h * 0.4);
    } else {
      // Landscape horizon & hills
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(0, item.h * 0.6);
      ctx.lineTo(item.w * 0.35, item.h * 0.42);
      ctx.lineTo(item.w * 0.7, item.h * 0.58);
      ctx.lineTo(item.w, item.h * 0.45);
      ctx.lineTo(item.w, item.h);
      ctx.lineTo(0, item.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.tag, item.w / 2, item.h * 0.5);
    }

    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    const img = new Image();
    img.src = dataUrl;

    const aspect = item.w / item.h;
    return {
      id: 'photo_' + idx,
      name: item.name,
      dataUrl: dataUrl,
      img: img,
      width: item.w,
      height: item.h,
      aspect: aspect,
      orientation: aspect < 0.88 ? 'vertical' : (aspect > 1.15 ? 'horizontal' : 'square'),
      panX: 0,
      panY: 0
    };
  });

  state.photos = generated;
  updateThumbnails();
  partitionPhotosIntoCards();
  showToast('Loaded demo photos! Vertical portraits automatically placed in vertical frames.');
}

let toastTimeout;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2800);
}

function rgbToHex(color) {
  if (color && color.startsWith('#')) return color;
  return '#ffffff';
}

document.addEventListener('DOMContentLoaded', init);
