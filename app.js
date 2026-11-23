/**
 * KT Collage — Editorial Story & Collage Generator
 * Complete Unfold / Classico template collection, cross-card drag-and-drop, and per-photo zoom.
 */

// Application State
const state = {
  photos: [], // Array of { id, img, dataUrl, name, width, height, aspect, orientation }
  cards: [],  // Array of { id, photoIds: [], layoutId, slotTransforms: [{ zoom, panX, panY }] }
  activeCardIndex: 0,
  selectedSlot: null, // { cardIndex, slotIndex }
  dragState: {
    active: false,
    mode: null, // 'pan' or 'swap'
    fromCardIndex: -1,
    fromSlotIndex: -1,
    fromPhotoId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hoverCardIndex: -1,
    hoverSlotIndex: -1,
    initialPanX: 0,
    initialPanY: 0
  },
  settings: {
    theme: 'clasico',
    aspectRatio: '9:16',
    customWidth: 1080,
    customHeight: 1440,
    ratioFilter: 'all',
    collection: 'auto',
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
    dateLine: '',
    exportScale: 2
  }
};

// Theme Palettes
const THEMES = {
  clasico: {
    name: 'Clasico',
    bg: '#ffffff',
    textMain: '#111111',
    textMuted: '#666666',
    border: 'rgba(0,0,0,0.06)',
    fontTitle: '"Cormorant Garamond", "Didot", "Playfair Display", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", -apple-system, sans-serif',
    accent: '#111111'
  },
  paper: {
    name: 'Paper',
    bg: '#f6f2e9',
    textMain: '#2b2620',
    textMuted: '#7c7365',
    border: 'rgba(100,80,50,0.14)',
    fontTitle: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#4a3f35',
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
    accent: '#ffffff'
  },
  film: {
    name: 'Film 35mm',
    bg: '#161616',
    textMain: '#f0ece1',
    textMuted: '#c59b27',
    border: '#2a2a2a',
    fontTitle: '"Space Mono", monospace',
    fontBody: '"Space Mono", monospace',
    accent: '#e69500',
    hasFilmBorder: true
  },
  warm: {
    name: 'Warm Terra',
    bg: '#eae1d6',
    textMain: '#362b28',
    textMuted: '#75635c',
    border: 'rgba(54,43,40,0.12)',
    fontTitle: '"Playfair Display", serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#8b4513'
  },
  minimal: {
    name: 'Minimalist',
    bg: '#fcfcfc',
    textMain: '#000000',
    textMuted: '#555555',
    border: 'transparent',
    fontTitle: '"Plus Jakarta Sans", sans-serif',
    fontBody: '"Plus Jakarta Sans", sans-serif',
    accent: '#000000'
  }
};

// Rich Aspect Ratio & Size Presets (Portrait, Square, Landscape, Print, Custom)
const RATIO_PRESETS = [
  // Portrait
  { id: '9:16',     label: '9:16',    sub: 'Story',    width: 1080, height: 1920, cats: ['portrait'],          flip: '16:9' },
  { id: '4:5',      label: '4:5',     sub: 'IG Post',  width: 1080, height: 1350, cats: ['portrait'],          flip: '5:4'  },
  { id: '3:4',      label: '3:4',     sub: 'Portrait', width: 1080, height: 1440, cats: ['portrait'],          flip: '4:3'  },
  { id: '2:3',      label: '2:3',     sub: '4×6" Photo',width: 1080, height: 1620, cats: ['portrait', 'print'], flip: '3:2'  },
  // Square & Landscape popular
  { id: '1:1',      label: '1:1',     sub: 'Square',   width: 1080, height: 1080, cats: ['portrait', 'landscape'], flip: '1:1' },
  { id: '4:3',      label: '4:3',     sub: 'Classic',  width: 1440, height: 1080, cats: ['landscape'],         flip: '3:4'  },
  { id: '3:2',      label: '3:2',     sub: 'DSLR 6×4', width: 1620, height: 1080, cats: ['landscape', 'print'],flip: '2:3'  },
  { id: '16:9',     label: '16:9',    sub: 'HD / YT',  width: 1920, height: 1080, cats: ['landscape'],         flip: '9:16' },
  // More Portrait / Print / Cinematic
  { id: '5:7',      label: '5:7',     sub: '5×7" Print',width: 1080, height: 1512, cats: ['portrait', 'print'], flip: '7:5'  },
  { id: '7:5',      label: '7:5',     sub: '7×5" Print',width: 1512, height: 1080, cats: ['landscape', 'print'],flip: '5:7'  },
  { id: '5:4',      label: '5:4',     sub: '10×8"',    width: 1350, height: 1080, cats: ['landscape', 'print'],flip: '4:5'  },
  { id: '21:9',     label: '21:9',    sub: 'Cinema',   width: 2520, height: 1080, cats: ['landscape'],         flip: '9:21' },
  { id: '9:21',     label: '9:21',    sub: 'Tall',     width: 1080, height: 2520, cats: ['portrait'],          flip: '21:9' },
  { id: 'A4-P',     label: 'A4 ↕',    sub: 'Print ↕',  width: 1240, height: 1754, cats: ['portrait', 'print'], flip: 'A4-L' },
  { id: 'A4-L',     label: 'A4 ↔',    sub: 'Print ↔',  width: 1754, height: 1240, cats: ['landscape', 'print'],flip: 'A4-P' },
  { id: 'FB-Cover', label: 'Cover',   sub: 'Banner',   width: 1640, height: 624,  cats: ['landscape'],         flip: 'custom' }
];

const DIMENSIONS = Object.fromEntries(RATIO_PRESETS.map(p => [p.id, p]));

/**
 * Compute active canvas & preview dimensions for any preset or custom WxH
 */
function getActiveDimensions() {
  let width, height, label;
  if (state.settings.aspectRatio === 'custom') {
    width = Math.max(300, Math.min(6000, parseInt(state.settings.customWidth) || 1080));
    height = Math.max(300, Math.min(6000, parseInt(state.settings.customHeight) || 1440));
    label = `Custom (${width}×${height})`;
  } else {
    const preset = DIMENSIONS[state.settings.aspectRatio] || DIMENSIONS['9:16'];
    width = preset.width;
    height = preset.height;
    label = preset.label;
  }

  // Compute balanced preview box that fits neatly in the center deck
  const ratio = width / height;
  const maxW = 520;
  const maxH = 540;
  const targetArea = 350 * 490;
  let pw = Math.sqrt(targetArea * ratio);
  let ph = pw / ratio;
  if (pw > maxW) {
    pw = maxW;
    ph = pw / ratio;
  }
  if (ph > maxH) {
    ph = maxH;
    pw = ph * ratio;
  }

  return {
    width,
    height,
    label,
    previewWidth: Math.max(140, Math.round(pw)),
    previewHeight: Math.max(140, Math.round(ph))
  };
}

function getScaleRatio(cw, ch) {
  return Math.min(cw, ch) / 1080;
}

function simplifyRatio(w, h) {
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(Math.round(w), Math.round(h)) || 1;
  const rw = Math.round(w / d);
  const rh = Math.round(h / d);
  if (rw <= 32 && rh <= 32) return `${rw}:${rh}`;
  return `${(w / h).toFixed(2)}:1`;
}

/**
 * Comprehensive Unfold & Classico Template Catalog
 * Organized by Photo Count (1–6) with collections: Classico, Editorial, Film, Polaroid, Minimal
 */
