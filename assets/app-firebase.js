
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { seedCategories, seedItems } from './seed-data.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const PAGE = document.body.dataset.page;
const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' }
];
const state = {
  lang: localStorage.getItem('taste_lang') || 'en',
  category: 'all',
  search: '',
  categories: [],
  items: [],
  cart: [],
  currentUser: null,
  currentProfile: null,
  boardOrders: [],
  soundEnabled: localStorage.getItem('taste_board_sound') !== 'off',
  lastPendingKey: '',
  userDrafts: [],
  menuSource: 'firestore',
  menuNotice: ''
};

let app = null;
let auth = null;
let db = null;
let menuUnsub = null;
let boardUnsub = null;
let boardAlarmTimer = null;
let boardAlarmRunning = false;

const EMPLOYEE_EMAIL_DOMAIN = `employee.${(firebaseConfig?.projectId || 'menu').toLowerCase()}.local`;
function normalizeEmployeeId(input='') {
  return String(input).trim().replace(/\s+/g, '').toUpperCase();
}
function employeeIdToEmail(employeeId='') {
  const normalized = normalizeEmployeeId(employeeId);
  if (!normalized) return '';
  return `${normalized.toLowerCase()}@${EMPLOYEE_EMAIL_DOMAIN}`;
}
function looksLikeEmail(input='') {
  return String(input).includes('@');
}
function credentialToEmail(loginInput='') {
  const value = String(loginInput).trim();
  return looksLikeEmail(value) ? value : employeeIdToEmail(value);
}
function employeeIdFromEmail(email='') {
  const [localPart='', domain=''] = String(email).toLowerCase().split('@');
  if (domain !== EMPLOYEE_EMAIL_DOMAIN.toLowerCase()) return '';
  return localPart.toUpperCase();
}
function currentEmployeeId() {
  return state.currentProfile?.employeeId || employeeIdFromEmail(state.currentUser?.email || '');
}
function currentUserLabel(fallback='User') {
  return state.currentProfile?.displayName || currentEmployeeId() || state.currentUser?.email || fallback;
}

function qs(id) { return document.getElementById(id); }
function escapeHtml(str='') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function slugify(input='') {
  return String(input).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}
