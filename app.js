/**
 * CreditPulse — Smart Personal Credit & Loan Tracker
 * Vanilla JavaScript Application Logic
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_CREDITS = 'creditpulse_records_v1';
  const STORAGE_KEY_THEME = 'creditpulse_theme';
  const STORAGE_KEY_CURRENCY = 'creditpulse_currency';

  // Helper to create visual demo receipt SVG data URLs
  function createSampleReceiptSVG(title, amount, date, subtitle, color = '#4f46e5') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <rect width="400" height="280" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <rect x="12" y="12" width="376" height="256" rx="12" fill="url(#g)"/>
      <circle cx="200" cy="54" r="24" fill="${color}"/>
      <path d="M190 54 L197 61 L210 47" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="200" y="106" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle" letter-spacing="1">PAYMENT PROOF VERIFIED</text>
      <text x="200" y="146" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="28" font-weight="800" fill="#0f172a" text-anchor="middle">${amount}</text>
      <line x1="40" y1="166" x2="360" y2="166" stroke="#cbd5e1" stroke-dasharray="4 4" stroke-width="1.5"/>
      <text x="50" y="196" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="600" fill="#64748b">TRANSACTION</text>
      <text x="350" y="196" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">${title}</text>
      <text x="50" y="222" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="600" fill="#64748b">DATE / REF</text>
      <text x="350" y="222" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">${date}</text>
      <text x="200" y="254" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">${subtitle}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // --- Initial Starter Demo Data (Available on demand) ---
  const DEMO_DATA = [
    {
      id: 'cp_demo_101',
      type: 'LENT',
      personName: 'Sarah Jenkins',
      amount: 450.00,
      monthlyAmount: 150.00,
      issueDate: getRelativeDateString(-12),
      dueDate: getRelativeDateString(5),
      category: 'Friends & Family',
      contact: '+1 555-0142',
      notes: 'Lent for weekend cabin trip booking. Split into 3 months.',
      documentImg: createSampleReceiptSVG('Cabin Booking Invoice', '$450.00', 'Aug 10', 'Booking Ref #CB-9941', '#0ea5e9'),
      payments: [
        {
          id: 'pay_demo_1',
          amount: 150.00,
          date: getRelativeDateString(-4),
          method: 'Bank Transfer',
          note: 'Installment 1 of 3',
          isEarly: true,
          earlyDays: 9,
          receiptImg: createSampleReceiptSVG('Bank Transfer (Part 1)', '$150.00', 'Aug 28', 'Ref #TRX-441829', '#10b981')
        },
        {
          id: 'pay_demo_2',
          amount: 250.00,
          date: getRelativeDateString(-1),
          method: 'Bank Transfer',
          note: 'Installment 2 of 3 (Advance)',
          isEarly: true,
          earlyDays: 6,
          receiptImg: createSampleReceiptSVG('Bank Transfer (Part 2)', '$250.00', 'Sep 01', 'Ref #TRX-998231', '#10b981')
        }
      ],
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 'cp_demo_102',
      type: 'BORROWED',
      personName: 'Apex Electronics',
      amount: 1200.00,
      monthlyAmount: 400.00,
      issueDate: getRelativeDateString(-25),
      dueDate: getRelativeDateString(15),
      category: 'Shopping & Gadget',
      contact: 'support@apexelectronics.com',
      notes: 'New laptop 3-month installment plan, 0% interest.',
      documentImg: createSampleReceiptSVG('Laptop Store Purchase', '$1,200.00', 'Aug 05', 'Invoice #APEX-882', '#6366f1'),
      payments: [
        {
          id: 'pay_demo_3',
          amount: 400.00,
          date: getRelativeDateString(-10),
          method: 'Credit/Debit Card',
          note: 'Installment 1 of 3',
          isEarly: true,
          earlyDays: 25,
          receiptImg: createSampleReceiptSVG('Card Payment — Installment 1', '$400.00', 'Aug 20', 'Auth Code #884120', '#10b981')
        }
      ],
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
    }
  ];

  // --- State Management ---
  const state = {
    credits: [],
    currency: '₱',
    theme: 'dark',
    filterType: 'ALL',      // ALL | LENT | BORROWED
    filterStatus: 'ALL',    // ALL | ACTIVE | PARTIAL | PAID | OVERDUE
    filterCategory: 'ALL',
    searchQuery: '',
    sortBy: 'date-desc',
    deleteTargetId: null,
    currentPaymentReceiptBase64: null,
    currentCreditDocBase64: null,
    currentActiveProofData: null,
    currentLightboxImgUrl: null,
    pendingProofTarget: { recordId: null, paymentId: null },
    proofModalCurrentRecordId: null,
    proofModalCurrentPaymentId: null,
    proofModalMode: 'all'   // 'all' | 'single'
  };

  // --- Helper Date Calculation ---
  function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  function getPresetDateString(preset) {
    const d = new Date();
    if (preset === 'month-end') {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return lastDay.toISOString().split('T')[0];
    }
    const days = parseInt(preset, 10);
    if (!isNaN(days)) {
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    }
    return getRelativeDateString(0);
  }

  // --- DOM Elements ---
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),
    cloudSyncBadge: document.getElementById('cloudSyncBadge'),
    cloudPulseDot: document.getElementById('cloudPulseDot'),
    cloudSyncText: document.getElementById('cloudSyncText'),
    currencyPrefix: document.getElementById('currencyPrefix'),
    currencyPrefixPaid: document.getElementById('currencyPrefixPaid'),
    currencyPrefixMonthly: document.getElementById('currencyPrefixMonthly'),
    payCurrencyPrefix: document.getElementById('payCurrencyPrefix'),

    // Dashboard Elements
    totalLentAmount: document.getElementById('totalLentAmount'),
    totalLentOriginal: document.getElementById('totalLentOriginal'),
    badgeLentCount: document.getElementById('badgeLentCount'),
    lentProgressFill: document.getElementById('lentProgressFill'),

    totalBorrowedAmount: document.getElementById('totalBorrowedAmount'),
    totalBorrowedOriginal: document.getElementById('totalBorrowedOriginal'),
    badgeBorrowedCount: document.getElementById('badgeBorrowedCount'),
    borrowedProgressFill: document.getElementById('borrowedProgressFill'),

    netBalanceAmount: document.getElementById('netBalanceAmount'),
    netStatusBadge: document.getElementById('netStatusBadge'),
    netBalanceSubtext: document.getElementById('netBalanceSubtext'),

    totalSettledAmount: document.getElementById('totalSettledAmount'),
    totalOverdueCount: document.getElementById('totalOverdueCount'),
    totalMonthlyLent: document.getElementById('totalMonthlyLent'),
    totalMonthlyBorrowed: document.getElementById('totalMonthlyBorrowed'),

    // Controls
    tabAll: document.getElementById('tabAll'),
    tabLent: document.getElementById('tabLent'),
    tabBorrowed: document.getElementById('tabBorrowed'),
    countAll: document.getElementById('countAll'),
    countLent: document.getElementById('countLent'),
    countBorrowed: document.getElementById('countBorrowed'),

    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterStatus: document.getElementById('filterStatus'),
    filterCategory: document.getElementById('filterCategory'),
    sortBy: document.getElementById('sortBy'),
    resultsCount: document.getElementById('resultsCount'),

    // Records Container & Empty State
    recordsContainer: document.getElementById('recordsContainer'),
    emptyState: document.getElementById('emptyState'),
    emptyTitle: document.getElementById('emptyTitle'),
    emptySubtitle: document.getElementById('emptySubtitle'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),

    // Add/Edit Credit Modal
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    creditModal: document.getElementById('creditModal'),
    creditModalTitle: document.getElementById('creditModalTitle'),
    closeCreditModalBtn: document.getElementById('closeCreditModalBtn'),
    cancelCreditModalBtn: document.getElementById('cancelCreditModalBtn'),
    creditForm: document.getElementById('creditForm'),
    creditId: document.getElementById('creditId'),
    creditType: document.getElementById('creditType'),
    personName: document.getElementById('personName'),
    personNameError: document.getElementById('personNameError'),
    itemName: document.getElementById('itemName'),
    itemNameError: document.getElementById('itemNameError'),
    creditAmount: document.getElementById('creditAmount'),
    creditAmountError: document.getElementById('creditAmountError'),
    initialPaid: document.getElementById('initialPaid'),
    initialPaidGroup: document.getElementById('initialPaidGroup'),
    monthlyAmount: document.getElementById('monthlyAmount'),
    installmentTenure: document.getElementById('installmentTenure'),
    issueDate: document.getElementById('issueDate'),
    dueDate: document.getElementById('dueDate'),
    creditCategory: document.getElementById('creditCategory'),
    contactInfo: document.getElementById('contactInfo'),
    creditNotes: document.getElementById('creditNotes'),

    // Initial Document Upload
    creditDocUploadBox: document.getElementById('creditDocUploadBox'),
    creditDocImageInput: document.getElementById('creditDocImageInput'),
    creditDocPlaceholder: document.getElementById('creditDocPlaceholder'),
    creditDocPreviewWrapper: document.getElementById('creditDocPreviewWrapper'),
    creditDocPreviewImg: document.getElementById('creditDocPreviewImg'),
    changeCreditDocBtn: document.getElementById('changeCreditDocBtn'),
    removeCreditDocBtn: document.getElementById('removeCreditDocBtn'),

    // Payment Modal
    paymentModal: document.getElementById('paymentModal'),
    paymentModalTitle: document.getElementById('paymentModalTitle'),
    closePaymentModalBtn: document.getElementById('closePaymentModalBtn'),
    cancelPaymentModalBtn: document.getElementById('cancelPaymentModalBtn'),
    paymentForm: document.getElementById('paymentForm'),
    paymentRecordId: document.getElementById('paymentRecordId'),
    editPaymentId: document.getElementById('editPaymentId'),
    payPersonName: document.getElementById('payPersonName'),
    payTotalAmount: document.getElementById('payTotalAmount'),
    payMonthlyGuideGroup: document.getElementById('payMonthlyGuideGroup'),
    payMonthlyGuideAmount: document.getElementById('payMonthlyGuideAmount'),
    payRemainingAmount: document.getElementById('payRemainingAmount'),
    paymentAmount: document.getElementById('paymentAmount'),
    paymentAmountError: document.getElementById('paymentAmountError'),
    paymentDate: document.getElementById('paymentDate'),
    paymentMethod: document.getElementById('paymentMethod'),
    paymentNote: document.getElementById('paymentNote'),
    nextPaymentDueDate: document.getElementById('nextPaymentDueDate'),
    payMonthlyAmountBtn: document.getElementById('payMonthlyAmountBtn'),
    payAdvance2Btn: document.getElementById('payAdvance2Btn'),
    payFullAmountBtn: document.getElementById('payFullAmountBtn'),
    earlyPaymentNotice: document.getElementById('earlyPaymentNotice'),
    earlyPaymentNoticeText: document.getElementById('earlyPaymentNoticeText'),

    // Receipt Upload in Payment Modal
    receiptUploadBox: document.getElementById('receiptUploadBox'),
    receiptImageInput: document.getElementById('receiptImageInput'),
    receiptPlaceholder: document.getElementById('receiptPlaceholder'),
    receiptPreviewWrapper: document.getElementById('receiptPreviewWrapper'),
    receiptPreviewImg: document.getElementById('receiptPreviewImg'),
    changeReceiptBtn: document.getElementById('changeReceiptBtn'),
    removeReceiptBtn: document.getElementById('removeReceiptBtn'),

    // Proof / Receipt Voucher Modal
    proofModal: document.getElementById('proofModal'),
    proofModalHeaderTitle: document.getElementById('proofModalHeaderTitle'),
    closeProofModalBtn: document.getElementById('closeProofModalBtn'),
    btnModeAllHistory: document.getElementById('btnModeAllHistory'),
    btnModeSinglePayment: document.getElementById('btnModeSinglePayment'),
    receiptVoucherArea: document.getElementById('receiptVoucherArea'),
    voucherDocType: document.getElementById('voucherDocType'),
    voucherRefId: document.getElementById('voucherRefId'),
    voucherDate: document.getElementById('voucherDate'),
    voucherPayer: document.getElementById('voucherPayer'),
    voucherPayeeLabel: document.getElementById('voucherPayeeLabel'),
    voucherPayee: document.getElementById('voucherPayee'),
    voucherPayeeContact: document.getElementById('voucherPayeeContact'),
    voucherAmountHeaderLabel: document.getElementById('voucherAmountHeaderLabel'),
    voucherAmount: document.getElementById('voucherAmount'),
    voucherStatusPill: document.getElementById('voucherStatusPill'),
    voucherItemRow: document.getElementById('voucherItemRow'),
    voucherItemName: document.getElementById('voucherItemName'),
    voucherOriginalAmount: document.getElementById('voucherOriginalAmount'),
    voucherSingleMethodRow: document.getElementById('voucherSingleMethodRow'),
    voucherMethod: document.getElementById('voucherMethod'),
    voucherSingleNoteRow: document.getElementById('voucherSingleNoteRow'),
    voucherNote: document.getElementById('voucherNote'),
    voucherNextDueRow: document.getElementById('voucherNextDueRow'),
    voucherNextDueDate: document.getElementById('voucherNextDueDate'),
    voucherMonthlyRow: document.getElementById('voucherMonthlyRow'),
    voucherMonthlyAmount: document.getElementById('voucherMonthlyAmount'),
    voucherRemainingAmount: document.getElementById('voucherRemainingAmount'),
    voucherHistoryTableSection: document.getElementById('voucherHistoryTableSection'),
    voucherLedgerBody: document.getElementById('voucherLedgerBody'),
    voucherProofSection: document.getElementById('voucherProofSection'),
    voucherProofHeaderTitle: document.getElementById('voucherProofHeaderTitle'),
    attachProofToRecordBtn: document.getElementById('attachProofToRecordBtn'),
    inlineReceiptInput: document.getElementById('inlineReceiptInput'),
    voucherGalleryGrid: document.getElementById('voucherGalleryGrid'),
    copySummaryTextBtn: document.getElementById('copySummaryTextBtn'),
    downloadAllImagesBtn: document.getElementById('downloadAllImagesBtn'),
    shareWhatsappBtn: document.getElementById('shareWhatsappBtn'),
    shareEmailBtn: document.getElementById('shareEmailBtn'),
    saveLongImageBtn: document.getElementById('saveLongImageBtn'),
    printReceiptBtn: document.getElementById('printReceiptBtn'),

    // Lightbox Modal
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxImg: document.getElementById('lightboxImg'),
    copyLightboxImgBtn: document.getElementById('copyLightboxImgBtn'),
    downloadLightboxImgBtn: document.getElementById('downloadLightboxImgBtn'),
    closeLightboxBtn: document.getElementById('closeLightboxBtn'),

    // Details Modal
    detailsModal: document.getElementById('detailsModal'),
    closeDetailsModalBtn: document.getElementById('closeDetailsModalBtn'),
    closeDetailsBtn: document.getElementById('closeDetailsBtn'),
    detailsModalContent: document.getElementById('detailsModalContent'),

    // Data Modal
    dataMenuBtn: document.getElementById('dataMenuBtn'),
    dataModal: document.getElementById('dataModal'),
    closeDataModalBtn: document.getElementById('closeDataModalBtn'),
    doneDataModalBtn: document.getElementById('doneDataModalBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    importFileInput: document.getElementById('importFileInput'),
    loadDemoBtn: document.getElementById('loadDemoBtn'),
    resetAllBtn: document.getElementById('resetAllBtn'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteTargetName: document.getElementById('deleteTargetName'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // --- Firebase Cloud Firestore Configuration ---
  const firebaseConfig = {
    apiKey: "AIzaSyA2bIxR6FBbgHGBy8rzu5jEE4g5FyxELgk",
    authDomain: "gitcredit.firebaseapp.com",
    projectId: "gitcredit",
    storageBucket: "gitcredit.firebasestorage.app",
    messagingSenderId: "872210707513",
    appId: "1:872210707513:web:4060da3df03e211a8b09e8",
    measurementId: "G-Q4Y4XQL405"
  };

  let db = null;
  let isCloudConnected = false;

  function updateCloudStatus(status, text) {
    if (!elements.cloudSyncBadge) return;
    if (elements.cloudSyncText) elements.cloudSyncText.textContent = text;
    if (elements.cloudPulseDot) {
      elements.cloudPulseDot.className = 'cloud-pulse-dot ' + (status === 'syncing' ? 'syncing' : (status === 'offline' ? 'offline' : ''));
    }
    elements.cloudSyncBadge.title = `Firebase Firestore (${firebaseConfig.projectId}): ${text}`;
  }

  function initFirebase() {
    try {
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        isCloudConnected = true;
        updateCloudStatus('connected', 'Cloud Synced');
        setupFirestoreRealtimeListener();
      } else {
        updateCloudStatus('offline', 'Local Mode');
      }
    } catch (e) {
      console.warn('Firebase init:', e);
      updateCloudStatus('offline', 'Local Mode');
    }
  }

  function setupFirestoreRealtimeListener() {
    if (!db) return;
    try {
      db.collection('credits').onSnapshot((snapshot) => {
        const cloudRecords = [];
        snapshot.forEach(doc => {
          cloudRecords.push({ id: doc.id, ...doc.data() });
        });

        // Authoritative Cloud Sync: state matches Firestore exactly
        state.credits = cloudRecords;
        try {
          localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(state.credits));
        } catch (e) {}
        updateCategoryDropdown();
        render();
        updateCloudStatus('connected', 'Cloud Synced');
      }, (error) => {
        console.warn('Firestore snapshot listener:', error);
        updateCloudStatus('offline', 'Local Cache');
      });
    } catch (err) {
      console.warn('Firestore listener setup error:', err);
    }
  }

  async function syncRecordToCloud(rec) {
    if (!db) return;
    try {
      updateCloudStatus('syncing', 'Syncing...');
      await db.collection('credits').doc(rec.id).set(rec);
      updateCloudStatus('connected', 'Cloud Synced');
    } catch (err) {
      console.error('Error syncing record to Firestore:', err);
      updateCloudStatus('offline', 'Local Cache');
    }
  }

  async function deleteRecordFromCloud(recordId) {
    if (!db) return;
    try {
      updateCloudStatus('syncing', 'Syncing...');
      await db.collection('credits').doc(recordId).delete();
      updateCloudStatus('connected', 'Cloud Synced');
    } catch (err) {
      console.error('Error deleting record from Firestore:', err);
      updateCloudStatus('offline', 'Local Cache');
    }
  }

  async function syncAllLocalRecordsToCloud() {
    if (!db || state.credits.length === 0) return;
    try {
      updateCloudStatus('syncing', 'Syncing...');
      const batch = db.batch();
      state.credits.forEach(rec => {
        const ref = db.collection('credits').doc(rec.id);
        batch.set(ref, rec);
      });
      await batch.commit();
      updateCloudStatus('connected', 'Cloud Synced');
    } catch (e) {
      console.warn('Batch sync notice:', e);
    }
  }

  // --- Initialization ---
  function init() {
    loadSettings();
    loadRecords();
    setupEventListeners();
    updateCategoryDropdown();
    render();
    initFirebase();
  }

  // --- Load & Save Settings ---
  function loadSettings() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    setTheme(savedTheme);
    state.currency = '₱';
    updateCurrencyDisplay();
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);

    if (theme === 'dark') {
      elements.themeIconSun.classList.remove('hidden');
      elements.themeIconMoon.classList.add('hidden');
    } else {
      elements.themeIconSun.classList.add('hidden');
      elements.themeIconMoon.classList.remove('hidden');
    }
  }

  function updateCurrencyDisplay() {
    elements.currencyPrefix.textContent = state.currency;
    elements.currencyPrefixPaid.textContent = state.currency;
    if (elements.currencyPrefixMonthly) elements.currencyPrefixMonthly.textContent = state.currency;
    elements.payCurrencyPrefix.textContent = state.currency;
  }

  // --- Records Storage ---
  function loadRecords() {
    const raw = localStorage.getItem(STORAGE_KEY_CREDITS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const userRecords = Array.isArray(parsed) 
          ? parsed.filter(rec => !rec.id.startsWith('cp_101') && !rec.id.startsWith('cp_102') && !rec.id.startsWith('cp_103') && !rec.id.startsWith('cp_104'))
          : [];
        state.credits = userRecords;
        saveRecords();
      } catch (e) {
        console.error('Failed to parse credits from localStorage', e);
        state.credits = [];
        saveRecords();
      }
    } else {
      state.credits = [];
      saveRecords();
    }
  }

  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(state.credits));
    } catch (e) {
      console.error('LocalStorage quota exceeded', e);
      showToast('Storage limit reached! Try removing large image files.', 'error');
    }
    // Sync to Cloud
    if (db) {
      syncAllLocalRecordsToCloud();
    }
  }

  // --- Computations & Calculations ---
  function formatMoney(amount) {
    const num = Number(amount) || 0;
    return `${state.currency}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getTotalPaid(record) {
    if (!record.payments || !Array.isArray(record.payments)) return 0;
    return record.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }

  function getRemainingBalance(record) {
    const total = Number(record.amount) || 0;
    const paid = getTotalPaid(record);
    const rem = total - paid;
    return rem > 0 ? rem : 0;
  }

  function getRecordStatus(record) {
    const remaining = getRemainingBalance(record);
    const paid = getTotalPaid(record);

    if (remaining <= 0.001) {
      return 'PAID';
    }

    if (record.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(record.dueDate + 'T00:00:00');
      if (due < today) {
        return 'OVERDUE';
      }
    }

    if (paid > 0) {
      return 'PARTIAL';
    }

    return 'ACTIVE';
  }

  function getDueDateText(record) {
    if (!record.dueDate) return { text: 'No due date set', className: 'text-muted' };

    const status = getRecordStatus(record);
    if (status === 'PAID') {
      const isSettledEarly = (record.payments || []).some(p => p.isEarly);
      return { 
        text: isSettledEarly ? `✨ Fully settled early!` : `Due date was: ${formatDate(record.dueDate)}`, 
        className: isSettledEarly ? 'text-settled' : 'text-muted' 
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(record.dueDate + 'T00:00:00');
    const diffTime = due - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return {
        text: `⚠️ Overdue by ${days} ${days === 1 ? 'day' : 'days'} (${formatDate(record.dueDate)})`,
        className: 'text-overdue-alert'
      };
    } else if (diffDays === 0) {
      return {
        text: `🚨 Due Today! (${formatDate(record.dueDate)})`,
        className: 'text-due-soon'
      };
    } else if (diffDays === 1) {
      return {
        text: `⏳ Due Tomorrow (${formatDate(record.dueDate)})`,
        className: 'text-due-soon'
      };
    } else if (diffDays <= 7) {
      return {
        text: `📅 Due in ${diffDays} days (${formatDate(record.dueDate)})`,
        className: 'text-due-soon'
      };
    } else {
      return {
        text: `📅 Due: ${formatDate(record.dueDate)}`,
        className: 'text-muted'
      };
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  // Calculate Payoff Stats for a given record
  function calculatePayoffStats(rec) {
    const original = Number(rec.amount) || 0;
    const paid = getTotalPaid(rec);
    const remaining = getRemainingBalance(rec);
    const monthly = Number(rec.monthlyAmount) || 0;
    const isSettled = remaining <= 0.001;

    let remainingMonths = null;
    let estPayoffMonthStr = 'N/A';

    if (!isSettled && monthly > 0) {
      remainingMonths = Math.ceil(remaining / monthly);
      const estDate = new Date();
      estDate.setMonth(estDate.getMonth() + remainingMonths);
      estPayoffMonthStr = estDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }

    const earlyPaymentsList = (rec.payments || []).filter(p => p.isEarly);
    const earlyPaymentsCount = earlyPaymentsList.length;

    return {
      original,
      paid,
      remaining,
      monthly,
      isSettled,
      remainingMonths,
      estPayoffMonthStr,
      earlyPaymentsCount,
      progressPercent: original > 0 ? Math.min(100, (paid / original) * 100) : 0
    };
  }

  // --- Render Dashboard & List ---
  function render() {
    renderDashboard();
    renderRecordsList();
  }

  function renderDashboard() {
    let lentActiveCount = 0;
    let lentRemainingTotal = 0;
    let lentOriginalTotal = 0;
    let sumLentMonthly = 0;

    let borrowedActiveCount = 0;
    let borrowedRemainingTotal = 0;
    let borrowedOriginalTotal = 0;
    let sumBorrowedMonthly = 0;

    let totalSettled = 0;
    let overdueCount = 0;

    let totalLentRecords = 0;
    let totalBorrowedRecords = 0;

    state.credits.forEach(rec => {
      const status = getRecordStatus(rec);
      const remaining = getRemainingBalance(rec);
      const paid = getTotalPaid(rec);
      const original = Number(rec.amount) || 0;
      const monthly = Number(rec.monthlyAmount) || 0;

      totalSettled += paid;

      if (rec.type === 'LENT') {
        totalLentRecords++;
        lentOriginalTotal += original;
        if (status !== 'PAID') {
          lentActiveCount++;
          lentRemainingTotal += remaining;
          if (monthly > 0) sumLentMonthly += Math.min(monthly, remaining);
        }
      } else {
        totalBorrowedRecords++;
        borrowedOriginalTotal += original;
        if (status !== 'PAID') {
          borrowedActiveCount++;
          borrowedRemainingTotal += remaining;
          if (monthly > 0) sumBorrowedMonthly += Math.min(monthly, remaining);
        }
      }

      if (status === 'OVERDUE') {
        overdueCount++;
      }
    });

    elements.countAll.textContent = state.credits.length;
    elements.countLent.textContent = totalLentRecords;
    elements.countBorrowed.textContent = totalBorrowedRecords;

    elements.totalLentAmount.textContent = formatMoney(lentRemainingTotal);
    elements.totalLentOriginal.textContent = formatMoney(lentOriginalTotal);
    elements.badgeLentCount.textContent = `${lentActiveCount} active`;
    const lentPercent = lentOriginalTotal > 0 ? ((lentOriginalTotal - lentRemainingTotal) / lentOriginalTotal) * 100 : 0;
    elements.lentProgressFill.style.width = `${Math.min(100, Math.max(0, lentPercent))}%`;

    elements.totalBorrowedAmount.textContent = formatMoney(borrowedRemainingTotal);
    elements.totalBorrowedOriginal.textContent = formatMoney(borrowedOriginalTotal);
    elements.badgeBorrowedCount.textContent = `${borrowedActiveCount} active`;
    const borrowedPercent = borrowedOriginalTotal > 0 ? ((borrowedOriginalTotal - borrowedRemainingTotal) / borrowedOriginalTotal) * 100 : 0;
    elements.borrowedProgressFill.style.width = `${Math.min(100, Math.max(0, borrowedPercent))}%`;

    const net = lentRemainingTotal - borrowedRemainingTotal;
    elements.netBalanceAmount.textContent = `${net < 0 ? '-' : ''}${formatMoney(Math.abs(net))}`;
    
    if (net > 0) {
      elements.netStatusBadge.textContent = 'Net Positive (+)';
      elements.netStatusBadge.style.color = 'var(--color-lent)';
      elements.netStatusBadge.style.background = 'var(--color-lent-glow)';
      elements.netBalanceSubtext.textContent = 'You are owed more than you owe';
    } else if (net < 0) {
      elements.netStatusBadge.textContent = 'Net Payable (-)';
      elements.netStatusBadge.style.color = 'var(--color-borrowed)';
      elements.netStatusBadge.style.background = 'var(--color-borrowed-glow)';
      elements.netBalanceSubtext.textContent = 'You owe more than you are owed';
    } else {
      elements.netStatusBadge.textContent = 'Balanced';
      elements.netStatusBadge.style.color = 'var(--text-muted)';
      elements.netStatusBadge.style.background = 'var(--bg-secondary)';
      elements.netBalanceSubtext.textContent = 'Lent and Borrowed are equal';
    }

    elements.totalSettledAmount.textContent = formatMoney(totalSettled);
    elements.totalOverdueCount.textContent = `${overdueCount} ${overdueCount === 1 ? 'item' : 'items'}`;
    if (elements.totalMonthlyLent) elements.totalMonthlyLent.textContent = `${formatMoney(sumLentMonthly)}/mo`;
    if (elements.totalMonthlyBorrowed) elements.totalMonthlyBorrowed.textContent = `${formatMoney(sumBorrowedMonthly)}/mo`;
  }

  function getFilteredAndSortedRecords() {
    let list = [...state.credits];

    if (state.filterType !== 'ALL') {
      list = list.filter(r => r.type === state.filterType);
    }

    if (state.filterStatus !== 'ALL') {
      if (state.filterStatus === 'ACTIVE') {
        list = list.filter(r => getRecordStatus(r) !== 'PAID');
      } else {
        list = list.filter(r => getRecordStatus(r) === state.filterStatus);
      }
    }

    if (state.filterCategory !== 'ALL') {
      list = list.filter(r => (r.category || 'Other') === state.filterCategory);
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(r => {
        const name = (r.personName || '').toLowerCase();
        const item = (r.itemName || '').toLowerCase();
        const cat = (r.category || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        const contact = (r.contact || '').toLowerCase();
        return name.includes(q) || item.includes(q) || cat.includes(q) || notes.includes(q) || contact.includes(q);
      });
    }

    list.sort((a, b) => {
      const remA = getRemainingBalance(a);
      const remB = getRemainingBalance(b);
      const dateA = new Date(a.issueDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.issueDate || b.createdAt || 0).getTime();
      const dueA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
      const dueB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;

      switch (state.sortBy) {
        case 'date-desc':
          return dateB - dateA;
        case 'date-asc':
          return dateA - dateB;
        case 'due-asc':
          return dueA - dueB;
        case 'due-desc':
          return dueB - dueA;
        case 'amount-desc':
          return remB - remA;
        case 'amount-asc':
          return remA - remB;
        case 'name-asc':
          return (a.personName || '').localeCompare(b.personName || '');
        default:
          return dateB - dateA;
      }
    });

    return list;
  }

  function renderRecordsList() {
    const list = getFilteredAndSortedRecords();
    elements.recordsContainer.innerHTML = '';

    elements.resultsCount.textContent = `Showing ${list.length} of ${state.credits.length} ${state.credits.length === 1 ? 'record' : 'records'}`;

    if (list.length === 0) {
      elements.emptyState.classList.remove('hidden');
      if (state.credits.length === 0) {
        elements.emptyTitle.textContent = 'No credit records yet';
        elements.emptySubtitle.textContent = 'Start tracking money you’ve lent or borrowed by adding your first record.';
      } else {
        elements.emptyTitle.textContent = 'No matching records';
        elements.emptySubtitle.textContent = 'Try adjusting your search query, status, or category filters.';
      }
      return;
    }

    elements.emptyState.classList.add('hidden');

    list.forEach(rec => {
      const card = createRecordCard(rec);
      elements.recordsContainer.appendChild(card);
    });
  }

  function createRecordCard(rec) {
    const status = getRecordStatus(rec);
    const stats = calculatePayoffStats(rec);
    const dueInfo = getDueDateText(rec);
    const isLent = rec.type === 'LENT';
    const hasDoc = Boolean(rec.documentImg);

    const displayTitle = rec.itemName || rec.personName || 'Credit Loan';
    const initials = (displayTitle)
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const card = document.createElement('div');
    card.className = `record-card type-${isLent ? 'lent' : 'borrowed'}`;
    card.id = `card_${rec.id}`;

    let statusLabel = status;
    if (status === 'ACTIVE') statusLabel = 'Active';
    if (status === 'PARTIAL') statusLabel = 'Partially Paid';
    if (status === 'PAID') statusLabel = 'Settled';
    if (status === 'OVERDUE') statusLabel = 'Overdue';

    card.innerHTML = `
      <div class="record-icon-col">
        <div class="record-avatar" title="${escapeHtml(displayTitle)}">
          ${initials}
        </div>
      </div>

      <div class="record-main-info">
        <div class="record-title-row">
          <span class="record-person" title="${escapeHtml(displayTitle)}">${escapeHtml(displayTitle)}</span>
          <span class="tag-category">${escapeHtml(rec.category || 'General')}</span>
          ${hasDoc ? `<span class="tag-category" style="color:var(--color-primary); border-color:var(--color-primary-glow);">📎 Document</span>` : ''}
          ${stats.earlyPaymentsCount > 0 ? `<span class="early-pay-badge" title="${stats.earlyPaymentsCount} payment(s) made ahead of schedule">⚡ Early Pay (${stats.earlyPaymentsCount})</span>` : ''}
        </div>
        <div class="record-sub-meta">
          <span style="color:var(--text-primary); font-weight:600;">👤 Owed to: ${escapeHtml(rec.personName)}</span>
          <span>&bull; Issued: ${formatDate(rec.issueDate)}</span>
          ${rec.contact ? `<span>&bull; ${escapeHtml(rec.contact)}</span>` : ''}
          ${rec.notes ? `<span class="record-notes-preview" title="${escapeHtml(rec.notes)}">&bull; "${escapeHtml(rec.notes)}"</span>` : ''}
        </div>
      </div>

      <div class="record-amount-col">
        <div class="record-remaining">
          ${stats.remaining <= 0.001 ? formatMoney(0) : formatMoney(stats.remaining)}
        </div>
        <div class="record-original">
          ${status === 'PAID' ? 'Fully Settled' : `of ${formatMoney(stats.original)}`}
        </div>
        ${stats.monthly > 0 && status !== 'PAID' ? `
          <div class="record-monthly-badge" title="Monthly repayment: ${formatMoney(stats.monthly)}/mo — ~${stats.remainingMonths} mos left">
            🗓️ ${formatMoney(stats.monthly)}/mo ${stats.remainingMonths ? `• ~${stats.remainingMonths} mos left` : ''}
          </div>
        ` : ''}
        <div class="record-mini-progress" title="${stats.progressPercent.toFixed(0)}% paid (${formatMoney(stats.paid)} of ${formatMoney(stats.original)})">
          <div class="record-mini-fill ${isLent ? 'lent-fill' : 'borrowed-fill'}" style="width: ${stats.progressPercent}%"></div>
        </div>
      </div>

      <div class="record-status-col">
        <span class="status-badge status-${status.toLowerCase()}">
          ${statusLabel}
        </span>
        <span class="due-info ${dueInfo.className}">
          ${dueInfo.text}
        </span>
      </div>

      <div class="record-actions-col">
        ${status !== 'PAID' ? `
          <button class="btn-action btn-pay" data-action="pay" data-id="${rec.id}" title="Record a payment or pay in advance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Pay
          </button>
        ` : ''}

        <button class="btn-action btn-share" data-action="proof" data-id="${rec.id}" title="View & Send Complete Proof Statement with Images">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
          Proof
        </button>

        <button class="btn-action" data-action="details" data-id="${rec.id}" title="View details and payment history">
          History (${(rec.payments || []).length})
        </button>

        <button class="btn-action btn-action-icon" data-action="edit" data-id="${rec.id}" title="Edit record">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button class="btn-action btn-action-icon" data-action="delete" data-id="${rec.id}" title="Delete record">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    return card;
  }

  function updateCategoryDropdown() {
    const categories = new Set();
    state.credits.forEach(r => {
      if (r.category && r.category.trim()) categories.add(r.category.trim());
    });

    const currentSelected = elements.filterCategory.value;
    elements.filterCategory.innerHTML = '<option value="ALL">All Categories</option>';

    Array.from(categories).sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      elements.filterCategory.appendChild(opt);
    });

    if (categories.has(currentSelected)) {
      elements.filterCategory.value = currentSelected;
    }
  }

  // --- Image Compression & Base64 Converter ---
  function compressImage(file, maxWidth = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleReceiptImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    compressImage(file)
      .then(base64 => {
        state.currentPaymentReceiptBase64 = base64;
        elements.receiptPreviewImg.src = base64;
        elements.receiptPlaceholder.classList.add('hidden');
        elements.receiptPreviewWrapper.classList.remove('hidden');
        showToast('Receipt image attached successfully', 'success');
      })
      .catch(err => {
        console.error('Error loading image', err);
        showToast('Failed to load image', 'error');
      });
  }

  function clearReceiptPreview() {
    state.currentPaymentReceiptBase64 = null;
    elements.receiptPreviewImg.src = '';
    elements.receiptImageInput.value = '';
    elements.receiptPreviewWrapper.classList.add('hidden');
    elements.receiptPlaceholder.classList.remove('hidden');
  }

  function handleCreditDocImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    compressImage(file)
      .then(base64 => {
        state.currentCreditDocBase64 = base64;
        elements.creditDocPreviewImg.src = base64;
        elements.creditDocPlaceholder.classList.add('hidden');
        elements.creditDocPreviewWrapper.classList.remove('hidden');
        showToast('Document image attached successfully', 'success');
      })
      .catch(err => {
        console.error('Error loading document image', err);
        showToast('Failed to load document image', 'error');
      });
  }

  function clearCreditDocPreview() {
    state.currentCreditDocBase64 = null;
    elements.creditDocPreviewImg.src = '';
    elements.creditDocImageInput.value = '';
    elements.creditDocPreviewWrapper.classList.add('hidden');
    elements.creditDocPlaceholder.classList.remove('hidden');
  }

  function handleInlineImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    const { recordId, paymentId } = state.pendingProofTarget;
    const rec = state.credits.find(r => r.id === (recordId || state.proofModalCurrentRecordId));
    if (!rec) return;

    compressImage(file)
      .then(base64 => {
        if (paymentId) {
          const p = (rec.payments || []).find(item => item.id === paymentId);
          if (p) {
            p.receiptImg = base64;
            showToast(`Proof attached to payment of ${formatMoney(p.amount)}`, 'success');
          }
        } else {
          rec.documentImg = base64;
          showToast(`Attached document proof to ${rec.personName}`, 'success');
        }

        saveRecords();
        render();
        renderProofModalContent();
      })
      .catch(err => {
        console.error('Error attaching proof image', err);
        showToast('Failed to attach image', 'error');
      });
  }

  // --- Copy & Download Image Helpers ---
  async function copyImageToClipboard(dataUrl) {
    if (!dataUrl) {
      showToast('No image available to copy', 'error');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (pngBlob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob })
              ]);
              showToast('Image copied to clipboard! Paste directly into WhatsApp/chat.', 'success');
            } catch (err) {
              console.error('Clipboard item write error', err);
              downloadImageFile(dataUrl, 'receipt_image.png');
              showToast('Downloaded receipt image (Clipboard write protected).', 'info');
            }
          }, 'image/png');
        };
        img.src = dataUrl;
      } else {
        downloadImageFile(dataUrl, 'receipt_image.png');
        showToast('Downloaded receipt image', 'info');
      }
    } catch (err) {
      console.error('Copy image error', err);
      downloadImageFile(dataUrl, 'receipt_image.png');
    }
  }

  function downloadImageFile(dataUrl, filename = 'receipt_proof.png') {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadAllReceiptImages() {
    const rec = state.credits.find(r => r.id === state.proofModalCurrentRecordId);
    if (!rec) return;

    const allImages = [];
    if (rec.documentImg) {
      allImages.push({ url: rec.documentImg, name: `${rec.personName}_Initial_Invoice.png` });
    }
    (rec.payments || []).forEach((p, idx) => {
      if (p.receiptImg) {
        allImages.push({ url: p.receiptImg, name: `${rec.personName}_Payment_${idx + 1}_${p.date}.png` });
      }
    });

    if (allImages.length === 0) {
      showToast('No receipt images attached to download', 'info');
      return;
    }

    allImages.forEach((img, i) => {
      setTimeout(() => {
        downloadImageFile(img.url, img.name);
      }, i * 300);
    });

    showToast(`Downloading ${allImages.length} attached receipt images...`, 'success');
  }

  // Generate and Download Continuous Long-Form Statement Image (Zero Page Cuts)
  async function generateLongFormImage() {
    const rec = state.credits.find(r => r.id === state.proofModalCurrentRecordId);
    if (!rec) return;

    showToast('Generating continuous long-form statement image...', 'info');

    const payments = rec.payments || [];
    const isBorrowed = rec.type === 'BORROWED';
    const totalPaid = getTotalPaid(rec);
    const remaining = getRemainingBalance(rec);
    const original = Number(rec.amount) || 0;
    const isPaidInFull = remaining <= 0.001;
    const monthly = Number(rec.monthlyAmount) || 0;

    // Collect all attached proof images
    const images = [];
    if (rec.documentImg) {
      images.push({ url: rec.documentImg, title: 'Initial Agreement / Invoice', date: `Issued: ${formatDate(rec.issueDate)}` });
    }
    payments.forEach((p, i) => {
      if (p.receiptImg) {
        images.push({ 
          url: p.receiptImg, 
          title: `Payment #${i + 1} — ${formatMoney(p.amount)}`, 
          date: `${formatDate(p.date)} • ${p.method || 'Transfer'}${p.isEarly ? ` (⚡ ${p.earlyDays}d early)` : ''}` 
        });
      }
    });

    // Pre-load all images
    const loadedImages = await Promise.all(images.map(item => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ ...item, img, width: img.naturalWidth || 600, height: img.naturalHeight || 400 });
        img.onerror = () => resolve(null);
        img.src = item.url;
      });
    }));
    const validImages = loadedImages.filter(Boolean);

    // Compute dynamic height
    const width = 800;
    let height = 540; // Header + Parties + Banner + Breakdown

    if (payments.length > 0) {
      height += 70 + (payments.length * 36); // Ledger Table
    }

    validImages.forEach(imgData => {
      const availW = width - 72;
      const scale = Math.min((availW - 24) / imgData.width, 360 / imgData.height);
      const renderH = imgData.height * scale;
      height += renderH + 68; // Card header + Image + padding
    });

    height += 60; // Watermark footer

    const canvas = document.createElement('canvas');
    const dpr = 2; // Crisp 2x retina scale
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Document Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Main Statement Container Card
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(16, 16, width - 32, height - 32, 10);
    ctx.fill();
    ctx.stroke();

    let y = 46;

    // Header Logo & Title
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.roundRect(36, y, 32, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CP', 44, y + 21);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('CreditPulse', 78, y + 16);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('COMPLETE PAYMENT STATEMENT & SETTLEMENT PROOF', 78, y + 30);

    // Ref & Date
    ctx.textAlign = 'right';
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`REF: #STMT-${rec.id.slice(-6).toUpperCase()}`, width - 36, y + 16);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Date: ${formatDate(getRelativeDateString(0))}`, width - 36, y + 32);
    ctx.textAlign = 'left';

    y += 54;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(width - 36, y);
    ctx.stroke();

    // Parties Box
    y += 16;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(36, y, width - 72, 60, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('FROM (PAYER):', 50, y + 22);
    ctx.fillText(isBorrowed ? 'TO (CREDITOR):' : 'TO (DEBTOR):', (width / 2) + 20, y + 22);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(isBorrowed ? 'Me (Debtor)' : rec.personName, 50, y + 42);
    ctx.fillText(isBorrowed ? rec.personName : 'Me (Creditor)', (width / 2) + 20, y + 42);

    // Big Amount Highlight Box
    y += 76;
    ctx.fillStyle = isPaidInFull ? '#ecfdf5' : '#fffbeb';
    ctx.strokeStyle = isPaidInFull ? '#a7f3d0' : '#fde68a';
    ctx.beginPath();
    ctx.roundRect(36, y, width - 72, 68, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isPaidInFull ? '#065f46' : '#92400e';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('TOTAL SETTLED TO DATE', 50, y + 22);

    ctx.fillStyle = isPaidInFull ? '#047857' : '#d97706';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(formatMoney(totalPaid), 50, y + 52);

    // Status Badge Pill
    ctx.textAlign = 'right';
    ctx.fillStyle = isPaidInFull ? '#16a34a' : '#d97706';
    ctx.beginPath();
    ctx.roundRect(width - 200, y + 20, 150, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isPaidInFull ? 'FULLY SETTLED ✅' : 'PARTIAL PAYMENT ⏳', width - 60, y + 38);
    ctx.textAlign = 'left';

    // Breakdown Rows
    y += 84;
    const breakdownRows = [
      { label: 'Item / Purpose:', val: rec.itemName || 'Credit Loan', bold: true, color: '#4f46e5' },
      { label: 'Person I Owe (Creditor):', val: rec.personName, bold: true },
      { label: 'Original Credit / Loan:', val: formatMoney(original), bold: true },
      ...(monthly > 0 ? [{ label: 'Monthly Payment Plan:', val: `${formatMoney(monthly)} / month`, color: '#6366f1' }] : []),
      ...(rec.dueDate && !isPaidInFull ? [{ label: 'Next Payment Due Date:', val: formatDate(rec.dueDate), color: '#d97706' }] : []),
      { label: 'Remaining Outstanding Balance:', val: isPaidInFull ? '₱0.00 (CLEARED)' : formatMoney(remaining), bold: true, color: isPaidInFull ? '#16a34a' : '#ef4444' }
    ];

    breakdownRows.forEach((r, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      ctx.fillRect(36, y, width - 72, 28);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText(r.label, 48, y + 18);
      ctx.textAlign = 'right';
      ctx.fillStyle = r.color || '#0f172a';
      ctx.font = r.bold ? 'bold 12px sans-serif' : '12px sans-serif';
      ctx.fillText(r.val, width - 48, y + 18);
      ctx.textAlign = 'left';
      y += 28;
    });

    // Itemized Payment Ledger Table
    if (payments.length > 0) {
      y += 18;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('📋 ITEMIZED PAYMENT HISTORY LOG', 36, y + 12);
      y += 24;

      // Table Header
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(36, y, width - 72, 26);
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Date', 48, y + 17);
      ctx.fillText('Method & Reference', 160, y + 17);
      ctx.fillText('Proof', width - 210, y + 17);
      ctx.textAlign = 'right';
      ctx.fillText('Amount Paid', width - 48, y + 17);
      ctx.textAlign = 'left';
      y += 26;

      payments.forEach((p, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(36, y, width - 72, 34);
        ctx.strokeStyle = '#f1f5f9';
        ctx.strokeRect(36, y, width - 72, 34);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(formatDate(p.date), 48, y + 20);

        ctx.fillStyle = '#475569';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${p.method || 'Transfer'} ${p.note ? '• ' + p.note : ''} ${p.isEarly ? '(⚡ ' + p.earlyDays + 'd early)' : ''}`, 160, y + 20);

        ctx.fillStyle = p.receiptImg ? '#059669' : '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(p.receiptImg ? '🖼️ Attached' : '—', width - 210, y + 20);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`+${formatMoney(p.amount)}`, width - 48, y + 20);
        ctx.textAlign = 'left';

        y += 34;
      });
    }

    // Attached Proof Images (Continuous, Uncut)
    if (validImages.length > 0) {
      y += 22;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`🖼️ ATTACHED PROOF & RECEIPT IMAGES (${validImages.length} FILES)`, 36, y + 12);
      y += 24;

      validImages.forEach(imgData => {
        const availW = width - 72;
        const scale = Math.min((availW - 24) / imgData.width, 340 / imgData.height);
        const renderW = imgData.width * scale;
        const renderH = imgData.height * scale;
        const cardH = renderH + 52;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(36, y, availW, cardH, 8);
        ctx.fill();
        ctx.stroke();

        // Caption header
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(imgData.title, 50, y + 18);
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(imgData.date, 50, y + 33);

        // Draw Proof Image
        const imgX = 36 + ((availW - renderW) / 2);
        const imgY = y + 42;
        ctx.drawImage(imgData.img, imgX, imgY, renderW, renderH);

        y += cardH + 12;
      });
    }

    // Watermark Footer
    y += 12;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Generated with CreditPulse • Smart Credit & Loan Tracker • Verified Settlement Proof', width / 2, y + 14);

    // Download high-resolution PNG
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CreditPulse_LongStatement_${rec.personName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${getRelativeDateString(0)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Long-form statement saved as single continuous image (Zero Page Cuts)!', 'success');
      }
    }, 'image/png');
  }

  // Auto-calculate monthly payment from tenure plan helper
  function updateInstallmentCalculation() {
    const total = parseFloat(elements.creditAmount.value) || 0;
    const initPaid = parseFloat(elements.initialPaid.value) || 0;
    const months = parseInt(elements.installmentTenure.value, 10);

    if (months && months > 0 && total > initPaid) {
      const perMonth = (total - initPaid) / months;
      elements.monthlyAmount.value = perMonth.toFixed(2);
    }
  }

  // Check and update early payment banner
  function checkEarlyPaymentState(rec) {
    if (!rec || !rec.dueDate) {
      elements.earlyPaymentNotice.classList.add('hidden');
      return;
    }

    const payDateVal = elements.paymentDate.value;
    if (!payDateVal) {
      elements.earlyPaymentNotice.classList.add('hidden');
      return;
    }

    const payD = new Date(payDateVal + 'T00:00:00');
    const dueD = new Date(rec.dueDate + 'T00:00:00');
    const diffDays = Math.round((dueD - payD) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      elements.earlyPaymentNoticeText.textContent = `⚡ Paying early! You are ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ahead of the scheduled due date (${formatDate(rec.dueDate)}).`;
      elements.earlyPaymentNotice.classList.remove('hidden');
    } else {
      elements.earlyPaymentNotice.classList.add('hidden');
    }
  }

  // --- Modal Logic ---

  // Add / Edit Modal
  function openCreditModal(editRecordId = null) {
    elements.creditForm.reset();
    clearCreditDocPreview();
    elements.personNameError.textContent = '';
    elements.itemNameError.textContent = '';
    elements.creditAmountError.textContent = '';

    if (editRecordId) {
      const rec = state.credits.find(r => r.id === editRecordId);
      if (!rec) return;

      elements.creditModalTitle.textContent = 'Edit Credit Record';
      elements.creditId.value = rec.id;
      if (elements.creditType) elements.creditType.value = rec.type || 'BORROWED';

      elements.personName.value = rec.personName || '';
      elements.itemName.value = rec.itemName || '';
      elements.creditAmount.value = rec.amount || '';
      elements.monthlyAmount.value = rec.monthlyAmount || '';
      elements.installmentTenure.value = '';
      elements.issueDate.value = rec.issueDate || '';
      elements.dueDate.value = rec.dueDate || '';
      elements.creditCategory.value = rec.category || 'Personal';
      elements.contactInfo.value = rec.contact || '';
      elements.creditNotes.value = rec.notes || '';

      if (rec.documentImg) {
        state.currentCreditDocBase64 = rec.documentImg;
        elements.creditDocPreviewImg.src = rec.documentImg;
        elements.creditDocPlaceholder.classList.add('hidden');
        elements.creditDocPreviewWrapper.classList.remove('hidden');
      }

      elements.initialPaidGroup.classList.add('hidden');
    } else {
      elements.creditModalTitle.textContent = 'Add Credit Record';
      elements.creditId.value = '';
      if (elements.creditType) elements.creditType.value = 'BORROWED';
      elements.personName.value = '';
      elements.itemName.value = '';
      elements.issueDate.value = getRelativeDateString(0);
      elements.dueDate.value = '';
      elements.monthlyAmount.value = '';
      elements.installmentTenure.value = '';
      elements.creditCategory.value = 'Personal';
      elements.initialPaidGroup.classList.remove('hidden');
    }

    elements.creditModal.classList.remove('hidden');
    elements.personName.focus();
  }

  function closeCreditModal() {
    elements.creditModal.classList.add('hidden');
    clearCreditDocPreview();
  }

  function handleSaveCredit(e) {
    e.preventDefault();

    const name = elements.personName.value.trim();
    const item = elements.itemName ? elements.itemName.value.trim() : '';
    const amount = parseFloat(elements.creditAmount.value);
    const monthlyAmountVal = parseFloat(elements.monthlyAmount.value) || null;
    const type = (elements.creditType && elements.creditType.value) ? elements.creditType.value : 'BORROWED';
    const issueDate = elements.issueDate.value;
    const dueDate = elements.dueDate.value || null;
    const category = elements.creditCategory.value;
    const contact = elements.contactInfo.value.trim();
    const notes = elements.creditNotes.value.trim();
    const initialPaidVal = parseFloat(elements.initialPaid.value) || 0;

    let hasError = false;

    if (!name) {
      elements.personNameError.textContent = 'Please enter person or entity name (who you owe)';
      hasError = true;
    } else {
      elements.personNameError.textContent = '';
    }

    if (!item) {
      elements.itemNameError.textContent = 'Please enter item or loan purpose (e.g. PSU, Rent)';
      hasError = true;
    } else {
      elements.itemNameError.textContent = '';
    }

    if (isNaN(amount) || amount <= 0) {
      elements.creditAmountError.textContent = 'Please enter a valid amount greater than 0';
      hasError = true;
    } else {
      elements.creditAmountError.textContent = '';
    }

    if (hasError) return;

    const editId = elements.creditId.value;

    if (editId) {
      const rec = state.credits.find(r => r.id === editId);
      if (rec) {
        rec.personName = name;
        rec.itemName = item;
        rec.amount = amount;
        rec.monthlyAmount = monthlyAmountVal;
        rec.type = type;
        rec.issueDate = issueDate;
        rec.dueDate = dueDate;
        rec.category = category;
        rec.contact = contact;
        rec.notes = notes;
        rec.documentImg = state.currentCreditDocBase64 || null;
        showToast(`Updated record for ${item} (${name})`, 'success');
      }
    } else {
      const newRec = {
        id: 'cp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type,
        personName: name,
        itemName: item,
        amount,
        monthlyAmount: monthlyAmountVal,
        issueDate,
        dueDate,
        category,
        contact,
        notes,
        documentImg: state.currentCreditDocBase64 || null,
        payments: [],
        createdAt: new Date().toISOString()
      };

      if (initialPaidVal > 0) {
        newRec.payments.push({
          id: 'pay_' + Date.now(),
          amount: Math.min(initialPaidVal, amount),
          date: issueDate,
          method: 'Initial Payment',
          note: 'Initial deposit / payment',
          isEarly: false,
          receiptImg: null
        });
      }

      state.credits.unshift(newRec);
      showToast(`Added new ${type === 'LENT' ? 'lent' : 'borrowed'} credit for ${name}`, 'success');
    }

    saveRecords();
    updateCategoryDropdown();
    render();
    closeCreditModal();
  }

  // Payment Modal (New or Edit Existing)
  function openPaymentModal(recordId, editPaymentId = null) {
    const rec = state.credits.find(r => r.id === recordId);
    if (!rec) return;

    elements.paymentForm.reset();
    clearReceiptPreview();
    elements.paymentAmountError.textContent = '';
    elements.paymentRecordId.value = rec.id;
    elements.editPaymentId.value = editPaymentId || '';
    elements.payPersonName.innerHTML = `Owed to: <strong>${escapeHtml(rec.personName)}</strong> ${rec.itemName ? `• <em>(${escapeHtml(rec.itemName)})</em>` : ''}`;
    elements.payTotalAmount.textContent = formatMoney(rec.amount);
    elements.nextPaymentDueDate.value = rec.dueDate || '';

    const monthly = Number(rec.monthlyAmount) || 0;

    // Display Monthly Guide in Banner
    if (monthly > 0) {
      elements.payMonthlyGuideAmount.textContent = `${formatMoney(monthly)}/mo`;
      elements.payMonthlyGuideGroup.classList.remove('hidden');
    } else {
      elements.payMonthlyGuideGroup.classList.add('hidden');
    }

    if (editPaymentId) {
      // Editing existing payment
      const existingPay = (rec.payments || []).find(p => p.id === editPaymentId);
      if (!existingPay) return;

      elements.paymentModalTitle.textContent = 'Edit Payment Entry';
      const otherPaymentsTotal = (rec.payments || []).filter(p => p.id !== editPaymentId).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const remainingBeforeThisPayment = (Number(rec.amount) || 0) - otherPaymentsTotal;
      elements.payRemainingAmount.textContent = formatMoney(remainingBeforeThisPayment);

      elements.paymentAmount.value = existingPay.amount;
      elements.paymentDate.value = existingPay.date;
      elements.paymentMethod.value = existingPay.method || 'Bank Transfer';
      elements.paymentNote.value = existingPay.note || '';

      if (existingPay.receiptImg) {
        state.currentPaymentReceiptBase64 = existingPay.receiptImg;
        elements.receiptPreviewImg.src = existingPay.receiptImg;
        elements.receiptPlaceholder.classList.add('hidden');
        elements.receiptPreviewWrapper.classList.remove('hidden');
      }

      elements.payMonthlyAmountBtn.classList.add('hidden');
      elements.payAdvance2Btn.classList.add('hidden');
    } else {
      // Recording a new payment: starts blank for manual typing
      elements.paymentModalTitle.textContent = 'Record Payment';
      const remaining = getRemainingBalance(rec);
      elements.payRemainingAmount.textContent = formatMoney(remaining);
      elements.paymentDate.value = getRelativeDateString(0);
      elements.paymentAmount.value = ''; // Clean blank input

      // Quick monthly pay & advance buttons available as optional shortcuts
      if (monthly > 0 && remaining > 0) {
        const targetMonthlyPay = Math.min(monthly, remaining);
        elements.payMonthlyAmountBtn.textContent = `Fill Monthly (${formatMoney(targetMonthlyPay)})`;
        elements.payMonthlyAmountBtn.classList.remove('hidden');
        elements.payMonthlyAmountBtn.onclick = () => {
          elements.paymentAmount.value = targetMonthlyPay;
        };

        if (remaining > monthly) {
          const advance2Amount = Math.min(monthly * 2, remaining);
          elements.payAdvance2Btn.textContent = `Fill 2 Mos (${formatMoney(advance2Amount)})`;
          elements.payAdvance2Btn.classList.remove('hidden');
          elements.payAdvance2Btn.onclick = () => {
            elements.paymentAmount.value = advance2Amount;
          };
        } else {
          elements.payAdvance2Btn.classList.add('hidden');
        }
      } else {
        elements.payMonthlyAmountBtn.classList.add('hidden');
        elements.payAdvance2Btn.classList.add('hidden');
      }
    }

    checkEarlyPaymentState(rec);

    elements.paymentModal.classList.remove('hidden');
    elements.paymentAmount.focus();
  }

  function closePaymentModal() {
    elements.paymentModal.classList.add('hidden');
    clearReceiptPreview();
  }

  function handleSavePayment(e) {
    e.preventDefault();
    const recordId = elements.paymentRecordId.value;
    const editPayId = elements.editPaymentId.value;
    const rec = state.credits.find(r => r.id === recordId);
    if (!rec) return;

    const payAmount = parseFloat(elements.paymentAmount.value);
    const payDate = elements.paymentDate.value;
    const payMethod = elements.paymentMethod.value;
    const payNote = elements.paymentNote.value.trim();
    const nextDueDateVal = elements.nextPaymentDueDate.value || null;

    if (isNaN(payAmount) || payAmount <= 0) {
      elements.paymentAmountError.textContent = 'Please enter a valid payment amount greater than 0';
      return;
    }

    if (!rec.payments) rec.payments = [];

    // Max allowed amount check
    let maxAllowed = Number(rec.amount) || 0;
    if (editPayId) {
      const otherPaymentsTotal = rec.payments.filter(p => p.id !== editPayId).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      maxAllowed = maxAllowed - otherPaymentsTotal;
    } else {
      maxAllowed = getRemainingBalance(rec);
    }

    if (payAmount > maxAllowed + 0.0001) {
      elements.paymentAmountError.textContent = `Amount cannot exceed remaining balance of ${formatMoney(maxAllowed)}`;
      return;
    }

    elements.paymentAmountError.textContent = '';

    // Check early payment
    let isEarly = false;
    let earlyDays = 0;
    if (rec.dueDate && payDate) {
      const payD = new Date(payDate + 'T00:00:00');
      const dueD = new Date(rec.dueDate + 'T00:00:00');
      earlyDays = Math.round((dueD - payD) / (1000 * 60 * 60 * 24));
      if (earlyDays > 0) {
        isEarly = true;
      }
    }

    let targetPaymentId = editPayId;

    if (editPayId) {
      // Update existing
      const existingPay = rec.payments.find(p => p.id === editPayId);
      if (existingPay) {
        existingPay.amount = payAmount;
        existingPay.date = payDate;
        existingPay.method = payMethod;
        existingPay.note = payNote;
        existingPay.isEarly = isEarly;
        existingPay.earlyDays = isEarly ? earlyDays : 0;
        if (state.currentPaymentReceiptBase64) {
          existingPay.receiptImg = state.currentPaymentReceiptBase64;
        }
      }
      showToast(`Updated payment of ${formatMoney(payAmount)}`, 'success');
    } else {
      // Add new
      targetPaymentId = 'pay_' + Date.now();
      const newPayment = {
        id: targetPaymentId,
        amount: payAmount,
        date: payDate,
        method: payMethod,
        note: payNote || 'Payment made / received',
        isEarly,
        earlyDays: isEarly ? earlyDays : 0,
        receiptImg: state.currentPaymentReceiptBase64 || null
      };
      rec.payments.push(newPayment);

      const newRemaining = getRemainingBalance(rec);
      if (newRemaining <= 0.001) {
        showToast(`🎉 Fully settled loan for ${rec.personName}! ${isEarly ? '(Paid off early!)' : ''}`, 'success');
      } else if (isEarly) {
        showToast(`⚡ Recorded early payment of ${formatMoney(payAmount)} (${earlyDays} days ahead of due date)!`, 'success');
      } else {
        showToast(`Recorded payment of ${formatMoney(payAmount)} for ${rec.personName}`, 'success');
      }
    }

    const currentRemaining = getRemainingBalance(rec);
    if (currentRemaining > 0.001 && nextDueDateVal) {
      rec.dueDate = nextDueDateVal;
    }

    saveRecords();
    render();
    closePaymentModal();

    // If details modal was open, refresh it
    if (!elements.detailsModal.classList.contains('hidden')) {
      openDetailsModal(rec.id);
    }
  }

  // --- Proof of Payment & All History Statement Modal ---
  function openProofModal(recordId, paymentId = null) {
    closeDetailsModal();
    state.proofModalCurrentRecordId = recordId;
    state.proofModalCurrentPaymentId = paymentId;

    if (paymentId) {
      state.proofModalMode = 'single';
    } else {
      state.proofModalMode = 'all';
    }

    renderProofModalContent();
    elements.proofModal.classList.remove('hidden');
  }

  function renderProofModalContent() {
    const rec = state.credits.find(r => r.id === state.proofModalCurrentRecordId);
    if (!rec) return;

    const payments = rec.payments || [];
    const isAllMode = state.proofModalMode === 'all';
    const isBorrowed = rec.type === 'BORROWED';
    const totalPaid = getTotalPaid(rec);
    const remaining = getRemainingBalance(rec);
    const original = Number(rec.amount) || 0;
    const isPaidInFull = remaining <= 0.001;
    const monthly = Number(rec.monthlyAmount) || 0;

    // Update Mode Tabs
    if (isAllMode) {
      elements.btnModeAllHistory.classList.add('active');
      elements.btnModeSinglePayment.classList.remove('active');
      elements.proofModalHeaderTitle.textContent = 'Complete Payment History & Proof Statement';
      elements.voucherDocType.textContent = 'Complete Payment Statement';
      elements.voucherAmountHeaderLabel.textContent = 'Total Paid To Date';
      elements.voucherAmount.textContent = formatMoney(totalPaid);
      elements.voucherRefId.textContent = `REF: #STMT-${rec.id.slice(-6).toUpperCase()}`;
      elements.voucherDate.textContent = `Date: ${formatDate(getRelativeDateString(0))}`;

      elements.voucherSingleMethodRow.classList.add('hidden');
      elements.voucherSingleNoteRow.classList.add('hidden');

      elements.voucherHistoryTableSection.classList.remove('hidden');
      renderVoucherLedger(payments, rec);

      // Render all receipts + initial document in gallery
      renderVoucherGallery(rec, payments, true);

    } else {
      elements.btnModeAllHistory.classList.remove('active');
      elements.btnModeSinglePayment.classList.add('active');
      elements.proofModalHeaderTitle.textContent = 'Single Payment Receipt Voucher';
      elements.voucherDocType.textContent = 'Official Payment Voucher';

      let activePayment = null;
      if (state.proofModalCurrentPaymentId) {
        activePayment = payments.find(p => p.id === state.proofModalCurrentPaymentId);
      }
      if (!activePayment && payments.length > 0) {
        activePayment = payments[payments.length - 1];
      }

      const payAmount = activePayment ? activePayment.amount : totalPaid;
      const payDate = activePayment ? activePayment.date : (rec.issueDate || getRelativeDateString(0));
      const payMethod = activePayment ? (activePayment.method || 'Bank Transfer') : 'Payment';
      const payNote = activePayment ? (activePayment.note || 'Repayment') : 'Payment made';
      const refCode = activePayment ? ('#CP-' + activePayment.id.slice(-6).toUpperCase()) : ('#CP-' + rec.id.slice(-6).toUpperCase());

      elements.voucherAmountHeaderLabel.textContent = 'Payment Amount Made';
      elements.voucherAmount.textContent = formatMoney(payAmount);
      elements.voucherRefId.textContent = `REF: ${refCode}`;
      elements.voucherDate.textContent = `Date: ${formatDate(payDate)}`;

      elements.voucherSingleMethodRow.classList.remove('hidden');
      elements.voucherMethod.textContent = payMethod;
      elements.voucherSingleNoteRow.classList.remove('hidden');
      elements.voucherNote.textContent = payNote + (activePayment && activePayment.isEarly ? ` (⚡ Paid ${activePayment.earlyDays}d early)` : '');

      elements.voucherHistoryTableSection.classList.add('hidden');

      const singleList = activePayment && activePayment.receiptImg ? [activePayment] : [];
      renderVoucherGallery(rec, singleList, false);
    }

    const payerName = isBorrowed ? 'Me (Debtor)' : escapeHtml(rec.personName);
    const payeeName = isBorrowed ? escapeHtml(rec.personName) : 'Me (Creditor)';
    const payeeContact = rec.contact ? `Contact: ${escapeHtml(rec.contact)}` : '';

    elements.voucherPayer.textContent = payerName;
    elements.voucherPayeeLabel.textContent = isBorrowed ? 'To (Creditor):' : 'To (Debtor):';
    elements.voucherPayee.textContent = payeeName;
    elements.voucherPayeeContact.textContent = payeeContact;

    elements.voucherStatusPill.textContent = isPaidInFull ? 'FULLY SETTLED & PAID' : 'PARTIAL PAYMENT';
    elements.voucherStatusPill.style.background = isPaidInFull ? '#16a34a' : '#d97706';

    elements.voucherOriginalAmount.textContent = formatMoney(original);
    if (elements.voucherItemName) {
      elements.voucherItemName.textContent = rec.itemName || 'Credit Loan';
      elements.voucherItemRow.classList.remove('hidden');
    }
    elements.voucherRemainingAmount.textContent = isPaidInFull ? `${formatMoney(0)} (CLEARED)` : formatMoney(remaining);

    // Next Due Date
    if (!isPaidInFull && rec.dueDate) {
      elements.voucherNextDueRow.classList.remove('hidden');
      elements.voucherNextDueDate.textContent = formatDate(rec.dueDate);
    } else {
      elements.voucherNextDueRow.classList.add('hidden');
    }

    // Monthly Repayment Row
    if (!isPaidInFull && monthly > 0) {
      elements.voucherMonthlyRow.classList.remove('hidden');
      elements.voucherMonthlyAmount.textContent = `${formatMoney(monthly)} / month`;
    } else {
      elements.voucherMonthlyRow.classList.add('hidden');
    }

    // Prepare share text
    const textSummary = generateStatementTextSummary(rec, payments, isAllMode, totalPaid, remaining, isPaidInFull);
    state.currentActiveProofData = {
      record: rec,
      textSummary,
      contact: rec.contact
    };

    setupShareLinks(state.currentActiveProofData);
  }

  function renderVoucherLedger(payments, rec) {
    if (!payments || payments.length === 0) {
      elements.voucherLedgerBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:16px;">No payment transactions recorded yet.</td></tr>`;
      return;
    }

    elements.voucherLedgerBody.innerHTML = payments.map((p, idx) => `
      <tr>
        <td><strong>${formatDate(p.date)}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeHtml(p.method || 'Transfer')} ${p.isEarly ? `<span class="early-pay-badge">⚡ ${p.earlyDays}d early</span>` : ''}</div>
          ${p.note ? `<div style="font-size:0.75rem; color:#64748b;">${escapeHtml(p.note)}</div>` : ''}
        </td>
        <td>
          ${p.receiptImg ? `
            <button type="button" class="voucher-receipt-mini-thumb" data-action="view-receipt-img" data-img="${escapeHtml(p.receiptImg)}" title="Click to view full screenshot">
              <img src="${escapeHtml(p.receiptImg)}" alt="Receipt">
              <span>🖼️ View</span>
            </button>
          ` : `
            <button type="button" class="btn-attach-inline no-print" data-action="attach-payment-receipt" data-rec-id="${rec.id}" data-pay-id="${p.id}" title="Upload receipt screenshot for this payment">
              ➕ Attach
            </button>
          `}
        </td>
        <td style="text-align:right; font-weight:700; color:#15803d;">+${formatMoney(p.amount)}</td>
      </tr>
    `).join('');
  }

  function renderVoucherGallery(rec, paymentsList, includeDoc = true) {
    const images = [];

    if (includeDoc && rec.documentImg) {
      images.push({
        url: rec.documentImg,
        title: 'Initial Agreement / Invoice',
        subtitle: `Issued: ${formatDate(rec.issueDate)}`,
        badge: 'Contract / Invoice'
      });
    }

    (paymentsList || []).forEach((p, idx) => {
      if (p.receiptImg) {
        images.push({
          url: p.receiptImg,
          title: `Payment #${idx + 1} — ${formatMoney(p.amount)}`,
          subtitle: `${formatDate(p.date)} • ${p.method || 'Payment'}${p.isEarly ? ` (⚡ ${p.earlyDays}d early)` : ''}`,
          badge: p.isEarly ? '⚡ Early Payment Receipt' : 'Verified Receipt'
        });
      }
    });

    elements.voucherProofSection.classList.remove('hidden');

    if (images.length === 0) {
      elements.voucherProofHeaderTitle.textContent = 'Attached Proof & Receipt Images';
      elements.voucherGalleryGrid.innerHTML = `
        <div class="gallery-empty-upload-box" id="galleryEmptyUploadTrigger" title="Click to upload a receipt or document screenshot">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <strong style="color:var(--text-primary);">No proof receipt images attached yet</strong>
          <span style="font-size:0.78rem;">Click here to upload and attach proof screenshot</span>
        </div>
      `;
      return;
    }

    elements.voucherProofHeaderTitle.textContent = images.length === 1 
      ? 'Attached Proof & Receipt Image (1 File)'
      : `Attached Proof & Receipt Images (${images.length} Files)`;

    elements.voucherGalleryGrid.innerHTML = images.map((img) => `
      <div class="gallery-receipt-card">
        <div class="gallery-receipt-header">
          <div class="receipt-header-left">
            <span class="receipt-badge">${escapeHtml(img.badge || 'Verified Receipt')}</span>
            <strong class="receipt-card-title">${escapeHtml(img.title)}</strong>
          </div>
          <div class="receipt-header-right">
            <span class="receipt-meta-date">${escapeHtml(img.subtitle)}</span>
          </div>
        </div>
        <div class="gallery-receipt-img-box" data-action="view-receipt-img" data-img="${escapeHtml(img.url)}" title="Click to enlarge image">
          <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.title)}">
        </div>
        <div class="gallery-receipt-actions no-print">
          <button type="button" class="btn-action btn-sm" data-action="view-receipt-img" data-img="${escapeHtml(img.url)}">
            🔍 Fullscreen Zoom
          </button>
          <button type="button" class="btn-action btn-sm" data-action="copy-direct-img" data-img="${escapeHtml(img.url)}">
            📋 Copy Image
          </button>
          <button type="button" class="btn-action btn-sm" data-action="download-direct-img" data-img="${escapeHtml(img.url)}" data-filename="${escapeHtml(img.title.replace(/[^a-zA-Z0-9_-]/g, '_'))}.png">
            💾 Download
          </button>
        </div>
      </div>
    `).join('');
  }

  function generateStatementTextSummary(rec, payments, isAllMode, totalPaid, remaining, isPaidInFull) {
    const isBorrowed = rec.type === 'BORROWED';
    const nextDueInfo = (!isPaidInFull && rec.dueDate) ? `\n📅 Next Due Date: ${formatDate(rec.dueDate)}` : '';
    const monthlyInfo = (!isPaidInFull && rec.monthlyAmount) ? `\n🗓️ Monthly Plan: ${formatMoney(rec.monthlyAmount)} / month` : '';

    if (isAllMode) {
      let itemsList = '';
      if (payments.length > 0) {
        itemsList = '\n\n📋 *Payment History Log:*\n' + payments.map((p, i) => 
          `${i + 1}. ${formatDate(p.date)}: ${formatMoney(p.amount)} via ${p.method || 'Transfer'} (${p.note || 'Paid'})${p.isEarly ? ` [⚡ Paid ${p.earlyDays}d early]` : ''}${p.receiptImg ? ' 🖼️[Receipt Attached]' : ''}`
        ).join('\n');
      }

      const totalImages = (rec.documentImg ? 1 : 0) + payments.filter(p => p.receiptImg).length;

      return `*COMPLETE PAYMENT HISTORY STATEMENT — CreditPulse*\n` +
        `----------------------------------------\n` +
        `👤 ${isBorrowed ? 'Payer: Me' : 'From: ' + rec.personName}\n` +
        `👥 ${isBorrowed ? 'Recipient: ' + rec.personName : 'Recipient: Me'}\n` +
        `💰 Original Amount: ${formatMoney(rec.amount)}\n` +
        `💵 Total Settled To Date: ${formatMoney(totalPaid)}\n` +
        `📊 Remaining Balance: ${isPaidInFull ? '0.00 (Fully Paid ✅)' : formatMoney(remaining)}${monthlyInfo}${nextDueInfo}${itemsList}\n` +
        `----------------------------------------\n` +
        `Status: ${isPaidInFull ? '🎉 FULLY SETTLED' : '⏳ PARTIALLY PAID'}\n` +
        `Proof Attachments: ${totalImages} verified image(s) attached.`;
    } else {
      let activePayment = null;
      if (state.proofModalCurrentPaymentId) {
        activePayment = payments.find(p => p.id === state.proofModalCurrentPaymentId);
      }
      if (!activePayment && payments.length > 0) activePayment = payments[payments.length - 1];

      const amountPaid = activePayment ? activePayment.amount : totalPaid;
      const payDate = activePayment ? formatDate(activePayment.date) : formatDate(getRelativeDateString(0));
      const method = activePayment ? (activePayment.method || 'Bank Transfer') : 'Settlement';
      const note = activePayment && activePayment.note ? `\n📝 Note: ${activePayment.note}` : '';
      const earlyTag = activePayment && activePayment.isEarly ? `\n⚡ Early Payment: Paid ${activePayment.earlyDays} days ahead of schedule!` : '';

      return `*PAYMENT PROOF & RECEIPT — CreditPulse*\n` +
        `----------------------------------------\n` +
        `👤 ${isBorrowed ? 'Payer: Me' : 'From: ' + rec.personName}\n` +
        `👥 ${isBorrowed ? 'Recipient: ' + rec.personName : 'Recipient: Me'}\n` +
        `💵 Amount Paid: ${formatMoney(amountPaid)}\n` +
        `📅 Payment Date: ${payDate}\n` +
        `💳 Method: ${method}${note}${earlyTag}\n` +
        `📊 Remaining Balance: ${isPaidInFull ? '0.00 (Fully Paid ✅)' : formatMoney(remaining)}${monthlyInfo}${nextDueInfo}\n` +
        `----------------------------------------\n` +
        `Status: ${isPaidInFull ? '🎉 FULLY SETTLED' : '⏳ PARTIALLY PAID'}`;
    }
  }

  function setupShareLinks(proofData) {
    if (!proofData) return;
    const text = encodeURIComponent(proofData.textSummary);
    
    let phoneParam = '';
    if (proofData.contact) {
      const cleanPhone = proofData.contact.replace(/[^\d]/g, '');
      if (cleanPhone.length >= 7) {
        phoneParam = `phone=${cleanPhone}&`;
      }
    }

    elements.shareWhatsappBtn.onclick = () => {
      window.open(`https://api.whatsapp.com/send?${phoneParam}text=${text}`, '_blank');
    };

    const emailSubject = encodeURIComponent(`Payment Proof Statement — ${proofData.record.personName} [CreditPulse]`);
    elements.shareEmailBtn.onclick = () => {
      window.location.href = `mailto:${encodeURIComponent(proofData.contact || '')}?subject=${emailSubject}&body=${text}`;
    };
  }

  function closeProofModal() {
    elements.proofModal.classList.add('hidden');
  }

  // Lightbox Modal
  function openLightbox(imgSrc) {
    state.currentLightboxImgUrl = imgSrc;
    elements.lightboxImg.src = imgSrc;
    elements.lightboxModal.classList.remove('hidden');
  }

  function closeLightbox() {
    elements.lightboxModal.classList.add('hidden');
    elements.lightboxImg.src = '';
    state.currentLightboxImgUrl = null;
  }

  // Details Modal (History & Remaining Analytics view)
  function openDetailsModal(recordId) {
    const rec = state.credits.find(r => r.id === recordId);
    if (!rec) return;

    const stats = calculatePayoffStats(rec);
    const status = getRecordStatus(rec);
    const payments = rec.payments || [];
    const dueInfo = getDueDateText(rec);

    let paymentsHtml = '';
    if (payments.length === 0) {
      paymentsHtml = '<p class="text-muted text-sm" style="text-align:center; padding:12px;">No payment logs yet.</p>';
    } else {
      paymentsHtml = payments.slice().reverse().map(p => `
        <div class="payment-log-item">
          <div class="log-meta">
            <strong>${escapeHtml(p.note || 'Payment')} ${p.isEarly ? `<span class="early-pay-badge">⚡ Paid ${p.earlyDays}d early</span>` : ''}</strong>
            <span class="log-date">${formatDate(p.date)} &bull; ${escapeHtml(p.method || 'Payment')}</span>
            ${p.receiptImg ? `
              <button class="receipt-thumb-btn" data-action="view-receipt-img" data-img="${escapeHtml(p.receiptImg)}" title="Click to view attached receipt image">
                🖼️ View Receipt Image
              </button>
            ` : `
              <button class="btn-attach-inline no-print" data-action="attach-payment-receipt" data-rec-id="${rec.id}" data-pay-id="${p.id}" style="margin-top:3px;">
                ➕ Attach Receipt Image
              </button>
            `}
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="log-amount">+${formatMoney(p.amount)}</span>
            <button class="btn-action btn-sm" data-action="edit-payment" data-rec-id="${rec.id}" data-pay-id="${p.id}" title="Edit this payment amount">
              ✏️ Edit
            </button>
            <button class="btn-action btn-sm" data-action="proof-single" data-rec-id="${rec.id}" data-pay-id="${p.id}" title="Send proof for this payment">
              Proof
            </button>
            <button class="btn-action btn-sm text-danger" data-action="delete-payment" data-rec-id="${rec.id}" data-pay-id="${p.id}" title="Remove payment log">
              🗑️
            </button>
          </div>
        </div>
      `).join('');
    }

    elements.detailsModalContent.innerHTML = `
      <!-- Payoff & Remaining Balance Analytics Box -->
      <div class="payoff-stats-box">
        <div class="payoff-stat-card">
          <span class="payoff-stat-label">Remaining Balance</span>
          <span class="payoff-stat-val" style="color:var(--color-primary)">${formatMoney(stats.remaining)}</span>
          <span class="payoff-stat-sub">${stats.isSettled ? '100% Cleared' : `${(100 - stats.progressPercent).toFixed(0)}% to complete`}</span>
        </div>

        <div class="payoff-stat-card">
          <span class="payoff-stat-label">Progress Settled</span>
          <span class="payoff-stat-val text-settled">${stats.progressPercent.toFixed(0)}%</span>
          <span class="payoff-stat-sub">${formatMoney(stats.paid)} of ${formatMoney(stats.original)}</span>
        </div>

        <div class="payoff-stat-card">
          <span class="payoff-stat-label">Remaining Installments</span>
          <span class="payoff-stat-val">${stats.remainingMonths ? `~${stats.remainingMonths} mos` : (stats.isSettled ? '0 (Done)' : 'Flexible')}</span>
          <span class="payoff-stat-sub">${stats.monthly > 0 ? `${formatMoney(stats.monthly)}/mo` : 'No monthly set'}</span>
        </div>

        <div class="payoff-stat-card">
          <span class="payoff-stat-label">Est. Final Payoff</span>
          <span class="payoff-stat-val">${stats.isSettled ? 'Settled ✅' : stats.estPayoffMonthStr}</span>
          <span class="payoff-stat-sub">${stats.earlyPaymentsCount > 0 ? `⚡ ${stats.earlyPaymentsCount} early pay` : 'On schedule'}</span>
        </div>
      </div>

      <div class="details-summary-box">
        <div class="details-summary-item">
          <span>Item / Purpose</span>
          <strong style="color: var(--color-primary)">${escapeHtml(rec.itemName || 'Credit Loan')}</strong>
        </div>
        <div class="details-summary-item">
          <span>Person I Owe (Creditor)</span>
          <strong>${escapeHtml(rec.personName)}</strong>
        </div>
        <div class="details-summary-item">
          <span>Total Original</span>
          <strong>${formatMoney(stats.original)}</strong>
        </div>
        <div class="details-summary-item">
          <span>Remaining Balance</span>
          <strong style="color: var(--color-primary)">${formatMoney(stats.remaining)}</strong>
        </div>
        ${stats.monthly > 0 ? `
          <div class="details-summary-item">
            <span>Monthly Payment Plan</span>
            <strong style="color: var(--color-primary)">${formatMoney(stats.monthly)} / month</strong>
          </div>
        ` : ''}
        <div class="details-summary-item">
          <span>Category</span>
          <strong>${escapeHtml(rec.category || 'General')}</strong>
        </div>
        <div class="details-summary-item">
          <span>Status</span>
          <strong class="status-badge status-${status.toLowerCase()}">${status}</strong>
        </div>
        <div class="details-summary-item" style="grid-column: span 2;">
          <span>Payment Due Date</span>
          <strong class="${dueInfo.className}">${dueInfo.text}</strong>
        </div>
        ${rec.documentImg ? `
          <div class="details-summary-item" style="grid-column: span 2;">
            <span>Attached Document / Invoice</span>
            <button class="receipt-thumb-btn" data-action="view-receipt-img" data-img="${escapeHtml(rec.documentImg)}">
              📄 View Attached Initial Invoice / Agreement
            </button>
          </div>
        ` : ''}
        ${rec.contact ? `
          <div class="details-summary-item" style="grid-column: span 2;">
            <span>Contact Information</span>
            <strong>${escapeHtml(rec.contact)}</strong>
          </div>
        ` : ''}
        ${rec.notes ? `
          <div class="details-summary-item" style="grid-column: span 2;">
            <span>Notes / Terms</span>
            <p class="text-sm text-secondary" style="margin-top:2px;">${escapeHtml(rec.notes)}</p>
          </div>
        ` : ''}
      </div>

      <div class="history-title">
        <span>Payment History Logs (${payments.length})</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span>Total Paid: <strong class="text-settled">${formatMoney(stats.paid)}</strong></span>
          ${payments.length > 0 ? `
            <button class="btn-action btn-share btn-sm" data-action="proof-all" data-rec-id="${rec.id}">
              📤 Send All History Proofs
            </button>
          ` : ''}
        </div>
      </div>

      <div class="payment-history-list" id="paymentHistoryList">
        ${paymentsHtml}
      </div>
    `;

    elements.detailsModal.classList.remove('hidden');
  }

  function closeDetailsModal() {
    elements.detailsModal.classList.add('hidden');
  }

  // Delete Record Modal
  function openDeleteModal(recordId) {
    const rec = state.credits.find(r => r.id === recordId);
    if (!rec) return;

    state.deleteTargetId = recordId;
    elements.deleteTargetName.textContent = rec.personName;
    elements.deleteModal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    state.deleteTargetId = null;
    elements.deleteModal.classList.add('hidden');
  }

  function confirmDelete() {
    if (!state.deleteTargetId) return;
    const targetId = state.deleteTargetId;
    const idx = state.credits.findIndex(r => r.id === targetId);
    if (idx !== -1) {
      const name = state.credits[idx].personName;
      state.credits.splice(idx, 1);
      saveRecords();
      deleteRecordFromCloud(targetId);
      updateCategoryDropdown();
      render();
      showToast(`Deleted credit record for ${name}`, 'info');
    }
    closeDeleteModal();
  }

  // --- Data Management (Export / Import / Reset) ---
  function exportToJson() {
    const dataStr = JSON.stringify(state.credits, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CreditPulse_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported backup with all images as JSON', 'success');
  }

  function exportToCsv() {
    if (state.credits.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = ['ID', 'Type', 'Person Name', 'Category', 'Total Amount', 'Monthly Payment', 'Paid Amount', 'Remaining Balance', 'Status', 'Issue Date', 'Due Date', 'Contact', 'Notes', 'Payments Count', 'Has Document'];
    const rows = state.credits.map(r => {
      const remaining = getRemainingBalance(r);
      const paid = getTotalPaid(r);
      const status = getRecordStatus(r);
      return [
        r.id,
        r.type,
        `"${(r.personName || '').replace(/"/g, '""')}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        r.amount,
        r.monthlyAmount || '',
        paid,
        remaining,
        status,
        r.issueDate || '',
        r.dueDate || '',
        `"${(r.contact || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        (r.payments || []).length,
        Boolean(r.documentImg) ? 'Yes' : 'No'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CreditPulse_Spreadsheet_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported spreadsheet as CSV', 'success');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          state.credits = parsed;
          saveRecords();
          updateCategoryDropdown();
          render();
          showToast(`Successfully imported ${parsed.length} credit records with images`, 'success');
          elements.dataModal.classList.add('hidden');
        } else {
          showToast('Invalid backup file format', 'error');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function loadDemoData() {
    if (confirm('Load sample demonstration data? Your records will be populated with sample entries.')) {
      state.credits = JSON.parse(JSON.stringify(DEMO_DATA));
      saveRecords();
      updateCategoryDropdown();
      render();
      showToast('Loaded demo records with attached receipts', 'success');
      elements.dataModal.classList.add('hidden');
    }
  }

  function resetAllData() {
    if (confirm('WARNING: Are you sure you want to delete ALL credit records, payments, and receipt images? This cannot be undone.')) {
      state.credits = [];
      localStorage.removeItem(STORAGE_KEY_CREDITS);
      if (db) {
        updateCloudStatus('syncing', 'Clearing Cloud...');
        db.collection('credits').get().then(snapshot => {
          const batch = db.batch();
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          return batch.commit();
        }).then(() => {
          updateCloudStatus('connected', 'Cloud Synced');
        }).catch(err => {
          console.warn('Clear firestore notice:', err);
          updateCloudStatus('connected', 'Cloud Synced');
        });
      }
      updateCategoryDropdown();
      render();
      showToast('All credit records and payments have been deleted', 'info');
      elements.dataModal.classList.add('hidden');
    }
  }

  // --- Toast Notification ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', () => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      showToast(`Switched to ${nextTheme} mode`, 'info');
    });

    // Tabs
    [elements.tabAll, elements.tabLent, elements.tabBorrowed].forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        state.filterType = tab.dataset.type;
        renderRecordsList();
      });
    });

    // Search
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        elements.clearSearchBtn.classList.remove('hidden');
      } else {
        elements.clearSearchBtn.classList.add('hidden');
      }
      renderRecordsList();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderRecordsList();
    });

    // Filters & Sorting
    elements.filterStatus.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      renderRecordsList();
    });

    elements.filterCategory.addEventListener('change', (e) => {
      state.filterCategory = e.target.value;
      renderRecordsList();
    });

    elements.sortBy.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderRecordsList();
    });

    // Installment Plan auto-calculator listeners
    elements.installmentTenure.addEventListener('change', updateInstallmentCalculation);
    elements.creditAmount.addEventListener('input', updateInstallmentCalculation);
    elements.initialPaid.addEventListener('input', updateInstallmentCalculation);

    // Payment Date change listener for real-time early pay detection
    elements.paymentDate.addEventListener('change', () => {
      const recordId = elements.paymentRecordId.value;
      const rec = state.credits.find(r => r.id === recordId);
      if (rec) checkEarlyPaymentState(rec);
    });

    // Date Preset Buttons
    document.addEventListener('click', (e) => {
      const presetBtn = e.target.closest('.btn-preset');
      if (!presetBtn) return;
      
      const preset = presetBtn.dataset.preset;
      const targetInputId = presetBtn.dataset.target || 'dueDate';
      const inputEl = document.getElementById(targetInputId);
      if (inputEl) {
        inputEl.value = getPresetDateString(preset);
        showToast(`Date set to ${formatDate(inputEl.value)}`, 'info');
        
        if (targetInputId === 'paymentDate') {
          const recordId = elements.paymentRecordId.value;
          const rec = state.credits.find(r => r.id === recordId);
          if (rec) checkEarlyPaymentState(rec);
        }
      }
    });

    // Modal Triggers
    elements.openAddModalBtn.addEventListener('click', () => openCreditModal());
    elements.emptyAddBtn.addEventListener('click', () => openCreditModal());
    elements.closeCreditModalBtn.addEventListener('click', closeCreditModal);
    elements.cancelCreditModalBtn.addEventListener('click', closeCreditModal);
    elements.creditForm.addEventListener('submit', handleSaveCredit);

    // Initial Document Upload Handlers
    elements.creditDocUploadBox.addEventListener('click', (e) => {
      if (e.target !== elements.removeCreditDocBtn && e.target !== elements.changeCreditDocBtn) {
        elements.creditDocImageInput.click();
      }
    });

    elements.changeCreditDocBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.creditDocImageInput.click();
    });

    elements.removeCreditDocBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearCreditDocPreview();
    });

    elements.creditDocImageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleCreditDocImageSelect(e.target.files[0]);
      }
    });

    // Payment Modal
    elements.closePaymentModalBtn.addEventListener('click', closePaymentModal);
    elements.cancelPaymentModalBtn.addEventListener('click', closePaymentModal);
    elements.paymentForm.addEventListener('submit', handleSavePayment);
    elements.payFullAmountBtn.addEventListener('click', () => {
      const recordId = elements.paymentRecordId.value;
      const editPayId = elements.editPaymentId.value;
      const rec = state.credits.find(r => r.id === recordId);
      if (rec) {
        if (editPayId) {
          const otherPaymentsTotal = (rec.payments || []).filter(p => p.id !== editPayId).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          elements.paymentAmount.value = Math.max(0, (Number(rec.amount) || 0) - otherPaymentsTotal);
        } else {
          elements.paymentAmount.value = getRemainingBalance(rec);
        }
      }
    });

    // Receipt Upload in Payment Modal
    elements.receiptUploadBox.addEventListener('click', (e) => {
      if (e.target !== elements.removeReceiptBtn && e.target !== elements.changeReceiptBtn) {
        elements.receiptImageInput.click();
      }
    });

    elements.changeReceiptBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.receiptImageInput.click();
    });

    elements.removeReceiptBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearReceiptPreview();
    });

    elements.receiptImageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleReceiptImageSelect(e.target.files[0]);
      }
    });

    // Drag and drop receipt image
    elements.receiptUploadBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.receiptUploadBox.style.borderColor = 'var(--color-primary)';
    });

    elements.receiptUploadBox.addEventListener('dragleave', () => {
      elements.receiptUploadBox.style.borderColor = '';
    });

    elements.receiptUploadBox.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.receiptUploadBox.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleReceiptImageSelect(e.dataTransfer.files[0]);
      }
    });

    // Proof Voucher Mode Switcher (All History vs Single Payment)
    elements.btnModeAllHistory.addEventListener('click', () => {
      state.proofModalMode = 'all';
      renderProofModalContent();
    });

    elements.btnModeSinglePayment.addEventListener('click', () => {
      state.proofModalMode = 'single';
      renderProofModalContent();
    });

    // Attach Proof from Voucher / Gallery triggers
    elements.attachProofToRecordBtn.addEventListener('click', () => {
      state.pendingProofTarget = { recordId: state.proofModalCurrentRecordId, paymentId: null };
      elements.inlineReceiptInput.click();
    });

    elements.inlineReceiptInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleInlineImageSelect(e.target.files[0]);
      }
      e.target.value = '';
    });

    // Proof Voucher Modal Handlers
    elements.closeProofModalBtn.addEventListener('click', closeProofModal);
    elements.copySummaryTextBtn.addEventListener('click', () => {
      if (state.currentActiveProofData && state.currentActiveProofData.textSummary) {
        navigator.clipboard.writeText(state.currentActiveProofData.textSummary)
          .then(() => showToast('Summary copied to clipboard!', 'success'))
          .catch(() => showToast('Failed to copy to clipboard', 'error'));
      }
    });

    elements.downloadAllImagesBtn.addEventListener('click', downloadAllReceiptImages);
    if (elements.saveLongImageBtn) {
      elements.saveLongImageBtn.addEventListener('click', generateLongFormImage);
    }

    elements.printReceiptBtn.addEventListener('click', () => {
      window.print();
    });

    // Lightbox Handlers
    elements.closeLightboxBtn.addEventListener('click', closeLightbox);
    elements.copyLightboxImgBtn.addEventListener('click', () => {
      if (state.currentLightboxImgUrl) {
        copyImageToClipboard(state.currentLightboxImgUrl);
      }
    });
    elements.downloadLightboxImgBtn.addEventListener('click', () => {
      if (state.currentLightboxImgUrl) {
        downloadImageFile(state.currentLightboxImgUrl, 'receipt_proof.png');
        showToast('Downloaded receipt image', 'success');
      }
    });
    elements.lightboxModal.addEventListener('click', (e) => {
      if (e.target === elements.lightboxModal) closeLightbox();
    });

    // Details Modal
    elements.closeDetailsModalBtn.addEventListener('click', closeDetailsModal);
    elements.closeDetailsBtn.addEventListener('click', closeDetailsModal);

    // Data Modal
    elements.dataMenuBtn.addEventListener('click', () => elements.dataModal.classList.remove('hidden'));
    elements.closeDataModalBtn.addEventListener('click', () => elements.dataModal.classList.add('hidden'));
    elements.doneDataModalBtn.addEventListener('click', () => elements.dataModal.classList.add('hidden'));
    elements.exportJsonBtn.addEventListener('click', exportToJson);
    elements.exportCsvBtn.addEventListener('click', exportToCsv);
    elements.importFileInput.addEventListener('change', handleImportFile);
    elements.loadDemoBtn.addEventListener('click', loadDemoData);
    elements.resetAllBtn.addEventListener('click', resetAllData);

    // Delete Modal
    elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);

    // Delegated clicks on records list
    elements.recordsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'pay') {
        openPaymentModal(id);
      } else if (action === 'proof') {
        openProofModal(id, null);
      } else if (action === 'edit') {
        openCreditModal(id);
      } else if (action === 'delete') {
        openDeleteModal(id);
      } else if (action === 'details') {
        openDetailsModal(id);
      }
    });

    // Delegated clicks inside details modal, voucher table, and gallery
    document.addEventListener('click', (e) => {
      // Gallery Empty Box trigger
      if (e.target.closest('#galleryEmptyUploadTrigger')) {
        state.pendingProofTarget = { recordId: state.proofModalCurrentRecordId, paymentId: null };
        elements.inlineReceiptInput.click();
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'edit-payment') {
        const recId = btn.dataset.recId;
        const payId = btn.dataset.payId;
        openPaymentModal(recId, payId);
      } else if (action === 'delete-payment') {
        const recId = btn.dataset.recId;
        const payId = btn.dataset.payId;
        const rec = state.credits.find(r => r.id === recId);
        if (!rec || !rec.payments) return;

        if (confirm('Delete this payment log entry?')) {
          rec.payments = rec.payments.filter(p => p.id !== payId);
          saveRecords();
          render();
          openDetailsModal(recId);
          showToast('Payment log deleted', 'info');
        }
      } else if (action === 'proof-single') {
        const recId = btn.dataset.recId;
        const payId = btn.dataset.payId;
        closeDetailsModal();
        openProofModal(recId, payId);
      } else if (action === 'proof-all') {
        const recId = btn.dataset.recId;
        closeDetailsModal();
        openProofModal(recId, null);
      } else if (action === 'attach-payment-receipt') {
        const recId = btn.dataset.recId;
        const payId = btn.dataset.payId;
        state.pendingProofTarget = { recordId: recId, paymentId: payId };
        elements.inlineReceiptInput.click();
      } else if (action === 'view-receipt-img') {
        const imgSrc = btn.dataset.img;
        if (imgSrc) openLightbox(imgSrc);
      } else if (action === 'copy-direct-img') {
        const imgSrc = btn.dataset.img;
        if (imgSrc) copyImageToClipboard(imgSrc);
      } else if (action === 'download-direct-img') {
        const imgSrc = btn.dataset.img;
        const filename = btn.dataset.filename || 'receipt_proof.png';
        if (imgSrc) {
          downloadImageFile(imgSrc, filename);
          showToast('Downloaded receipt image', 'success');
        }
      }
    });

    // Close Modals on backdrop click or ESC key
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => {
          modal.classList.add('hidden');
        });
      }
    });
  }

  // Start the application
  document.addEventListener('DOMContentLoaded', init);

})();