const TEMPLATE_CATALOG = [
  // ---------- 1 PHOTO ----------
  {
    id: 'cs-01-hero',
    name: 'CS1 Full Hero',
    collection: 'Classico',
    count: 1,
    type: 'vertical',
    slots: [{ x: 0, y: 0, w: 1, h: 1 }]
  },
  {
    id: 'cs-01-framed',
    name: 'CS1 Museum Frame',
    collection: 'Classico',
    count: 1,
    type: 'vertical',
    slots: [{ x: 0.08, y: 0.06, w: 0.84, h: 0.78 }],
    hasEditorialText: true,
    textBox: { x: 0.08, y: 0.86, w: 0.84, h: 0.10 }
  },
  {
    id: 'cs-01-polaroid',
    name: 'Polaroid Classic',
    collection: 'Polaroid',
    count: 1,
    type: 'vertical',
    isPolaroid: true,
    slots: [{ x: 0.08, y: 0.08, w: 0.84, h: 0.70 }],
    hasEditorialText: true,
    textBox: { x: 0.08, y: 0.81, w: 0.84, h: 0.13 }
  },
  {
    id: 'fl-01-contact',
    name: 'Film 35mm Single',
    collection: 'Film',
    count: 1,
    type: 'vertical',
    isFilm: true,
    slots: [{ x: 0.08, y: 0.10, w: 0.84, h: 0.80 }]
  },

  // ---------- 2 PHOTOS ----------
  {
    id: 'cs-02-side-by-side',
    name: 'CS2 Twin Vertical (Side-by-Side)',
    collection: 'Classico',
    count: 2,
    type: 'vertical',
    slots: [
      { x: 0, y: 0.06, w: 0.49, h: 0.88 },
      { x: 0.51, y: 0.06, w: 0.49, h: 0.88 }
    ]
  },
  {
    id: 'cs-02-split-horizontal',
    name: 'CS2 Dual Landscape (Split)',
    collection: 'Classico',
    count: 2,
    type: 'horizontal',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.49 },
      { x: 0, y: 0.51, w: 1, h: 0.49 }
    ]
  },
  {
    id: 'cs-02-editorial-story',
    name: 'CS2 Editorial Article (Screenshot Style)',
    collection: 'Editorial',
    count: 2,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.38 },          // horizontal landscape
      { x: 0.14, y: 0.65, w: 0.72, h: 0.35 }   // vertical portrait
    ],
    hasEditorialText: true,
    textBox: { x: 0.06, y: 0.40, w: 0.88, h: 0.23 }
  },
  {
    id: 'cs-02-staggered',
    name: 'CS2 Staggered Diptych',
    collection: 'Classico',
    count: 2,
    type: 'vertical',
    slots: [
      { x: 0.04, y: 0.04, w: 0.54, h: 0.54 },
      { x: 0.42, y: 0.42, w: 0.54, h: 0.54 }
    ]
  },
  {
    id: 'pl-02-duo',
    name: 'Polaroid Duo',
    collection: 'Polaroid',
    count: 2,
    type: 'vertical',
    isPolaroid: true,
    slots: [
      { x: 0.10, y: 0.05, w: 0.80, h: 0.42 },
      { x: 0.10, y: 0.52, w: 0.80, h: 0.42 }
    ]
  },

  // ---------- 3 PHOTOS ----------
  {
    id: 'cs-03-horizontal-strips',
    name: 'CS3 3 Horizontal Strips (Screenshot Style)',
    collection: 'Classico',
    count: 3,
    type: 'horizontal',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.32 },
      { x: 0, y: 0.34, w: 1, h: 0.32 },
      { x: 0, y: 0.68, w: 1, h: 0.32 }
    ]
  },
  {
    id: 'cs-03-columns',
    name: 'CS3 3 Vertical Columns (Triptych)',
    collection: 'Classico',
    count: 3,
    type: 'vertical',
    slots: [
      { x: 0, y: 0.06, w: 0.315, h: 0.88 },
      { x: 0.342, y: 0.06, w: 0.315, h: 0.88 },
      { x: 0.685, y: 0.06, w: 0.315, h: 0.88 }
    ]
  },
  {
    id: 'cs-03-mixed-top-hero',
    name: 'CS3 1 Top Landscape + 2 Portraits',
    collection: 'Classico',
    count: 3,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.40 },
      { x: 0, y: 0.42, w: 0.49, h: 0.58 },
      { x: 0.51, y: 0.42, w: 0.49, h: 0.58 }
    ]
  },
  {
    id: 'cs-03-mixed-bottom-hero',
    name: 'CS3 2 Portraits + 1 Bottom Landscape',
    collection: 'Classico',
    count: 3,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 0.49, h: 0.58 },
      { x: 0.51, y: 0, w: 0.49, h: 0.58 },
      { x: 0, y: 0.60, w: 1, h: 0.40 }
    ]
  },
  {
    id: 'ed-03-flank',
    name: 'Editorial Center Hero + 2 Flanks',
    collection: 'Editorial',
    count: 3,
    type: 'vertical',
    slots: [
      { x: 0.22, y: 0.04, w: 0.56, h: 0.92 },
      { x: 0, y: 0.16, w: 0.20, h: 0.68 },
      { x: 0.80, y: 0.16, w: 0.20, h: 0.68 }
    ]
  },
  {
    id: 'fl-03-strips',
    name: 'Film 3-Frame Strip',
    collection: 'Film',
    count: 3,
    type: 'horizontal',
    isFilm: true,
    slots: [
      { x: 0.06, y: 0.05, w: 0.88, h: 0.28 },
      { x: 0.06, y: 0.36, w: 0.88, h: 0.28 },
      { x: 0.06, y: 0.67, w: 0.88, h: 0.28 }
    ]
  },

  // ---------- 4 PHOTOS ----------
  {
    id: 'cs-04-grid-2x2',
    name: 'CS4 2x2 Balanced Portrait Grid',
    collection: 'Classico',
    count: 4,
    type: 'vertical',
    slots: [
      { x: 0, y: 0, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0, w: 0.49, h: 0.49 },
      { x: 0, y: 0.51, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0.51, w: 0.49, h: 0.49 }
    ]
  },
  {
    id: 'cs-04-hero-3-bottom',
    name: 'CS4 Hero + 3 Thumbnails (Screenshot Style)',
    collection: 'Classico',
    count: 4,
    type: 'vertical',
    slots: [
      { x: 0.05, y: 0.03, w: 0.90, h: 0.58 },
      { x: 0.03, y: 0.67, w: 0.30, h: 0.30 },
      { x: 0.35, y: 0.67, w: 0.30, h: 0.30 },
      { x: 0.67, y: 0.67, w: 0.30, h: 0.30 }
    ]
  },
  {
    id: 'cs-04-mixed-1h-3v',
    name: 'CS4 Top Landscape + 3 Columns',
    collection: 'Classico',
    count: 4,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.40 },
      { x: 0, y: 0.42, w: 0.315, h: 0.58 },
      { x: 0.342, y: 0.42, w: 0.315, h: 0.58 },
      { x: 0.685, y: 0.42, w: 0.315, h: 0.58 }
    ]
  },
  {
    id: 'cs-04-columns',
    name: 'CS4 4 Vertical Columns',
    collection: 'Classico',
    count: 4,
    type: 'vertical',
    slots: [
      { x: 0, y: 0.06, w: 0.235, h: 0.88 },
      { x: 0.255, y: 0.06, w: 0.235, h: 0.88 },
      { x: 0.51, y: 0.06, w: 0.235, h: 0.88 },
      { x: 0.765, y: 0.06, w: 0.235, h: 0.88 }
    ]
  },
  {
    id: 'cs-04-horizontal-strips',
    name: 'CS4 4 Horizontal Strips (Landscapes)',
    collection: 'Classico',
    count: 4,
    type: 'horizontal',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.235 },
      { x: 0, y: 0.255, w: 1, h: 0.235 },
      { x: 0, y: 0.51, w: 1, h: 0.235 },
      { x: 0, y: 0.765, w: 1, h: 0.235 }
    ]
  },
  {
    id: 'ed-04-asymmetric',
    name: 'Editorial 1 Large + 3 Stacked Column',
    collection: 'Editorial',
    count: 4,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.60, y: 0, w: 0.40, h: 0.32 },
      { x: 0.60, y: 0.34, w: 0.40, h: 0.32 },
      { x: 0.60, y: 0.68, w: 0.40, h: 0.32 }
    ]
  },

  // ---------- 5 PHOTOS ----------
  {
    id: 'cs-05-hero-4grid',
    name: 'CS5 Hero Top + 4 Grid (Screenshot Top Right)',
    collection: 'Classico',
    count: 5,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.42 },
      { x: 0, y: 0.44, w: 0.49, h: 0.27 },
      { x: 0.51, y: 0.44, w: 0.49, h: 0.27 },
      { x: 0, y: 0.73, w: 0.49, h: 0.27 },
      { x: 0.51, y: 0.73, w: 0.49, h: 0.27 }
    ]
  },
  {
    id: 'cs-05-mosaic',
    name: 'CS5 2 Top + 3 Bottom Mosaic',
    collection: 'Classico',
    count: 5,
    type: 'vertical',
    slots: [
      { x: 0, y: 0, w: 0.49, h: 0.48 },
      { x: 0.51, y: 0, w: 0.49, h: 0.48 },
      { x: 0, y: 0.51, w: 0.315, h: 0.49 },
      { x: 0.342, y: 0.51, w: 0.315, h: 0.49 },
      { x: 0.685, y: 0.51, w: 0.315, h: 0.49 }
    ]
  },
  {
    id: 'ed-05-magazine',
    name: 'Editorial 5 Spread',
    collection: 'Editorial',
    count: 5,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 0.49, h: 0.60 },
      { x: 0.51, y: 0, w: 0.49, h: 0.30 },
      { x: 0.51, y: 0.32, w: 0.49, h: 0.28 },
      { x: 0, y: 0.62, w: 0.49, h: 0.38 },
      { x: 0.51, y: 0.62, w: 0.49, h: 0.38 }
    ]
  },

  // ---------- 6 PHOTOS ----------
  {
    id: 'cs-06-gallery',
    name: 'CS6 2x3 Portrait Gallery',
    collection: 'Classico',
    count: 6,
    type: 'vertical',
    slots: [
      { x: 0, y: 0, w: 0.49, h: 0.32 },
      { x: 0.51, y: 0, w: 0.49, h: 0.32 },
      { x: 0, y: 0.34, w: 0.49, h: 0.32 },
      { x: 0.51, y: 0.34, w: 0.49, h: 0.32 },
      { x: 0, y: 0.68, w: 0.49, h: 0.32 },
      { x: 0.51, y: 0.68, w: 0.49, h: 0.32 }
    ]
  },
  {
    id: 'mn-06-grid',
    name: 'Minimal 3x2 Grid',
    collection: 'Minimal',
    count: 6,
    type: 'mixed',
    slots: [
      { x: 0, y: 0, w: 0.32, h: 0.49 },
      { x: 0.34, y: 0, w: 0.32, h: 0.49 },
      { x: 0.68, y: 0, w: 0.32, h: 0.49 },
      { x: 0, y: 0.51, w: 0.32, h: 0.49 },
      { x: 0.34, y: 0.51, w: 0.32, h: 0.49 },
      { x: 0.68, y: 0.51, w: 0.32, h: 0.49 }
    ]
  }
];