function showToast(message, variant='normal') {
  let el = document.querySelector('.global-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'global-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.dataset.variant = variant;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2600);
}
function sortCategories(list) {
  return [...list]
    .filter(c => c.id !== 'all')
    .sort((a,b)=> (a.sortOrder||0)-(b.sortOrder||0));
}
function sortItems(list, categories) {
  const catOrder = Object.fromEntries(sortCategories(categories).map((c, idx) => [c.id, c.sortOrder ?? idx+1]));
  return [...list].sort((a,b) => {
    const diffCat = (catOrder[a.categoryId] || 999) - (catOrder[b.categoryId] || 999);
    if (diffCat !== 0) return diffCat;
    const diffSort = (a.sortOrder || 0) - (b.sortOrder || 0);
    if (diffSort !== 0) return diffSort;
    return displayName(a).localeCompare(displayName(b));
  });
}
function getDisplay(item, lang=state.lang) {
  const name = item[`name_${lang}`] || item.name_en || '';
  const desc = item[`desc_${lang}`] || item.desc_en || '';
  return { name, desc };
}
function displayName(item, lang=state.lang) {
  return getDisplay(item, lang).name;
}
function displayDesc(item, lang=state.lang) {
  return getDisplay(item, lang).desc;
}
function getMenuImage(item) {
  return item.imageUrl || `assets/menu/${item.id}.png`;
}
function formatCurrency(v=0) {
  return `THB ${Number(v || 0).toLocaleString()}`;
}
function formatDateTime(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString('en-GB', { hour12: false });
}
function orderNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const rand = String(Math.floor(Math.random()*9000)+1000);
  return `ORD-${y}${m}${d}-${rand}`;
}
function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.price)||0) * (Number(item.qty)||0), 0);
}
function byId(collectionName, id) {
  return doc(db, collectionName, id);
}
function addConfigNotice() {
  return;
}
function setLang(lang) {
  state.lang = lang;
  localStorage.setItem('taste_lang', lang);
  renderPage();
}
function renderLangSwitch(el) {
  if (!el) return;
  el.innerHTML = LANGS.map(lang => `
    <button class="chip ${lang.code === state.lang ? 'active' : ''}" data-lang="${lang.code}">${lang.label}</button>
  `).join('');
  el.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
}
function mergedCategories() {
  return [{ id:'all', name_en:'All', name_zh:'全部', name_ru:'Все', sortOrder:0 }, ...sortCategories(state.categories)];
}
function filteredItems() {
  return sortItems(state.items, state.categories).filter(item => {
    const activeOk = item.isActive !== false && item.hidden !== true;
    const categoryOk = state.category === 'all' || item.categoryId === state.category;
    const search = state.search.trim().toLowerCase();
    if (!activeOk || !categoryOk) return false;
    if (!search) return true;
    const hay = [item.name_en, item.name_zh, item.name_ru, item.desc_en, item.desc_zh, item.desc_ru].join(' ').toLowerCase();
    return hay.includes(search);
  });
}
function renderCategoryTabs(el) {
  if (!el) return;
  el.innerHTML = mergedCategories().map(cat => `
    <button class="chip ${state.category === cat.id ? 'active' : ''}" data-category="${cat.id}">
      ${escapeHtml(cat[`name_${state.lang}`] || cat.name_en || cat.id)}
    </button>
  `).join('');
  el.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      renderPage();
    });
  });
}
function menuCard(item, options={}) {
  const { name, desc } = getDisplay(item);
  const addControls = options.staff === true;
  const qty = state.cart.find(x => x.itemId === item.id)?.qty || 0;
  const soldOutBadge = item.soldOut ? `<span class="tag">Sold Out</span>` : '';
  return `
    <article class="menu-card card">
      <div class="menu-thumb has-image">
        <img src="${escapeHtml(getMenuImage(item))}" alt="${escapeHtml(name)}" loading="lazy" />
      </div>
      <div class="menu-meta">
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(desc)}</p>
      </div>
      <div class="price-row">
        <strong class="price">${formatCurrency(item.price)}</strong>
        <div class="tag-row">${soldOutBadge}</div>
      </div>
      <div class="menu-actions">
        <button class="btn small secondary" data-view-item="${item.id}">View Detail</button>
        ${addControls ? `
          <div class="qty-control">
            <button class="btn tiny ghost" ${item.soldOut ? 'disabled' : ''} data-cart-minus="${item.id}">−</button>
            <span class="qty-badge">${qty}</span>
            <button class="btn tiny" ${item.soldOut ? 'disabled' : ''} data-cart-plus="${item.id}">+</button>
          </div>
          <button class="btn tiny ghost" ${item.soldOut ? 'disabled' : ''} data-note-item="${item.id}">Add Note</button>
        ` : ''}
      </div>
    </article>
  `;
}
function attachMenuActions(root) {
  root.querySelectorAll('[data-view-item]').forEach(btn => btn.addEventListener('click', () => openMenuModal(btn.dataset.viewItem)));
  root.querySelectorAll('[data-cart-plus]').forEach(btn => btn.addEventListener('click', () => adjustCart(btn.dataset.cartPlus, 1)));
  root.querySelectorAll('[data-cart-minus]').forEach(btn => btn.addEventListener('click', () => adjustCart(btn.dataset.cartMinus, -1)));
  root.querySelectorAll('[data-note-item]').forEach(btn => btn.addEventListener('click', () => openNoteModal(btn.dataset.noteItem)));
}
function openMenuModal(itemId) {
  const item = state.items.find(x => x.id === itemId);
  const modal = qs('menuModal');
  if (!item || !modal) return;
  const { name, desc } = getDisplay(item);
  modal.innerHTML = `
    <div class="modal-card">
      <div class="menu-thumb detail-thumb has-image">
        <img src="${escapeHtml(getMenuImage(item))}" alt="${escapeHtml(name)}" />
      </div>
      <h2>${escapeHtml(name)}</h2>
      <p>${escapeHtml(desc)}</p>
      <div class="notice" style="margin-top:14px">${formatCurrency(item.price)}</div>
      <div class="form-actions">
        <button class="btn" data-close-modal>Close</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModals);
  modal.addEventListener('click', evt => { if (evt.target === modal) closeModals(); }, { once:true });
}
function closeModals() {
  document.querySelectorAll('.modal').forEach(m => {
    if (m.id !== 'staffLoginModal' && m.id !== 'boardLoginModal' && m.id !== 'adminLoginModal') {
      m.classList.add('hidden');
      m.innerHTML = '';
    }
  });
}
function adjustCart(itemId, delta) {
  const item = state.items.find(x => x.id === itemId);
  if (!item || item.soldOut) return;
  const found = state.cart.find(x => x.itemId === itemId);
  if (!found && delta > 0) {
    state.cart.push({
      itemId: item.id,
      name_en: item.name_en,
      name_zh: item.name_zh,
      name_ru: item.name_ru,
      price: item.price,
      qty: 1,
      lineComment: ''
    });
  } else if (found) {
    found.qty += delta;
    if (found.qty <= 0) state.cart = state.cart.filter(x => x.itemId !== itemId);
  }
  renderPage();
}
function openNoteModal(itemId) {
  const modal = qs('noteModal');
  const cartItem = state.cart.find(x => x.itemId === itemId) || (() => {
    adjustCart(itemId, 1);
    return state.cart.find(x => x.itemId === itemId);
  })();
  if (!modal || !cartItem) return;
  modal.innerHTML = `
    <div class="modal-card small">
      <h2>${escapeHtml(displayName(cartItem))}</h2>
      <p>เพิ่มคอมเมนต์เฉพาะรายการ</p>
      <div class="form-grid" style="grid-template-columns:1fr">
        <label class="full">
          <span>Item Note</span>
          <textarea id="lineCommentInput" rows="4" placeholder="no onion / less spicy / no peanuts">${escapeHtml(cartItem.lineComment || '')}</textarea>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn ghost" data-close-modal>Cancel</button>
        <button class="btn primary" id="saveLineCommentBtn">Save</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModals);
  qs('saveLineCommentBtn').addEventListener('click', () => {
    cartItem.lineComment = qs('lineCommentInput').value.trim();
    closeModals();
    renderPage();
  });
}
function renderGuest() {
  renderLangSwitch(qs('guestLanguageSwitch'));
  renderCategoryTabs(qs('guestCategoryTabs'));
  const search = qs('guestSearch');
  if (search) {
    search.value = state.search;
    search.oninput = () => {
      state.search = search.value;
      renderGuest();
    };
  }
  const grid = qs('guestMenuGrid');
  if (!grid) return;
  const items = filteredItems();
  const itemsHtml = items.length ? items.map(item => menuCard(item)).join('') : `<div class="empty-state">No menu items</div>`;
  grid.innerHTML = itemsHtml;
  attachMenuActions(grid);
  const call = qs('callStaffBtn');
  if (call) call.onclick = () => showToast('Please call staff / 请呼叫服务员 / Пожалуйста, позовите официанта');
}
function renderCart() {
  const meta = qs('cartMeta');
  const itemsEl = qs('cartItems');
  const subtotalEl = qs('cartSubtotal');
  if (!meta || !itemsEl || !subtotalEl) return;
  const seat = qs('seatNo')?.value || '-';
  const room = qs('roomNo')?.value || '-';
  const guests = qs('guestCount')?.value || '1';
  const payment = qs('paymentType')?.value || 'cash';
  meta.innerHTML = `
    <div class="meta-row"><span>Seat</span><strong>${escapeHtml(seat)}</strong></div>
    <div class="meta-row"><span>Room</span><strong>${escapeHtml(room || '-')}</strong></div>
    <div class="meta-row"><span>Guests</span><strong>${escapeHtml(guests)}</strong></div>
    <div class="meta-row"><span>Payment</span><strong>${escapeHtml(payment)}</strong></div>
  `;
  itemsEl.innerHTML = state.cart.length ? state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-row">
        <strong>${escapeHtml(displayName(item))}</strong>
        <span>${item.qty} x ${formatCurrency(item.price)}</span>
      </div>
      ${item.lineComment ? `<small>${escapeHtml(item.lineComment)}</small>` : ''}
      <div class="menu-actions" style="margin-top:8px">
        <button class="btn tiny ghost" data-cart-minus="${item.itemId}">−</button>
        <button class="btn tiny" data-cart-plus="${item.itemId}">+</button>
        <button class="btn tiny ghost" data-note-item="${item.itemId}">Edit Note</button>
      </div>
    </div>
  `).join('') : '<div class="empty-state">No items yet</div>';
  attachMenuActions(itemsEl);
  subtotalEl.textContent = formatCurrency(calcSubtotal(state.cart));
}
function renderStaff() {
  renderLangSwitch(qs('staffLanguageSwitch'));
  renderCategoryTabs(qs('staffCategoryTabs'));
  const search = qs('staffSearch');
  if (search) {
    search.value = state.search;
    search.oninput = () => {
      state.search = search.value;
      renderStaff();
    };
  }
  const grid = qs('staffMenuGrid');
  const items = filteredItems();
  const itemsHtml = items.length ? items.map(item => menuCard(item, { staff:true })).join('') : `<div class="empty-state">No menu items</div>`;
  grid.innerHTML = itemsHtml;
  attachMenuActions(grid);
  renderCart();
  qs('clearCartBtn').onclick = () => {
    state.cart = [];
    renderStaff();
  };
  qs('sendOrderBtn').onclick = sendOrderToBoard;
}
async function sendOrderToBoard() {
  const seatNo = qs('seatNo').value.trim();
  const roomNo = qs('roomNo').value.trim();
  const guestCount = Number(qs('guestCount').value || 1);
  const paymentType = qs('paymentType').value;
  const generalComment = qs('generalComment').value.trim();
  if (!seatNo) return showToast('กรุณาใส่ Table / Seat', 'danger');
  if (!state.cart.length) return showToast('กรุณาเลือกเมนูอย่างน้อย 1 รายการ', 'danger');
  const payload = {
    orderNo: orderNo(),
    status: 'sent',
    outletId: 'the-taste',
    seatNo,
    tableNo: seatNo,
    roomNo,
    guestCount,
    paymentType,
    paymentConfirmed: false,
    generalComment,
    languageUsed: state.lang,
    createdByUid: state.currentUser.uid,
    createdByName: currentUserLabel('Staff'),
    createdByEmail: state.currentUser.email || employeeIdToEmail(currentEmployeeId()) || '',
    createdByEmployeeId: currentEmployeeId() || '',
    acknowledgedByUid: null,
    acknowledgedByName: null,
    acknowledgedAt: null,
    keyedByUid: null,
    keyedByName: null,
    keyedAt: null,
    closedByUid: null,
    closedByName: null,
    closedAt: null,
    soundAlertActive: true,
    newBadge: true,
    subtotal: calcSubtotal(state.cart),
    items: state.cart.map(item => ({
      itemId: item.itemId,
      name_en: item.name_en,
      name_zh: item.name_zh,
      name_ru: item.name_ru,
      price: item.price,
      qty: item.qty,
      lineComment: item.lineComment || '',
      lineTotal: item.qty * item.price
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  try {
    await addDoc(collection(db, 'orders'), payload);
    showToast('ส่งขึ้นบอร์ดแล้ว', 'success');
    state.cart = [];
    qs('generalComment').value = '';
    renderStaff();
  } catch (err) {
    console.error(err);
    showToast('ส่ง order ไม่สำเร็จ', 'danger');
  }
}
function beep(times = 2) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    for (let i=0; i<times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i % 2 === 0 ? 880 : 740;
      gain.gain.setValueAtTime(0.0001, now + i * 0.38);
      gain.gain.exponentialRampToValueAtTime(0.16, now + i * 0.38 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.38 + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.38);
      osc.stop(now + i * 0.38 + 0.30);
    }
    setTimeout(() => {
      try { ctx.close(); } catch (_) {}
    }, Math.max(1200, times * 420));
  } catch (err) {
    console.warn('beep failed', err);
  }
}

function stopBoardAlarmLoop() {
  if (boardAlarmTimer) {
    clearTimeout(boardAlarmTimer);
    boardAlarmTimer = null;
  }
  boardAlarmRunning = false;
}

function startBoardAlarmLoop() {
  if (boardAlarmRunning || !state.soundEnabled) return;
  boardAlarmRunning = true;

  const tick = () => {
    const hasPendingAlarm = PAGE === 'board' && state.boardOrders.some(o => o.status === 'sent' && o.soundAlertActive !== false);
    if (!state.soundEnabled || !hasPendingAlarm) {
      stopBoardAlarmLoop();
      return;
    }
    beep(3);
    boardAlarmTimer = setTimeout(tick, 1800);
  };

  tick();
}

function syncBoardAlarmLoop() {
  const hasPendingAlarm = PAGE === 'board' && state.boardOrders.some(o => o.status === 'sent' && o.soundAlertActive !== false);
  if (state.soundEnabled && hasPendingAlarm) startBoardAlarmLoop();
  else stopBoardAlarmLoop();
}
async function updateOrderStatus(orderId, patch) {
  try {
    await updateDoc(doc(db, 'orders', orderId), { ...patch, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error(err);
    showToast('อัปเดตสถานะไม่สำเร็จ', 'danger');
  }
}
function renderBoardCard(order) {
  const itemsHtml = order.items.map(item => `
    <li>${item.qty}x ${escapeHtml(item[`name_${state.lang}`] || item.name_en || '')}${item.lineComment ? ` — ${escapeHtml(item.lineComment)}` : ''}</li>
  `).join('');
  const actions = [];
  if (order.status === 'sent') {
    actions.push(`<button class="btn small primary" data-order-ack="${order.id}">Acknowledge</button>`);
    actions.push(`<button class="btn small ghost" data-order-view="${order.id}">View</button>`);
  } else if (order.status === 'acknowledged') {
    actions.push(`<button class="btn small primary" data-order-keyed="${order.id}">Mark Keyed</button>`);
    actions.push(`<button class="btn small ghost" data-order-view="${order.id}">View</button>`);
  } else if (order.status === 'keyed') {
    actions.push(`<button class="btn small primary" data-order-close="${order.id}">Close</button>`);
    actions.push(`<button class="btn small ghost" data-order-view="${order.id}">View</button>`);
  } else {
    actions.push(`<button class="btn small ghost" data-order-view="${order.id}">View</button>`);
  }

  return `
    <article class="board-card card">
      <div class="price-row">
        <h3>${escapeHtml(order.orderNo || 'Order')}</h3>
        ${order.status === 'sent' ? '<span class="badge-new">NEW</span>' : ''}
      </div>
      <div class="meta">
        ${formatDateTime(order.createdAt)}<br>
        Seat: ${escapeHtml(order.seatNo || '-')} · Room: ${escapeHtml(order.roomNo || '-')} · Guests: ${escapeHtml(order.guestCount || 1)}<br>
        Payment: ${escapeHtml(order.paymentType || '-')} · Staff: ${escapeHtml(order.createdByName || '-')}
      </div>
      <ul>${itemsHtml}</ul>
      <div class="actions">${actions.join('')}</div>
    </article>
  `;
}
function renderBoard() {
  qs('boardStats').textContent = `New: ${state.boardOrders.filter(o=>o.status==='sent').length}`;
  const newOrders = state.boardOrders.filter(o => o.status === 'sent');
  const ackOrders = state.boardOrders.filter(o => o.status === 'acknowledged');
  const doneOrders = state.boardOrders.filter(o => ['keyed', 'closed'].includes(o.status));
  qs('newOrders').innerHTML = newOrders.length ? newOrders.map(renderBoardCard).join('') : '<div class="empty-state">No new orders</div>';
  qs('ackOrders').innerHTML = ackOrders.length ? ackOrders.map(renderBoardCard).join('') : '<div class="empty-state">No acknowledged orders</div>';
  qs('doneOrders').innerHTML = doneOrders.length ? doneOrders.map(renderBoardCard).join('') : '<div class="empty-state">No keyed / closed orders</div>';

  document.querySelectorAll('[data-order-view]').forEach(btn => btn.addEventListener('click', () => openOrderView(btn.dataset.orderView)));
  document.querySelectorAll('[data-order-ack]').forEach(btn => btn.addEventListener('click', () => updateOrderStatus(btn.dataset.orderAck, {
    status: 'acknowledged',
    soundAlertActive: false,
    newBadge: false,
    acknowledgedByUid: state.currentUser.uid,
    acknowledgedByName: currentUserLabel('Hostess'),
    acknowledgedAt: serverTimestamp()
  })));
  document.querySelectorAll('[data-order-keyed]').forEach(btn => btn.addEventListener('click', () => updateOrderStatus(btn.dataset.orderKeyed, {
    status: 'keyed',
    keyedByUid: state.currentUser.uid,
    keyedByName: currentUserLabel('Hostess'),
    keyedAt: serverTimestamp()
  })));
  document.querySelectorAll('[data-order-close]').forEach(btn => btn.addEventListener('click', () => updateOrderStatus(btn.dataset.orderClose, {
    status: 'closed',
    closedByUid: state.currentUser.uid,
    closedByName: currentUserLabel('Hostess'),
    closedAt: serverTimestamp()
  })));

  const pendingKey = newOrders.filter(o => o.soundAlertActive !== false).map(o => o.id).join('|');
  state.lastPendingKey = pendingKey;
  syncBoardAlarmLoop();
}
function openOrderView(orderId) {
  const order = state.boardOrders.find(x => x.id === orderId);
  const modal = qs('orderViewModal');
  if (!order || !modal) return;
  const lines = order.items.map(item => `
    <li>${item.qty} x ${escapeHtml(item[`name_${state.lang}`] || item.name_en || '')}${item.lineComment ? ` — ${escapeHtml(item.lineComment)}` : ''}</li>
  `).join('');
  modal.innerHTML = `
    <div class="modal-card">
      <h2>${escapeHtml(order.orderNo)}</h2>
      <p>${formatDateTime(order.createdAt)}</p>
      <div class="notice" style="margin-top:14px">
        Seat: ${escapeHtml(order.seatNo || '-')} · Room: ${escapeHtml(order.roomNo || '-')} · Guests: ${escapeHtml(order.guestCount || 1)}<br>
        Payment: ${escapeHtml(order.paymentType || '-')} · Staff: ${escapeHtml(order.createdByName || '-')}
      </div>
      <ul style="margin-top:16px">${lines}</ul>
      ${order.generalComment ? `<div class="notice">Comment: ${escapeHtml(order.generalComment)}</div>` : ''}
      <div class="form-actions">
        <button class="btn" data-close-modal>Close</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModals);
}
function adminMenuRow(item) {
  return `
    <article class="admin-row">
      <div class="admin-main">
        <div class="thumb-mini" style="padding:0;overflow:hidden;background:#f7f1ea">
          <img src="${escapeHtml(getMenuImage(item))}" alt="${escapeHtml(item.name_en || item.id)}" style="width:100%;height:100%;object-fit:contain">
        </div>
        <div class="admin-copy">
          <h3>${escapeHtml(item.name_en || item.id)}</h3>
          <p>${escapeHtml(item.name_zh || '')}<br>${escapeHtml(item.name_ru || '')}</p>
          <div class="status-row">
            <span class="pill ${item.isActive !== false ? 'active' : ''}">${item.isActive !== false ? 'Active' : 'Inactive'}</span>
            <span class="pill ${item.hidden ? 'hidden' : ''}">${item.hidden ? 'Hidden' : 'Visible'}</span>
            <span class="pill ${item.soldOut ? 'soldout' : ''}">${item.soldOut ? 'Sold Out' : 'Available'}</span>
          </div>
        </div>
        <div>
          <div class="price">${formatCurrency(item.price)}</div>
          <div class="menu-actions" style="margin-top:10px">
            <button class="btn small" data-edit-item="${item.id}">Edit</button>
          </div>
        </div>
      </div>
    </article>
  `;
}
function userRow(user) {
  return `
    <article class="admin-row">
      <div class="admin-main" style="grid-template-columns:minmax(0,1fr) auto">
        <div class="admin-copy">
          <h3>${escapeHtml(user.displayName || user.email || user.uid)}</h3>
          <p>Employee ID: ${escapeHtml(user.employeeId || '-')}<br>${escapeHtml(user.email || '')}<br>UID: ${escapeHtml(user.uid || '')}</p>
          <div class="status-row">
            <span class="pill active">${escapeHtml(user.role || 'staff')}</span>
            <span class="pill ${user.active === false ? 'soldout' : 'active'}">${user.active === false ? 'Disabled' : 'Active'}</span>
            ${user.employeeId ? `<span class="pill">${escapeHtml(user.employeeId)}</span>` : ''}
          </div>
        </div>
        <div>
          <button class="btn small" data-edit-user="${user.uid}">Edit</button>
        </div>
      </div>
    </article>
  `;
}
function renderAdmin() {
  const search = (qs('adminSearch')?.value || '').trim().toLowerCase();
  const category = qs('adminCategoryFilter')?.value || 'all';
  const status = qs('adminStatusFilter')?.value || 'all';
  const list = state.items.filter(item => {
    const matchSearch = !search || [item.name_en, item.name_zh, item.name_ru, item.id].join(' ').toLowerCase().includes(search);
    const matchCategory = category === 'all' || item.categoryId === category;
    const matchStatus = status === 'all'
      || (status === 'active' && item.isActive !== false && item.hidden !== true && item.soldOut !== true)
      || (status === 'hidden' && item.hidden === true)
      || (status === 'soldout' && item.soldOut === true);
    return matchSearch && matchCategory && matchStatus;
  });
  const select = qs('adminCategoryFilter');
  if (select && !select.dataset.bound) {
    select.innerHTML = `<option value="all">All Categories</option>` + sortCategories(state.categories).map(cat => `<option value="${cat.id}">${escapeHtml(cat.name_en)}</option>`).join('');
    select.dataset.bound = '1';
    select.addEventListener('change', renderAdmin);
  }
  qs('adminList').innerHTML = list.length ? list.map(adminMenuRow).join('') : '<div class="empty-state">No menu items</div>';
  qs('userList').innerHTML = state.userDrafts.length ? state.userDrafts.map(userRow).join('') : '<div class="empty-state">No user profiles</div>';
  document.querySelectorAll('[data-edit-item]').forEach(btn => btn.addEventListener('click', () => openMenuEditor(btn.dataset.editItem)));
  document.querySelectorAll('[data-edit-user]').forEach(btn => btn.addEventListener('click', () => openUserEditor(btn.dataset.editUser)));
}
function openMenuEditor(itemId) {
  const modal = qs('adminEditorModal');
  const existing = state.items.find(x => x.id === itemId);
  const item = existing || {
    id: '',
    categoryId: sortCategories(state.categories)[0]?.id || 'appetizer',
    price: 0,
    imageUrl: '',
    isActive: true,
    hidden: false,
    soldOut: false,
    name_en: '',
    desc_en: '',
    name_zh: '',
    desc_zh: '',
    name_ru: '',
    desc_ru: ''
  };
  modal.innerHTML = `
    <div class="modal-card">
      <div class="admin-head"><h2>${existing ? 'Edit Menu Item' : 'Add Menu Item'}</h2></div>
      <div class="form-grid">
        <label><span>Item ID</span><input id="editItemId" type="text" value="${escapeHtml(item.id)}" ${existing ? 'disabled' : ''}></label>
        <label><span>Category</span>
          <select id="editCategoryId">${sortCategories(state.categories).map(cat => `<option value="${cat.id}" ${cat.id===item.categoryId?'selected':''}>${escapeHtml(cat.name_en)}</option>`).join('')}</select>
        </label>
        <label><span>Price</span><input id="editPrice" type="number" min="0" value="${escapeHtml(item.price)}"></label>
        <label><span>Image URL</span><input id="editImageUrl" type="text" value="${escapeHtml(item.imageUrl || '')}" placeholder="assets/menu/item.png or https://..."></label>
        <label class="full"><span>English Name</span><input id="editNameEn" type="text" value="${escapeHtml(item.name_en || '')}"></label>
        <label class="full"><span>English Description</span><textarea id="editDescEn" rows="3">${escapeHtml(item.desc_en || '')}</textarea></label>
        <label class="full"><span>Chinese Name</span><input id="editNameZh" type="text" value="${escapeHtml(item.name_zh || '')}"></label>
        <label class="full"><span>Chinese Description</span><textarea id="editDescZh" rows="3">${escapeHtml(item.desc_zh || '')}</textarea></label>
        <label class="full"><span>Russian Name</span><input id="editNameRu" type="text" value="${escapeHtml(item.name_ru || '')}"></label>
        <label class="full"><span>Russian Description</span><textarea id="editDescRu" rows="3">${escapeHtml(item.desc_ru || '')}</textarea></label>
      </div>
      <div class="status-row" style="margin-top:16px">
        <label><input id="editIsActive" type="checkbox" ${item.isActive !== false ? 'checked' : ''}> Active</label>
        <label><input id="editHidden" type="checkbox" ${item.hidden ? 'checked' : ''}> Hidden</label>
        <label><input id="editSoldOut" type="checkbox" ${item.soldOut ? 'checked' : ''}> Sold Out</label>
      </div>
      <div class="form-actions">
        <button class="btn ghost" data-close-modal>Cancel</button>
        <button class="btn primary" id="saveMenuItemBtn">Save</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModals);
  qs('saveMenuItemBtn').onclick = async () => {
    const id = existing ? existing.id : slugify(qs('editItemId').value || qs('editNameEn').value);
    if (!id) return showToast('กรุณาใส่ Item ID', 'danger');
    const payload = {
      id,
      categoryId: qs('editCategoryId').value,
      price: Number(qs('editPrice').value || 0),
      imageUrl: qs('editImageUrl').value.trim() || `assets/menu/${id}.png`,
      isActive: qs('editIsActive').checked,
      hidden: qs('editHidden').checked,
      soldOut: qs('editSoldOut').checked,
      name_en: qs('editNameEn').value.trim(),
      desc_en: qs('editDescEn').value.trim(),
      name_zh: qs('editNameZh').value.trim(),
      desc_zh: qs('editDescZh').value.trim(),
      name_ru: qs('editNameRu').value.trim(),
      desc_ru: qs('editDescRu').value.trim(),
      sortOrder: existing?.sortOrder || 999,
      updatedAt: serverTimestamp(),
      createdAt: existing?.createdAt || serverTimestamp()
    };
    await setDoc(doc(db, 'menu_items', id), payload, { merge: true });
    closeModals();
    showToast('บันทึกเมนูแล้ว', 'success');
  };
}
function openUserEditor(uid) {
  const modal = qs('userEditorModal');
  const existing = state.userDrafts.find(x => x.uid === uid);
  const user = existing || {
    uid: '',
    displayName: '',
    email: '',
    employeeId: '',
    role: 'staff',
    active: true
  };
  modal.innerHTML = `
    <div class="modal-card">
      <h2>${existing ? 'Edit User Profile' : 'Add User Profile'}</h2>
      <p>ใช้สำหรับแก้ role / employee ID / ชื่อแสดงผล ของผู้ใช้ที่สมัครแล้ว หรือเพิ่ม profile ให้บัญชีที่มีอยู่</p>
      <div class="form-grid">
        <label><span>Auth UID</span><input id="editUserUid" type="text" value="${escapeHtml(user.uid || '')}" ${existing ? 'disabled' : ''}></label>
        <label><span>Email</span><input id="editUserEmail" type="text" value="${escapeHtml(user.email || '')}"></label>
        <label><span>Display Name</span><input id="editUserName" type="text" value="${escapeHtml(user.displayName || '')}"></label>
        <label><span>Employee ID</span><input id="editEmployeeId" type="text" value="${escapeHtml(user.employeeId || '')}"></label>
        <label><span>Role</span>
          <select id="editUserRole">
            ${['staff','hostess','cashier','manager','admin'].map(role => `<option value="${role}" ${role===user.role?'selected':''}>${role}</option>`).join('')}
          </select>
        </label>
        <label><span>Active</span>
          <select id="editUserActive">
            <option value="true" ${user.active !== false ? 'selected' : ''}>true</option>
            <option value="false" ${user.active === false ? 'selected' : ''}>false</option>
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn ghost" data-close-modal>Cancel</button>
        <button class="btn primary" id="saveUserBtn">Save</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModals);
  qs('saveUserBtn').onclick = async () => {
    const newUid = existing ? existing.uid : qs('editUserUid').value.trim();
    if (!newUid) return showToast('กรุณาใส่ Auth UID', 'danger');
    await setDoc(doc(db, 'users', newUid), {
      uid: newUid,
      email: qs('editUserEmail').value.trim(),
      displayName: qs('editUserName').value.trim(),
      employeeId: qs('editEmployeeId').value.trim(),
      role: qs('editUserRole').value,
      active: qs('editUserActive').value === 'true',
      updatedAt: serverTimestamp(),
      createdAt: existing?.createdAt || serverTimestamp()
    }, { merge: true });
    closeModals();
    showToast('บันทึก user profile แล้ว', 'success');
  };
}
function wireCommonAuthButtons() {
  const logoutIds = ['staffLogoutBtn', 'boardLogoutBtn', 'adminLogoutBtn'];
  logoutIds.forEach(id => {
    const el = qs(id);
    if (el) el.onclick = async () => { stopBoardAlarmLoop(); await signOut(auth); window.location.reload(); };
  });
}
function useSeedMenuFallback(reason='') {
  state.categories = seedCategories.filter(cat => cat.id !== 'all').map(cat => ({ ...cat }));
  state.items = seedItems.map(item => ({ ...item }));
  state.menuSource = 'seed';
  state.menuNotice = reason || 'Using built-in fallback menu because Firestore menu data is missing.';
}
async function fetchMenu() {
  try {
    const [catsSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, 'menu_categories')),
      getDocs(collection(db, 'menu_items'))
    ]);
    const categories = catsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
    const items = itemsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
    if (!categories.length || !items.length) {
      useSeedMenuFallback('Firestore ยังไม่มีข้อมูลเมนู ระบบจะแสดงเมนูสำรองชั่วคราว');
      return;
    }
    state.categories = categories;
    state.items = items;
    state.menuSource = 'firestore';
    state.menuNotice = '';
  } catch (err) {
    console.error('fetchMenu failed, using fallback menu', err);
    useSeedMenuFallback('อ่านเมนูจาก Firestore ไม่สำเร็จ ระบบจะแสดงเมนูสำรองชั่วคราว');
  }
}
async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'));
  state.userDrafts = snap.docs.map(d => ({ uid:d.id, ...d.data() })).sort((a,b)=>(a.displayName||'').localeCompare(b.displayName||''));
}
async function bootstrapFirstAdmin() {
  await setDoc(doc(db, 'users', state.currentUser.uid), {
    uid: state.currentUser.uid,
    email: state.currentUser.email || employeeIdToEmail(currentEmployeeId()) || '',
    employeeId: currentEmployeeId() || '',
    displayName: currentUserLabel('Admin'),
    role: 'admin',
    active: true,
    signupMethod: state.currentProfile?.signupMethod || 'employee_id',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  await setDoc(doc(db, 'app_settings', 'main'), {
    outletName: 'The Taste',
    bootstrapComplete: true,
    boardSoundEnabled: true,
    enabledLanguages: ['en','zh','ru'],
    paymentTypes: ['cash','credit_card','qr'],
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge:true });
  showToast('ตั้งค่าบัญชีแรกเป็น admin แล้ว', 'success');
  state.currentProfile = { uid: state.currentUser.uid, role: 'admin', displayName: currentUserLabel('Admin'), employeeId: currentEmployeeId(), active:true };
  startPageForUser();
}
function showMissingProfile(containerId, messageExtra='') {
  const container = qs(containerId);
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="card soft">
      <h2>บัญชีนี้ยังไม่มีสิทธิ์ใช้งาน</h2>
      <p>โปรดติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์การใช้งาน</p>
      ${messageExtra ? `<div class="notice" style="margin-top:12px">${escapeHtml(messageExtra)}</div>` : ''}
    </div>
  `;
}
function renderLoginModal(modalId, title='Login') {
  const modal = qs(modalId);
  if (!modal) return;
  modal.innerHTML = `
    <div class="modal-card small auth-modal-card">
      <h2>${escapeHtml(title)}</h2>
      <p>เข้าสู่ระบบหรือสมัครสมาชิกด้วย <strong>รหัสพนักงาน</strong></p>
      <div class="auth-tabs">
        <button class="chip active" type="button" data-auth-tab="login">Login</button>
        <button class="chip" type="button" data-auth-tab="register">Register</button>
      </div>

      <div class="auth-pane" data-auth-pane="login">
        <div class="form-grid" style="grid-template-columns:1fr">
          <label><span>Employee ID</span><input id="${modalId}_login_identifier" type="text" placeholder="1001"></label>
          <label><span>Password</span><input id="${modalId}_login_password" type="password" placeholder="••••••••"></label>
        </div>
        <div class="form-actions">
          <button class="btn primary" id="${modalId}_loginBtn">Login</button>
        </div>
      </div>

      <div class="auth-pane hidden" data-auth-pane="register">
        <div class="form-grid" style="grid-template-columns:1fr">
          <label><span>Employee ID</span><input id="${modalId}_register_employeeId" type="text" placeholder="1001"></label>
          <label><span>Display Name</span><input id="${modalId}_register_displayName" type="text" placeholder="Noi"></label>
          <label><span>Password</span><input id="${modalId}_register_password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร"></label>
          <label><span>Confirm Password</span><input id="${modalId}_register_confirmPassword" type="password" placeholder="ยืนยันรหัสผ่าน"></label>
        </div>
        <div class="form-actions">
          <button class="btn primary" id="${modalId}_registerBtn">Create Account</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');

  modal.querySelectorAll('[data-auth-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.authTab;
      modal.querySelectorAll('[data-auth-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === selected));
      modal.querySelectorAll('[data-auth-pane]').forEach(pane => pane.classList.toggle('hidden', pane.dataset.authPane !== selected));
    });
  });

  qs(`${modalId}_loginBtn`).onclick = async () => {
    const identifier = qs(`${modalId}_login_identifier`).value.trim();
    const password = qs(`${modalId}_login_password`).value;
    const email = credentialToEmail(identifier);
    if (!identifier || !password) return showToast('กรุณาใส่รหัสพนักงานและรหัสผ่าน', 'danger');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      modal.classList.add('hidden');
      modal.innerHTML = '';
    } catch (err) {
      console.error(err);
      showToast('Login ไม่สำเร็จ', 'danger');
    }
  };

  qs(`${modalId}_registerBtn`).onclick = async () => {
    const employeeId = normalizeEmployeeId(qs(`${modalId}_register_employeeId`).value);
    const displayName = qs(`${modalId}_register_displayName`).value.trim();
    const password = qs(`${modalId}_register_password`).value;
    const confirmPassword = qs(`${modalId}_register_confirmPassword`).value;
    const email = employeeIdToEmail(employeeId);
    if (!employeeId) return showToast('กรุณาใส่รหัสพนักงาน', 'danger');
    if (password.length < 6) return showToast('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร', 'danger');
    if (password !== confirmPassword) return showToast('ยืนยันรหัสผ่านไม่ตรงกัน', 'danger');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile = {
        uid: cred.user.uid,
        email,
        employeeId,
        displayName: displayName || employeeId,
        role: 'staff',
        active: true,
        signupMethod: 'employee_id',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile, { merge: true });
      state.currentUser = cred.user;
      state.currentProfile = { ...profile, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
      showToast('สมัครสมาชิกสำเร็จ', 'success');
      modal.classList.add('hidden');
      modal.innerHTML = '';
      await startPageForUser();
    } catch (err) {
      console.error(err);
      const message = err?.code === 'auth/email-already-in-use'
        ? 'รหัสพนักงานนี้ถูกใช้สมัครแล้ว'
        : 'สมัครสมาชิกไม่สำเร็จ';
      showToast(message, 'danger');
    }
  };
}
async function startPageForUser() {
  wireCommonAuthButtons();
  await fetchMenu();

  if (PAGE === 'staff') {
    if (!state.currentProfile || !['staff','manager','admin'].includes(state.currentProfile.role) || state.currentProfile.active === false) {
      showMissingProfile('staffApp', 'ให้ admin เพิ่ม role เป็น staff / manager / admin');
      return;
    }
    qs('staffUserPill').textContent = currentUserLabel('Staff');
    qs('staffApp').classList.remove('hidden');
    renderStaff();
    return;
  }

  if (PAGE === 'board') {
    if (!state.currentProfile || !['hostess','cashier','manager','admin'].includes(state.currentProfile.role) || state.currentProfile.active === false) {
      showMissingProfile('boardApp', 'ให้ admin เพิ่ม role เป็น hostess / cashier / manager / admin');
      return;
    }
    qs('boardApp').classList.remove('hidden');
    qs('enableSoundBtn').textContent = state.soundEnabled ? 'Mute Alarm' : 'Enable Alarm';
    qs('enableSoundBtn').onclick = () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('taste_board_sound', state.soundEnabled ? 'on' : 'off');
      qs('enableSoundBtn').textContent = state.soundEnabled ? 'Mute Alarm' : 'Enable Alarm';
      if (state.soundEnabled) {
        beep(1);
        syncBoardAlarmLoop();
      } else {
        stopBoardAlarmLoop();
      }
    };
    if (boardUnsub) boardUnsub();
    boardUnsub = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(80)), snap => {
      state.boardOrders = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderBoard();
    });
    return;
  }

  if (PAGE === 'admin') {
    const appContainer = qs('adminApp');
    const settingsSnap = await getDoc(doc(db, 'app_settings', 'main'));
    const bootDone = settingsSnap.exists() && settingsSnap.data().bootstrapComplete === true;

    if (!bootDone) {
      appContainer.classList.remove('hidden');
      appContainer.innerHTML = `
        <div class="card soft">
          <h2>Set First Admin</h2>
          <p>กดปุ่มด้านล่างเพื่อกำหนดบัญชีนี้เป็นผู้ดูแลระบบคนแรก</p>
          <div class="form-actions" style="justify-content:flex-start">
            <button class="btn primary" id="bootstrapAdminBtn">Set as Admin</button>
          </div>
        </div>
      `;
      qs('bootstrapAdminBtn').onclick = bootstrapFirstAdmin;
      return;
    }

    if (!state.currentProfile) {
      showMissingProfile('adminApp', 'ให้ admin เพิ่ม user profile สำหรับ UID นี้ หรือสมัครผ่านรหัสพนักงานก่อน');
      return;
    }
    if (!['admin','manager'].includes(state.currentProfile.role) || state.currentProfile.active === false) {
      showMissingProfile('adminApp', 'บัญชีนี้ไม่มีสิทธิ์เข้า Admin');
      return;
    }
    appContainer.classList.remove('hidden');
    await fetchUsers();
    if (qs('adminSearch')) qs('adminSearch').oninput = renderAdmin;
    if (qs('adminStatusFilter')) qs('adminStatusFilter').onchange = renderAdmin;
    qs('addItemBtn').onclick = () => openMenuEditor();
    qs('addUserBtn').onclick = () => openUserEditor();
    qs('seedFirestoreBtn').onclick = seedFirestoreMenu;
    renderAdmin();
    return;
  }
}
async function seedFirestoreMenu() {
  if (!confirm('Seed เมนูชุดเริ่มต้นจากไฟล์เมนูเดิมลง Firestore ตอนนี้หรือไม่?')) return;
  try {
    const batch = writeBatch(db);
    seedCategories.filter(cat => cat.id !== 'all').forEach(cat => {
      batch.set(doc(db, 'menu_categories', cat.id), {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    seedItems.forEach(item => {
      batch.set(doc(db, 'menu_items', item.id), {
        ...item,
        id: item.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    batch.set(doc(db, 'app_settings', 'main'), {
      outletName: 'The Taste',
      bootstrapComplete: true,
      boardSoundEnabled: true,
      enabledLanguages: ['en','zh','ru'],
      paymentTypes: ['cash','credit_card','qr'],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge:true });
    await batch.commit();
    await fetchMenu();
    renderPage();
    showToast('Seed เมนูลง Firestore แล้ว', 'success');
  } catch (err) {
    console.error(err);
    showToast('Seed Firestore ไม่สำเร็จ', 'danger');
  }
}
function renderHome() {
  return;
}
function renderPage() {
  if (PAGE === 'home') renderHome();
  if (PAGE === 'guest') renderGuest();
  if (PAGE === 'staff') renderStaff();
  if (PAGE === 'board') renderBoard();
  if (PAGE === 'admin') renderAdmin();
}
async function initProtectedPage(modalId, title) {
  onAuthStateChanged(auth, async user => {
    state.currentUser = user || null;
    if (!user) {
      renderLoginModal(modalId, title);
      return;
    }
    const profileSnap = await getDoc(doc(db, 'users', user.uid));
    state.currentProfile = profileSnap.exists() ? { uid:user.uid, ...profileSnap.data() } : null;
    await startPageForUser();
  });
}
async function initPublicMenu() {
  await fetchMenu();
  renderGuest();
}
async function init() {
  if (!isFirebaseConfigured()) {
    addConfigNotice();
    renderPage();
    return;
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (PAGE === 'home') {
    renderHome();
    return;
  }
  if (PAGE === 'guest') return initPublicMenu();
  if (PAGE === 'staff') return initProtectedPage('staffLoginModal', 'Staff Login');
  if (PAGE === 'board') return initProtectedPage('boardLoginModal', 'Board Login');
  if (PAGE === 'admin') return initProtectedPage('adminLoginModal', 'Admin Login');
}
window.addEventListener('DOMContentLoaded', init);