// UI Element references
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const thumbnailStrip = document.getElementById('thumbnail-strip');
const photoSummary = document.getElementById('photo-summary');
const photoCountBadge = document.getElementById('photo-count-badge');
const btnClearPhotos = document.getElementById('btn-clear-photos');
const btnLoadSample = document.getElementById('btn-load-sample');
const btnShuffleAll = document.getElementById('btn-shuffle-all');
const btnShuffleCurrent = document.getElementById('btn-shuffle-current');
const btnOpenTemplates = document.getElementById('btn-open-templates');
const btnExportZip = document.getElementById('btn-export-zip');
const btnDownloadCurrent = document.getElementById('btn-download-current');
const btnPrevCard = document.getElementById('btn-prev-card');
const btnNextCard = document.getElementById('btn-next-card');
const cardsDeck = document.getElementById('cards-deck');
const storyStrip = document.getElementById('story-strip');
const cardIndicator = document.getElementById('card-indicator');
const cardsCountInfo = document.getElementById('cards-count-info');

// Zoom controls
const zoomControls = document.getElementById('zoom-controls');
const zoomRange = document.getElementById('zoom-range');
const zoomValue = document.getElementById('zoom-value');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');

// Settings
const selectCollection = document.getElementById('select-collection');
const themeSelector = document.getElementById('theme-selector');
const ratioSelector = document.getElementById('ratio-selector');
const ratioFilterTabs = document.getElementById('ratio-filter-tabs');
const btnFlipRatio = document.getElementById('btn-flip-ratio');
const activeDimBadge = document.getElementById('active-dim-badge');
const customSizeBox = document.getElementById('custom-size-box');
const inputCustomW = document.getElementById('input-custom-w');
const inputCustomH = document.getElementById('input-custom-h');
const customRatioInfo = document.getElementById('custom-ratio-info');
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
const inputDate = document.getElementById('input-date');
const exportScaleSelect = document.getElementById('export-scale');
const toastEl = document.getElementById('toast');

// Modal Elements
const templateModal = document.getElementById('template-modal');
const tmClose = document.getElementById('tm-close');
const tmDone = document.getElementById('tm-done');
const tmCounts = document.getElementById('tm-counts');
const tmCollections = document.getElementById('tm-collections');
const tmGrid = document.getElementById('tm-grid');
const tmTitle = document.getElementById('tm-title');

let modalFilterCount = null;
let modalFilterCollection = 'All';

// Drag ghost element
let dragGhostEl = null;

function createDragGhost() {
  if (dragGhostEl) return;
  dragGhostEl = document.createElement('div');
  dragGhostEl.className = 'drag-ghost';
  document.body.appendChild(dragGhostEl);
}

/**
 * Initialize application
 */
function init() {
  createDragGhost();

  // Dropzone
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length) {
      loadFiles(Array.from(files));
    }
  });

  // Buttons
  btnLoadSample.addEventListener('click', loadSamplePhotos);
  btnClearPhotos.addEventListener('click', clearAllPhotos);
  btnShuffleAll.addEventListener('click', shuffleAllLayouts);
  btnShuffleCurrent.addEventListener('click', shuffleCurrentLayout);
  btnOpenTemplates.addEventListener('click', () => openTemplateModal(state.activeCardIndex));
  btnDownloadCurrent.addEventListener('click', downloadCurrentCard);
  btnExportZip.addEventListener('click', exportAllCardsZip);

  btnPrevCard.addEventListener('click', () => setActiveCard(state.activeCardIndex - 1));
  btnNextCard.addEventListener('click', () => setActiveCard(state.activeCardIndex + 1));

  // Collection filter
  selectCollection.addEventListener('change', (e) => {
    state.settings.collection = e.target.value;
    recomputeAllCardLayouts();
    renderAllCards();
  });

  // Theme selector
  themeSelector.addEventListener('click', (e) => {
    const pill = e.target.closest('.theme-pill');
    if (!pill) return;
    document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.settings.theme = pill.dataset.theme;
    pickerBg.value = rgbToHex(THEMES[state.settings.theme].bg);
    renderAllCards();
  });

  // Aspect ratio & size selector
  renderRatioButtons();
  updateDimensionReadouts();

  if (ratioFilterTabs) {
    ratioFilterTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.ratio-tab');
      if (!tab) return;
      const cat = tab.dataset.cat;
      state.settings.ratioFilter = cat;
      document.querySelectorAll('.ratio-tab').forEach(t => t.classList.toggle('active', t === tab));

      if (cat === 'custom') {
        if (state.settings.aspectRatio !== 'custom') {
          const cur = getActiveDimensions();
          state.settings.customWidth = cur.width;
          state.settings.customHeight = cur.height;
          if (inputCustomW) inputCustomW.value = cur.width;
          if (inputCustomH) inputCustomH.value = cur.height;
        }
        applyAspectRatio('custom');
      } else {
        if (customSizeBox) customSizeBox.style.display = state.settings.aspectRatio === 'custom' ? 'block' : 'none';
        renderRatioButtons();
      }
    });
  }

  ratioSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.ratio-btn');
    if (!btn) return;
    applyAspectRatio(btn.dataset.ratio);
  });

  if (btnFlipRatio) {
    btnFlipRatio.addEventListener('click', flipOrientation);
  }

  const handleCustomSizeInput = () => {
    const w = parseInt(inputCustomW.value);
    const h = parseInt(inputCustomH.value);
    if (!w || !h || w < 300 || h < 300) return;
    state.settings.customWidth = Math.min(6000, w);
    state.settings.customHeight = Math.min(6000, h);
    state.settings.aspectRatio = 'custom';
    updateDimensionReadouts();
    recomputeAllCardLayouts();
    renderAllCards();
  };

  if (inputCustomW) inputCustomW.addEventListener('change', handleCustomSizeInput);
  if (inputCustomH) inputCustomH.addEventListener('change', handleCustomSizeInput);

  // Distribution & Orientation Match
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

  // Typography
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

  if (inputDate) {
    inputDate.addEventListener('input', (e) => {
      state.settings.dateLine = e.target.value;
      renderAllCards();
    });
  }

  exportScaleSelect.addEventListener('change', (e) => {
    state.settings.exportScale = parseInt(e.target.value);
  });

  // Zoom controls
  zoomRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value) / 100;
    setZoomForSelectedSlot(val);
  });

  btnZoomIn.addEventListener('click', () => {
    const cur = getZoomForSelectedSlot();
    setZoomForSelectedSlot(Math.min(5, cur + 0.25));
  });

  btnZoomOut.addEventListener('click', () => {
    const cur = getZoomForSelectedSlot();
    setZoomForSelectedSlot(Math.max(1, cur - 0.25));
  });

  btnZoomReset.addEventListener('click', () => {
    resetSelectedSlotTransform();
  });

  // Global mouse handlers for pan & cross-card swap
  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);

  // Template Modal handlers
  tmClose.addEventListener('click', closeTemplateModal);
  tmDone.addEventListener('click', closeTemplateModal);
  templateModal.addEventListener('click', (e) => {
    if (e.target === templateModal) closeTemplateModal();
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') setActiveCard(state.activeCardIndex - 1);
    if (e.key === 'ArrowRight') setActiveCard(state.activeCardIndex + 1);
    if (e.key === 'Escape' && !templateModal.hidden) closeTemplateModal();
  });

  // Load sample photos on start
  loadSamplePhotos();
}

/**
 * Handle file input
 */
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  if (files.length) loadFiles(files);
}

async function loadFiles(files) {
  showToast(`Loading ${files.length} photos...`);
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    showToast('Please select valid image files.');
    return;
  }

  const loaded = await Promise.all(imageFiles.map(file => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const aspect = w / h;
          resolve({
            id: 'photo_' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            dataUrl: ev.target.result,
            img: img,
            width: w,
            height: h,
            aspect: aspect,
            orientation: aspect < 0.88 ? 'vertical' : (aspect > 1.15 ? 'horizontal' : 'square')
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }));

  state.photos.push(...loaded);
  updateThumbnails();
  partitionPhotosIntoCards();
  showToast(`Added ${loaded.length} photos (${state.photos.length} total)`);
}

function clearAllPhotos() {
  state.photos = [];
  state.cards = [];
  state.activeCardIndex = 0;
  state.selectedSlot = null;
  updateZoomToolbar();
  updateThumbnails();
  renderAllCards();
  showToast('All photos cleared');
}

/**
 * Update Sidebar Thumbnails & allow dragging from strip onto any card slot
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
    slot.title = `${photo.name} (${photo.width}x${photo.height}) - Drag to place on card`;

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

    // Drag from sidebar thumbnail onto a card slot
    slot.addEventListener('mousedown', (e) => {
      if (e.target === delBtn) return;
      startCrossCardDrag({
        mode: 'swap',
        fromCardIndex: -1,
        fromSlotIndex: -1,
        fromPhotoId: photo.id,
        startX: e.clientX,
        startY: e.clientY,
        photo: photo
      });
      e.preventDefault();
    });

    slot.appendChild(img);
    slot.appendChild(badge);
    slot.appendChild(delBtn);
    thumbnailStrip.appendChild(slot);
  });
}

function removePhoto(index) {
  const removed = state.photos.splice(index, 1)[0];
  state.cards.forEach(c => {
    c.photoIds = c.photoIds.filter(id => id !== removed.id);
  });
  state.cards = state.cards.filter(c => c.photoIds.length > 0);
  updateThumbnails();
  renderAllCards();
}

/**
 * Slot Transform Helpers (Zoom & Pan stored per slot in card)
 */
function getSlotTransform(card, slotIndex) {
  if (!card.slotTransforms) card.slotTransforms = [];
  if (!card.slotTransforms[slotIndex]) {
    card.slotTransforms[slotIndex] = { zoom: 1.0, panX: 0, panY: 0 };
  }
  return card.slotTransforms[slotIndex];
}

function getZoomForSelectedSlot() {
  if (!state.selectedSlot) return 1.0;
  const card = state.cards[state.selectedSlot.cardIndex];
  if (!card) return 1.0;
  return getSlotTransform(card, state.selectedSlot.slotIndex).zoom || 1.0;
}

function setZoomForSelectedSlot(val) {
  if (!state.selectedSlot) return;
  const card = state.cards[state.selectedSlot.cardIndex];
  if (!card) return;
  const tf = getSlotTransform(card, state.selectedSlot.slotIndex);
  tf.zoom = Math.max(1.0, Math.min(5.0, val));
  updateZoomToolbar();
  renderCardByIndex(state.selectedSlot.cardIndex);
}

function resetSelectedSlotTransform() {
  if (!state.selectedSlot) return;
  const card = state.cards[state.selectedSlot.cardIndex];
  if (!card) return;
  const tf = getSlotTransform(card, state.selectedSlot.slotIndex);
  tf.zoom = 1.0;
  tf.panX = 0;
  tf.panY = 0;
  updateZoomToolbar();
  renderCardByIndex(state.selectedSlot.cardIndex);
  showToast('Reset zoom & position');
}

function updateZoomToolbar() {
  if (!state.selectedSlot) {
    zoomControls.classList.add('disabled');
    zoomRange.value = 100;
    zoomValue.textContent = '100%';
    return;
  }
  const card = state.cards[state.selectedSlot.cardIndex];
  if (!card) {
    zoomControls.classList.add('disabled');
    return;
  }
  zoomControls.classList.remove('disabled');
  const tf = getSlotTransform(card, state.selectedSlot.slotIndex);
  const zPct = Math.round((tf.zoom || 1.0) * 100);
  zoomRange.value = zPct;
  zoomValue.textContent = zPct + '%';
}

function selectSlot(cardIndex, slotIndex) {
  state.selectedSlot = { cardIndex, slotIndex };
  setActiveCard(cardIndex);
  updateZoomToolbar();
  updateSlotSelectionIndicators();
}

/**
 * Ratio & Canvas Size UI Helpers
 */
function renderRatioButtons() {
  if (!ratioSelector) return;
  const filter = state.settings.ratioFilter || 'all';
  ratioSelector.innerHTML = '';

  if (filter === 'custom') {
    ratioSelector.style.display = 'none';
    if (customSizeBox) customSizeBox.style.display = 'block';
    return;
  }

  ratioSelector.style.display = 'grid';
  if (customSizeBox) {
    customSizeBox.style.display = state.settings.aspectRatio === 'custom' ? 'block' : 'none';
  }

  const list = filter === 'all'
    ? RATIO_PRESETS
    : RATIO_PRESETS.filter(p => p.cats.includes(filter));

  list.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = `ratio-btn ${state.settings.aspectRatio === preset.id ? 'active' : ''}`;
    btn.dataset.ratio = preset.id;
    btn.title = `${preset.label} (${preset.sub}) — ${preset.width} × ${preset.height} px`;

    // Proportional miniature rectangle icon (fits inside 24x22 box)
    const r = preset.width / preset.height;
    let bw, bh;
    if (r >= 1) {
      bw = 22;
      bh = Math.max(8, Math.round(22 / r));
    } else {
      bh = 22;
      bw = Math.max(9, Math.round(22 * r));
    }

    btn.innerHTML = `
      <span class="ratio-icon-wrap">
        <span class="ratio-box" style="width:${bw}px;height:${bh}px;"></span>
      </span>
      <span class="ratio-label">${preset.label}</span>
      <span class="ratio-sub">${preset.sub}</span>
    `;
    ratioSelector.appendChild(btn);
  });
}

function applyAspectRatio(ratioId) {
  state.settings.aspectRatio = ratioId;
  if (customSizeBox) {
    customSizeBox.style.display = ratioId === 'custom' ? 'block' : 'none';
  }
  renderRatioButtons();
  updateDimensionReadouts();
  recomputeAllCardLayouts();
  renderAllCards();

  const dim = getActiveDimensions();
  showToast(`Canvas size: ${dim.label} (${dim.width}×${dim.height}px)`);
}

function flipOrientation() {
  if (state.settings.aspectRatio === 'custom') {
    const tmp = state.settings.customWidth;
    state.settings.customWidth = state.settings.customHeight;
    state.settings.customHeight = tmp;
    if (inputCustomW) inputCustomW.value = state.settings.customWidth;
    if (inputCustomH) inputCustomH.value = state.settings.customHeight;
    applyAspectRatio('custom');
    return;
  }

  const cur = DIMENSIONS[state.settings.aspectRatio];
  if (!cur) return;

  if (cur.flip === 'custom') {
    state.settings.customWidth = cur.height;
    state.settings.customHeight = cur.width;
    if (inputCustomW) inputCustomW.value = state.settings.customWidth;
    if (inputCustomH) inputCustomH.value = state.settings.customHeight;
    applyAspectRatio('custom');
  } else if (cur.flip && cur.flip !== cur.id) {
    // Switch filter tab back to 'all' if flipped ratio isn't in current filter
    const target = DIMENSIONS[cur.flip];
    if (state.settings.ratioFilter !== 'all' && target && !target.cats.includes(state.settings.ratioFilter)) {
      state.settings.ratioFilter = 'all';
      document.querySelectorAll('.ratio-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cat === 'all');
      });
    }
    applyAspectRatio(cur.flip);
  } else {
    showToast('1:1 Square is already symmetrical');
  }
}

function updateDimensionReadouts() {
  const dim = getActiveDimensions();
  if (activeDimBadge) {
    activeDimBadge.textContent = `${dim.width}×${dim.height}`;
  }
  if (customRatioInfo) {
    const w = parseInt(state.settings.customWidth) || dim.width;
    const h = parseInt(state.settings.customHeight) || dim.height;
    customRatioInfo.textContent = `Ratio: ${simplifyRatio(w, h)} (${(w / h).toFixed(2)}) · 300–6000px`;
  }
  if (exportScaleSelect) {
    const opts = exportScaleSelect.options;
    if (opts[0]) opts[0].textContent = `1× Standard (${dim.width}×${dim.height})`;
    if (opts[1]) opts[1].textContent = `2× Ultra Crisp (${dim.width * 2}×${dim.height * 2})`;
    if (opts[2]) opts[2].textContent = `3× Print HD (${dim.width * 3}×${dim.height * 3})`;
  }
}

/**
 * Orientation & Aspect Ratio calculation
 */
function getSlotAspectRatio(slot) {
  const dim = getActiveDimensions();
  const scaleRatio = getScaleRatio(dim.width, dim.height);
  const margin = state.settings.margin * scaleRatio;
  const contentW = dim.width - margin * 2;
  const contentH = dim.height - margin * 2;
  return (slot.w * contentW) / (slot.h * contentH);
}

function scoreLayoutMatching(layout, photos) {
  const n = photos.length;
  if (layout.slots.length !== n) return { penalty: Infinity, assignment: [] };

  const slotAspects = layout.slots.map(s => getSlotAspectRatio(s));
  const photoAspects = photos.map(p => p.aspect);

  const perms = getPermutations([...Array(n).keys()]);
  let minPenalty = Infinity;
  let bestPerm = perms[0];

  for (const perm of perms) {
    let penalty = 0;
    for (let slotIdx = 0; slotIdx < n; slotIdx++) {
      const pIdx = perm[slotIdx];
      const pAspect = photoAspects[pIdx];
      const sAspect = slotAspects[slotIdx];

      const logDiff = Math.abs(Math.log(pAspect) - Math.log(sAspect));
      penalty += logDiff * logDiff;

      const pIsVert = pAspect < 0.90;
      const sIsVert = sAspect < 0.90;
      const pIsHoriz = pAspect > 1.15;
      const sIsHoriz = sAspect > 1.15;

      if ((pIsVert && sIsHoriz) || (pIsHoriz && sIsVert)) {
        penalty += 12.0;
      }
    }

    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestPerm = perm;
    }
  }

  return { penalty: minPenalty, assignment: bestPerm };
}

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

function getAvailableTemplatesForCount(count) {
  const col = state.settings.collection;
  let list = TEMPLATE_CATALOG.filter(t => t.count === count);
  if (col && col !== 'auto') {
    const filtered = list.filter(t => t.collection.toLowerCase() === col.toLowerCase());
    if (filtered.length > 0) list = filtered;
  }
  return list.length > 0 ? list : TEMPLATE_CATALOG.filter(t => t.count === count);
}

function selectBestLayoutForPhotos(photos) {
  const n = photos.length;
  const candidates = getAvailableTemplatesForCount(n);
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
 * Partition 15–30 Photos into Cards
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
    const verticals = allPhotos.filter(p => p.orientation === 'vertical');
    const horizontals = allPhotos.filter(p => p.orientation === 'horizontal');
    const squares = allPhotos.filter(p => p.orientation === 'square');

    if (verticals.length >= horizontals.length) {
      horizontals.push(...squares);
    } else {
      verticals.push(...squares);
    }

    // Form mixed cards first
    while (horizontals.length >= 1 && verticals.length >= 2 && state.settings.photosPerCard === 'smart') {
      if (horizontals.length >= 1 && verticals.length >= 4) {
        const hPhoto = horizontals.shift();
        const vPhotos = verticals.splice(0, 4);
        chunks.push([hPhoto, ...vPhotos]);
      } else {
        const hPhoto = horizontals.shift();
        const vPhotos = verticals.splice(0, 2);
        chunks.push([hPhoto, ...vPhotos]);
      }
    }

    chunkPhotoList(verticals, chunks, state.settings.photosPerCard, [4, 3, 2]);
    chunkPhotoList(horizontals, chunks, state.settings.photosPerCard, [3, 2, 4]);
  } else {
    chunkPhotoList(allPhotos, chunks, state.settings.photosPerCard, [3, 4, 2, 5]);
  }

  state.cards = chunks.map((chunkPhotos, cardIndex) => {
    const { layout, assignment } = selectBestLayoutForPhotos(chunkPhotos);
    const orderedPhotoIds = assignment.map(idx => chunkPhotos[idx].id);

    return {
      id: 'card_' + cardIndex,
      photoIds: orderedPhotoIds,
      layoutId: layout ? layout.id : 'cs-01-hero',
      size: chunkPhotos.length,
      slotTransforms: chunkPhotos.map(() => ({ zoom: 1.0, panX: 0, panY: 0 }))
    };
  });

  if (state.activeCardIndex >= state.cards.length) {
    state.activeCardIndex = Math.max(0, state.cards.length - 1);
  }

  renderAllCards();
}

function chunkPhotoList(list, targetChunks, strategy, preferredSizes = [4, 3, 2]) {
  while (list.length > 0) {
    if (list.length <= 5) {
      if (list.length === 1 && targetChunks.length > 0) {
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

function shuffleAllLayouts() {
  state.cards.forEach(card => {
    const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
    const available = getAvailableTemplatesForCount(photos.length);
    if (available.length > 1) {
      const other = available.filter(t => t.id !== card.layoutId);
      const picked = other[Math.floor(Math.random() * other.length)] || available[0];
      const { assignment } = scoreLayoutMatching(picked, photos);
      card.layoutId = picked.id;
      card.photoIds = assignment.map(idx => photos[idx].id);
    }
  });
  renderAllCards();
  showToast('Shuffled layouts across all cards');
}

function shuffleCurrentLayout() {
  const card = state.cards[state.activeCardIndex];
  if (!card) return;
  const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
  const available = getAvailableTemplatesForCount(photos.length);
  if (available.length > 1) {
    const idx = available.findIndex(t => t.id === card.layoutId);
    const nextItem = available[(idx + 1) % available.length];
    const { assignment } = scoreLayoutMatching(nextItem, photos);
    card.layoutId = nextItem.id;
    card.photoIds = assignment.map(i => photos[i].id);
    renderAllCards();
    showToast(`Applied: ${nextItem.name}`);
  }
}

function getTemplateById(id) {
  return TEMPLATE_CATALOG.find(t => t.id === id) || TEMPLATE_CATALOG[0];
}

/**
 * Render All Cards to Deck
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
        <p>Drop 15 to 30 photos or click "Demo Photos" in the top bar to preview Unfold & Classico story templates.</p>
        <button class="btn btn-primary" onclick="loadSamplePhotos()">Load Demo Photos</button>
      </div>
    `;
    return;
  }

  const dim = getActiveDimensions();

  state.cards.forEach((card, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = `story-card-wrapper ${idx === state.activeCardIndex ? 'active-card' : ''}`;
    wrapper.dataset.cardIndex = idx;

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

    // Canvas Mouse & Drag Listeners
    attachCanvasListeners(canvas, idx);

    // Badges & Buttons
    const badge = document.createElement('div');
    badge.className = 'card-header-badge';
    badge.textContent = `STORY ${idx + 1}`;

    const addBtn = document.createElement('button');
    addBtn.className = 'card-add-slot-btn';
    addBtn.innerHTML = '+';
    addBtn.title = 'Browse templates for this card';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      openTemplateModal(idx);
    };

    container.appendChild(canvas);
    container.appendChild(badge);
    container.appendChild(addBtn);

    // Card Action Bar
    const actionsBar = document.createElement('div');
    actionsBar.className = 'card-actions-bar';

    const layout = getTemplateById(card.layoutId);
    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'action-pill-btn';
    layoutBtn.textContent = layout.name;
    layoutBtn.title = 'Click to open template library';
    layoutBtn.onclick = () => openTemplateModal(idx);

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

    // Render Canvas
    renderCardToCanvas(card, canvas);

    // Bottom Story Strip Thumbnail
    const stripItem = document.createElement('div');
    stripItem.className = `strip-item ${idx === state.activeCardIndex ? 'active' : ''}`;
    stripItem.dataset.cardIndex = idx;
    stripItem.style.aspectRatio = `${dim.width} / ${dim.height}`;

    const stripCanvas = document.createElement('canvas');
    const stripHeight = 140;
    stripCanvas.height = stripHeight;
    stripCanvas.width = Math.max(60, Math.round(stripHeight * (dim.width / dim.height)));
    stripItem.appendChild(stripCanvas);

    const indexBadge = document.createElement('span');
    indexBadge.className = 'strip-index';
    indexBadge.textContent = idx + 1;
    stripItem.appendChild(indexBadge);

    renderCardToCanvas(card, stripCanvas, true);

    stripItem.addEventListener('click', () => setActiveCard(idx));
    storyStrip.appendChild(stripItem);
  });

  updateSlotSelectionIndicators();
  scrollToActiveCard();
}

function renderCardByIndex(cardIndex) {
  const card = state.cards[cardIndex];
  if (!card) return;

  const wrapper = document.querySelector(`.story-card-wrapper[data-card-index="${cardIndex}"]`);
  if (wrapper) {
    const canvas = wrapper.querySelector('.story-card-canvas');
    if (canvas) renderCardToCanvas(card, canvas);
  }

  const stripItem = document.querySelector(`.strip-item[data-card-index="${cardIndex}"]`);
  if (stripItem) {
    const stripCanvas = stripItem.querySelector('canvas');
    if (stripCanvas) renderCardToCanvas(card, stripCanvas, true);
  }

  updateSlotSelectionIndicators();
}

/**
 * Visual Selection & Drop-Target Highlights
 */
function updateSlotSelectionIndicators() {
  document.querySelectorAll('.slot-selected-indicator, .slot-drop-target-indicator').forEach(el => el.remove());

  // 1. Draw Selected Slot ring
  if (state.selectedSlot) {
    const { cardIndex, slotIndex } = state.selectedSlot;
    const card = state.cards[cardIndex];
    if (card) {
      const layout = getTemplateById(card.layoutId);
      const slot = layout.slots[slotIndex];
      const wrapper = document.querySelector(`.story-card-wrapper[data-card-index="${cardIndex}"] .story-card-container`);
      if (wrapper && slot) {
        const ring = document.createElement('div');
        ring.className = 'slot-selected-indicator';
        positionIndicatorOnContainer(ring, slot, wrapper);
        wrapper.appendChild(ring);
      }
    }
  }

  // 2. Draw Drop Target dashed indicator while dragging
  if (state.dragState.active && state.dragState.hoverCardIndex !== -1 && state.dragState.hoverSlotIndex !== -1) {
    const { hoverCardIndex, hoverSlotIndex } = state.dragState;
    const card = state.cards[hoverCardIndex];
    if (card) {
      const layout = getTemplateById(card.layoutId);
      const slot = layout.slots[hoverSlotIndex];
      const wrapper = document.querySelector(`.story-card-wrapper[data-card-index="${hoverCardIndex}"] .story-card-container`);
      if (wrapper && slot) {
        const targetInd = document.createElement('div');
        targetInd.className = 'slot-drop-target-indicator';
        positionIndicatorOnContainer(targetInd, slot, wrapper);
        wrapper.appendChild(targetInd);
      }
    }
  }
}

function positionIndicatorOnContainer(el, slot, container) {
  const dim = getActiveDimensions();
  const scaleRatio = getScaleRatio(dim.width, dim.height);
  const marginPx = state.settings.margin * scaleRatio;
  const gapPx = state.settings.gap * scaleRatio;
  const contentW = dim.width - marginPx * 2;
  const contentH = dim.height - marginPx * 2;

  const sx = marginPx + slot.x * contentW;
  const sy = marginPx + slot.y * contentH;
  const sw = slot.w * contentW - (slot.w < 1 ? gapPx / 2 : 0);
  const sh = slot.h * contentH - (slot.h < 1 ? gapPx / 2 : 0);

  const previewW = container.clientWidth;
  const scale = previewW / dim.width;

  el.style.left = (sx * scale) + 'px';
  el.style.top = (sy * scale) + 'px';
  el.style.width = (sw * scale) + 'px';
  el.style.height = (sh * scale) + 'px';
}

/**
 * Canvas Drag, Pan, Zoom, and Cross-Card Swap Interaction
 */
function attachCanvasListeners(canvas, cardIndex) {
  // Click & Drag inside frame
  canvas.addEventListener('mousedown', (e) => {
    const slotIdx = getSlotAtCoords(canvas, cardIndex, e.clientX, e.clientY);
    if (slotIdx === -1) return;

    selectSlot(cardIndex, slotIdx);

    const card = state.cards[cardIndex];
    const photoId = card.photoIds[slotIdx];
    const photo = state.photos.find(p => p.id === photoId);
    const tf = getSlotTransform(card, slotIdx);

    startCrossCardDrag({
      mode: 'undecided',
      fromCardIndex: cardIndex,
      fromSlotIndex: slotIdx,
      fromPhotoId: photoId,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: tf.panX || 0,
      initialPanY: tf.panY || 0,
      photo: photo
    });

    e.preventDefault();
  });

  // Mouse wheel to zoom into specific photo slot
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slotIdx = getSlotAtCoords(canvas, cardIndex, e.clientX, e.clientY);
    if (slotIdx === -1) return;

    selectSlot(cardIndex, slotIdx);
    const card = state.cards[cardIndex];
    const tf = getSlotTransform(card, slotIdx);

    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    tf.zoom = Math.max(1.0, Math.min(5.0, (tf.zoom || 1.0) + delta));
    updateZoomToolbar();
    renderCardByIndex(cardIndex);
  }, { passive: false });

  // Double click resets zoom & pan
  canvas.addEventListener('dblclick', (e) => {
    const slotIdx = getSlotAtCoords(canvas, cardIndex, e.clientX, e.clientY);
    if (slotIdx === -1) return;
    const card = state.cards[cardIndex];
    const tf = getSlotTransform(card, slotIdx);
    tf.zoom = 1.0;
    tf.panX = 0;
    tf.panY = 0;
    updateZoomToolbar();
    renderCardByIndex(cardIndex);
    showToast('Reset frame zoom');
  });
}

function getSlotAtCoords(canvas, cardIndex, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const clickX = (clientX - rect.left) / rect.width;
  const clickY = (clientY - rect.top) / rect.height;

  const card = state.cards[cardIndex];
  if (!card) return -1;
  const layout = getTemplateById(card.layoutId);

  const dim = getActiveDimensions();
  const scaleRatio = getScaleRatio(dim.width, dim.height);
  const marginPx = state.settings.margin * scaleRatio;
  const marginNormX = marginPx / dim.width;
  const marginNormY = marginPx / dim.height;
  const contentW = 1 - marginNormX * 2;
  const contentH = 1 - marginNormY * 2;

  return layout.slots.findIndex(s => {
    const sx = marginNormX + s.x * contentW;
    const sy = marginNormY + s.y * contentH;
    const sw = s.w * contentW;
    const sh = s.h * contentH;
    return clickX >= sx && clickX <= sx + sw && clickY >= sy && clickY <= sy + sh;
  });
}

function startCrossCardDrag(info) {
  state.dragState = {
    active: true,
    mode: info.mode,
    fromCardIndex: info.fromCardIndex,
    fromSlotIndex: info.fromSlotIndex,
    fromPhotoId: info.fromPhotoId,
    startX: info.startX,
    startY: info.startY,
    currentX: info.startX,
    currentY: info.startY,
    hoverCardIndex: -1,
    hoverSlotIndex: -1,
    initialPanX: info.initialPanX || 0,
    initialPanY: info.initialPanY || 0,
    photo: info.photo
  };

  if (info.photo) {
    dragGhostEl.style.backgroundImage = `url("${info.photo.dataUrl}")`;
  }
}

function handleGlobalMouseMove(e) {
  if (!state.dragState.active) return;

  const ds = state.dragState;
  ds.currentX = e.clientX;
  ds.currentY = e.clientY;

  const dx = e.clientX - ds.startX;
  const dy = e.clientY - ds.startY;
  const dist = Math.hypot(dx, dy);

  // If undecided, decide whether user is panning inside frame or dragging to swap
  if (ds.mode === 'undecided') {
    if (dist > 8) {
      ds.mode = 'swap';
      document.body.classList.add('is-dragging-photo');
      dragGhostEl.classList.add('show');
    }
  }

  // SWAP DRAGGING MODE: moving ghost and finding drop target
  if (ds.mode === 'swap') {
    dragGhostEl.style.transform = `translate(${e.clientX - 40}px, ${e.clientY - 40}px)`;

    // Find canvas and slot under mouse
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const canvasBelow = elemBelow ? elemBelow.closest('.story-card-canvas') : null;

    if (canvasBelow) {
      const wrapper = canvasBelow.closest('.story-card-wrapper');
      const targetCardIdx = wrapper ? parseInt(wrapper.dataset.cardIndex) : -1;
      if (targetCardIdx !== -1) {
        const targetSlotIdx = getSlotAtCoords(canvasBelow, targetCardIdx, e.clientX, e.clientY);
        if (targetSlotIdx !== -1) {
          ds.hoverCardIndex = targetCardIdx;
          ds.hoverSlotIndex = targetSlotIdx;
          updateSlotSelectionIndicators();
          return;
        }
      }
    }

    ds.hoverCardIndex = -1;
    ds.hoverSlotIndex = -1;
    updateSlotSelectionIndicators();
    return;
  }

  // PANNING MODE (when zoom > 1 or user dragging inside frame)
  if (ds.mode === 'undecided' || ds.mode === 'pan') {
    if (ds.fromCardIndex !== -1 && ds.fromSlotIndex !== -1) {
      const card = state.cards[ds.fromCardIndex];
      if (card) {
        const tf = getSlotTransform(card, ds.fromSlotIndex);
        const sensitivity = 0.0035 / (tf.zoom || 1.0);
        tf.panX = Math.max(-0.5, Math.min(0.5, ds.initialPanX - dx * sensitivity));
        tf.panY = Math.max(-0.5, Math.min(0.5, ds.initialPanY - dy * sensitivity));
        renderCardByIndex(ds.fromCardIndex);
      }
    }
  }
}

function handleGlobalMouseUp(e) {
  if (!state.dragState.active) return;

  const ds = state.dragState;
  document.body.classList.remove('is-dragging-photo');
  dragGhostEl.classList.remove('show');

  // Perform Swap if dropped onto a valid target slot
  if (ds.mode === 'swap' && ds.hoverCardIndex !== -1 && ds.hoverSlotIndex !== -1) {
    const toCard = state.cards[ds.hoverCardIndex];
    const toSlot = ds.hoverSlotIndex;

    // Dropped from sidebar thumbnail onto a slot
    if (ds.fromCardIndex === -1) {
      toCard.photoIds[toSlot] = ds.fromPhotoId;
      renderCardByIndex(ds.hoverCardIndex);
      showToast(`Placed photo in Story ${ds.hoverCardIndex + 1}`);
    }
    // Dropped from Card A to Card B (or within same card)
    else if (ds.fromCardIndex !== ds.hoverCardIndex || ds.fromSlotIndex !== toSlot) {
      const fromCard = state.cards[ds.fromCardIndex];
      const fromSlot = ds.fromSlotIndex;

      // Swap photo IDs
      const tempId = toCard.photoIds[toSlot];
      toCard.photoIds[toSlot] = fromCard.photoIds[fromSlot];
      fromCard.photoIds[fromSlot] = tempId;

      // Swap slot transforms (zoom / pan)
      const tfFrom = getSlotTransform(fromCard, fromSlot);
      const tfTo = getSlotTransform(toCard, toSlot);
      const tempTf = { ...tfTo };
      toCard.slotTransforms[toSlot] = { ...tfFrom };
      fromCard.slotTransforms[fromSlot] = tempTf;

      renderCardByIndex(ds.fromCardIndex);
      if (ds.fromCardIndex !== ds.hoverCardIndex) {
        renderCardByIndex(ds.hoverCardIndex);
      }

      selectSlot(ds.hoverCardIndex, toSlot);
      showToast(`Swapped photo to Story ${ds.hoverCardIndex + 1}`);
    }
  }

  state.dragState.active = false;
  state.dragState.hoverCardIndex = -1;
  state.dragState.hoverSlotIndex = -1;
  updateSlotSelectionIndicators();
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
  const layout = getTemplateById(card.layoutId);
  if (!layout) return;

  // Background
  const customBg = state.settings.bgColor || theme.bg;
  ctx.fillStyle = customBg;
  ctx.fillRect(0, 0, cw, ch);

  if (theme.hasPaperTexture && !isThumbnail) {
    drawPaperTexture(ctx, cw, ch);
  }

  if (theme.hasFilmBorder || layout.isFilm) {
    drawFilmDetails(ctx, cw, ch, card);
  }

  const scaleRatio = getScaleRatio(cw, ch);
  const margin = state.settings.margin * scaleRatio;
  const gap = state.settings.gap * scaleRatio;
  const radius = state.settings.radius * scaleRatio;

  const contentX = margin;
  const contentY = margin;
  const contentW = cw - margin * 2;
  const contentH = ch - margin * 2;

  // Retrieve photos
  const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);

  layout.slots.forEach((slot, slotIdx) => {
    const photo = photos[slotIdx];
    if (!photo) return;

    const sx = contentX + slot.x * contentW;
    const sy = contentY + slot.y * contentH;
    const sw = slot.w * contentW - (slot.w < 1 ? gap / 2 : 0);
    const sh = slot.h * contentH - (slot.h < 1 ? gap / 2 : 0);

    const tf = getSlotTransform(card, slotIdx);

    ctx.save();

    // Polaroid frame border if polaroid layout
    if (layout.isPolaroid) {
      drawPolaroidFrame(ctx, sx, sy, sw, sh, radius, scaleRatio);
    }

    if (radius > 0) {
      roundedRectPath(ctx, sx, sy, sw, sh, radius);
      ctx.clip();
    }

    if (state.settings.fitMode === 'contain' && tf.zoom <= 1.0) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(sx, sy, sw, sh);
      drawImageContain(ctx, photo.img, sx, sy, sw, sh);
    } else {
      drawImageCoverWithZoomAndPan(ctx, photo, sx, sy, sw, sh, tf.zoom || 1.0, tf.panX || 0, tf.panY || 0);
    }

    ctx.restore();

    // Subtle border
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
 * Draw Polaroid Frame
 */
function drawPolaroidFrame(ctx, sx, sy, sw, sh, radius, scaleRatio) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 14 * scaleRatio;
  ctx.shadowOffsetY = 6 * scaleRatio;
  const pad = 12 * scaleRatio;
  const botPad = 40 * scaleRatio;
  ctx.fillRect(sx - pad, sy - pad, sw + pad * 2, sh + pad + botPad);
  ctx.restore();
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
    currentY += lineHeight * 2;
  }

  if (state.settings.dateLine) {
    ctx.font = `600 ${Math.round(13 * scaleRatio)}px "Space Mono", monospace`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(state.settings.dateLine.toUpperCase(), centerX, currentY + 16 * scaleRatio);
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
 * Draw Image Cover with Independent Zoom and Pan
 */
function drawImageCoverWithZoomAndPan(ctx, photo, dx, dy, dw, dh, zoom = 1.0, panX = 0, panY = 0) {
  const img = photo.img;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const imgRatio = imgW / imgH;
  const targetRatio = dw / dh;

  let baseW, baseH;
  if (imgRatio > targetRatio) {
    baseH = imgH;
    baseW = imgH * targetRatio;
  } else {
    baseW = imgW;
    baseH = imgW / targetRatio;
  }

  // Apply zoom factor
  const effectiveW = baseW / zoom;
  const effectiveH = baseH / zoom;

  const maxShiftX = imgW - effectiveW;
  const maxShiftY = imgH - effectiveH;

  const sx = Math.max(0, Math.min(maxShiftX, (maxShiftX / 2) + panX * maxShiftX));
  const sy = Math.max(0, Math.min(maxShiftY, (maxShiftY / 2) + panY * maxShiftY));

  ctx.drawImage(img, sx, sy, effectiveW, effectiveH, dx, dy, dw, dh);
}

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
 * Template Browser Modal
 */
function openTemplateModal(cardIndex) {
  const card = state.cards[cardIndex];
  if (!card) return;

  state.activeCardIndex = cardIndex;
  tmTitle.textContent = `Templates for Story ${cardIndex + 1}`;
  modalFilterCount = card.photoIds.length;
  modalFilterCollection = 'All';

  renderModalControls();
  renderModalGrid();

  templateModal.hidden = false;
}

function closeTemplateModal() {
  templateModal.hidden = true;
}

function renderModalControls() {
  // Photo count filter chips (1 to 6)
  tmCounts.innerHTML = '';
  [1, 2, 3, 4, 5, 6].forEach(cnt => {
    const chip = document.createElement('button');
    chip.className = `tm-chip ${cnt === modalFilterCount ? 'active' : ''}`;
    const totalMatching = TEMPLATE_CATALOG.filter(t => t.count === cnt).length;
    chip.innerHTML = `${cnt} Photos <span class="tm-chip-count">(${totalMatching})</span>`;
    chip.onclick = () => {
      modalFilterCount = cnt;
      renderModalControls();
      renderModalGrid();
    };
    tmCounts.appendChild(chip);
  });

  // Collection chips
  tmCollections.innerHTML = '';
  const collections = ['All', 'Classico', 'Editorial', 'Film', 'Polaroid', 'Minimal'];
  collections.forEach(col => {
    const chip = document.createElement('button');
    chip.className = `tm-chip ${col === modalFilterCollection ? 'active' : ''}`;
    chip.textContent = col;
    chip.onclick = () => {
      modalFilterCollection = col;
      renderModalControls();
      renderModalGrid();
    };
    tmCollections.appendChild(chip);
  });
}

function renderModalGrid() {
  tmGrid.innerHTML = '';
  const currentCard = state.cards[state.activeCardIndex];

  let filtered = TEMPLATE_CATALOG.filter(t => t.count === modalFilterCount);
  if (modalFilterCollection !== 'All') {
    filtered = filtered.filter(t => t.collection.toLowerCase() === modalFilterCollection.toLowerCase());
  }

  if (filtered.length === 0) {
    tmGrid.innerHTML = `<div class="tm-empty">No templates found in ${modalFilterCollection} with ${modalFilterCount} photos.</div>`;
    return;
  }

  const dim = getActiveDimensions();
  const previewRatio = Math.max(0.4, Math.min(2.2, dim.height / dim.width));

  filtered.forEach(tmpl => {
    const tile = document.createElement('button');
    tile.className = `tm-tile ${currentCard && currentCard.layoutId === tmpl.id ? 'active' : ''}`;

    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 160;
    miniCanvas.height = Math.round(160 * previewRatio);
    drawTemplatePreview(miniCanvas, tmpl);

    const titleEl = document.createElement('div');
    titleEl.className = 'tm-tile-name';
    titleEl.textContent = tmpl.name;

    const colEl = document.createElement('div');
    colEl.className = 'tm-tile-col';
    colEl.textContent = `${tmpl.collection} • ${tmpl.count} photos`;

    tile.appendChild(miniCanvas);
    tile.appendChild(titleEl);
    tile.appendChild(colEl);

    tile.onclick = () => {
      applyTemplateToActiveCard(tmpl);
      closeTemplateModal();
    };

    tmGrid.appendChild(tile);
  });
}

function drawTemplatePreview(canvas, tmpl) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const pad = 6;
  const gap = 3;
  const contentW = w - pad * 2;
  const contentH = h - pad * 2;

  tmpl.slots.forEach(s => {
    const sx = pad + s.x * contentW;
    const sy = pad + s.y * contentH;
    const sw = s.w * contentW - (s.w < 1 ? gap / 2 : 0);
    const sh = s.h * contentH - (s.h < 1 ? gap / 2 : 0);

    ctx.fillStyle = '#e2e6ea';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#c5cbd3';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);
  });
}

function applyTemplateToActiveCard(tmpl) {
  const card = state.cards[state.activeCardIndex];
  if (!card) return;

  const currentCount = card.photoIds.length;
  const targetCount = tmpl.count;

  if (targetCount !== currentCount) {
    adjustCardPhotoCount(state.activeCardIndex, targetCount);
  }

  const photos = card.photoIds.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
  const { assignment } = scoreLayoutMatching(tmpl, photos);

  card.layoutId = tmpl.id;
  card.photoIds = assignment.map(i => photos[i].id);

  renderAllCards();
  showToast(`Applied: ${tmpl.name}`);
}

function adjustCardPhotoCount(cardIndex, targetCount) {
  const card = state.cards[cardIndex];
  const diff = targetCount - card.photoIds.length;

  if (diff > 0) {
    // Borrow photos from following cards or unused photos
    for (let c = cardIndex + 1; c < state.cards.length && card.photoIds.length < targetCount; c++) {
      const nextCard = state.cards[c];
      while (nextCard.photoIds.length > 2 && card.photoIds.length < targetCount) {
        card.photoIds.push(nextCard.photoIds.shift());
      }
    }
  } else if (diff < 0) {
    // Move extra photos to next card or create a new card
    const excess = card.photoIds.splice(targetCount);
    if (cardIndex + 1 < state.cards.length) {
      state.cards[cardIndex + 1].photoIds.unshift(...excess);
    } else {
      state.cards.push({
        id: 'card_' + state.cards.length,
        photoIds: excess,
        layoutId: 'cs-01-hero',
        size: excess.length,
        slotTransforms: excess.map(() => ({ zoom: 1.0, panX: 0, panY: 0 }))
      });
    }
  }
}

/**
 * High-Res Export
 */
function downloadSingleCard(cardIndex) {
  const card = state.cards[cardIndex];
  if (!card) return;

  const baseDim = getActiveDimensions();
  const scale = state.settings.exportScale || 2;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = baseDim.width * scale;
  exportCanvas.height = baseDim.height * scale;

  renderCardToCanvas(card, exportCanvas);

  const ratioTag = state.settings.aspectRatio.replace(':', 'x');
  const link = document.createElement('a');
  link.download = `kt-collage-${cardIndex + 1}-${ratioTag}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();

  showToast(`Exported Story Card ${cardIndex + 1} (${exportCanvas.width}×${exportCanvas.height}px)`);
}

function downloadCurrentCard() {
  downloadSingleCard(state.activeCardIndex);
}

async function exportAllCardsZip() {
  if (state.cards.length === 0) {
    showToast('No cards to export!');
    return;
  }

  showToast(`Generating ZIP for ${state.cards.length} cards...`);

  const zip = new JSZip();
  const baseDim = getActiveDimensions();
  const scale = state.settings.exportScale || 2;
  const ratioTag = state.settings.aspectRatio.replace(':', 'x');

  for (let i = 0; i < state.cards.length; i++) {
    const card = state.cards[i];
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseDim.width * scale;
    exportCanvas.height = baseDim.height * scale;

    renderCardToCanvas(card, exportCanvas);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    zip.file(`kt-collage-${String(i + 1).padStart(2, '0')}-${ratioTag}.png`, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `KTcollage-Stories-${new Date().toISOString().slice(0, 10)}.zip`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
  showToast('ZIP download ready!');
}

/**
 * Load Demo Photos with Distinct Landscapes & Vertical Family Portraits
 */
function loadSamplePhotos() {
  showToast('Generating demo photos...');

  const sampleDefinitions = [
    { name: 'Dad Portrait', w: 800, h: 1200, g1: '#4a3b32', g2: '#8b6b4f', isPortrait: true, tag: 'Dad' },
    { name: 'Mom Portrait', w: 800, h: 1200, g1: '#543d3b', g2: '#9a7065', isPortrait: true, tag: 'Mom' },
    { name: 'Son 1 Portrait', w: 800, h: 1200, g1: '#5a6245', g2: '#a4ab80', isPortrait: true, tag: 'Son 1' },
    { name: 'Son 2 Portrait', w: 800, h: 1200, g1: '#634b35', g2: '#ba946e', isPortrait: true, tag: 'Son 2' },
    { name: 'White Picket Fence', w: 1400, h: 800, g1: '#2b3a42', g2: '#4f6d7a', isLandscape: true, tag: 'Fence' },
    { name: 'Autumn Street', w: 1400, h: 800, g1: '#633d2e', g2: '#a86544', isLandscape: true, tag: 'Street' },
    { name: 'Irish Coastline', w: 1400, h: 800, g1: '#37474f', g2: '#78909c', isLandscape: true, tag: 'Coast' },
    { name: 'Alpine Ridge', w: 1400, h: 800, g1: '#263238', g2: '#546e7a', isLandscape: true, tag: 'Mountain' },
    { name: 'Solo Laughing Portrait', w: 800, h: 1200, g1: '#423838', g2: '#8d7575', isPortrait: true, tag: 'Solo' },
    { name: 'Candid Walk Portrait', w: 800, h: 1200, g1: '#3e4147', g2: '#7a818c', isPortrait: true, tag: 'Walk' },
    { name: 'Brothers Together', w: 800, h: 1200, g1: '#473d31', g2: '#968168', isPortrait: true, tag: 'Brothers' },
    { name: 'Front Porch Smile', w: 800, h: 1200, g1: '#324b42', g2: '#689686', isPortrait: true, tag: 'Porch' },
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
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(item.w / 2, item.h * 0.35, item.w * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(item.w / 2, item.h * 0.75, item.w * 0.38, item.h * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.tag, item.w / 2, item.h * 0.4);
    } else {
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
      orientation: aspect < 0.88 ? 'vertical' : (aspect > 1.15 ? 'horizontal' : 'square')
    };
  });

  state.photos = generated;
  updateThumbnails();
  partitionPhotosIntoCards();
  showToast('Loaded demo photos with Unfold & Classico templates!');
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
