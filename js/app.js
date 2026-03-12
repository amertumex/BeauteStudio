/* ══════════════════════════════════════
   APP.JS — главный файл
   Содержит: состояние, инициализацию, навигацию, логин, toast
   Загружается последним (зависит от всех остальных файлов)
══════════════════════════════════════ */

// ── УЧЁТНЫЕ ДАННЫЕ ────────────────────────────────────────────────
const CREDS = { login: 'admin', password: 'admin' };

// ── СОСТОЯНИЕ ─────────────────────────────────────────────────────
let apps    = JSON.parse(localStorage.getItem('bs_apps') || 'null') || getInitialAppointments();
let selDate = getTodayStr();
let curView = 'calendar';
let filterM = 0;
let editId  = null;
let confDel = false;
let searchQ = '';
let revTab  = 'day';

/** Сохраняет записи в localStorage */
function saveData() {
  localStorage.setItem('bs_apps', JSON.stringify(apps));
}

// ── ЛОГИН ─────────────────────────────────────────────────────────

function doLogin() {
  const login    = document.getElementById('l-login').value.trim();
  const password = document.getElementById('l-pass').value;

  if (login === CREDS.login && password === CREDS.password) {
    sessionStorage.setItem('bs_auth', '1');
    const ls = document.getElementById('login-screen');
    ls.classList.add('hidden');
    setTimeout(() => ls.style.display = 'none', 400);
    document.getElementById('app').classList.add('visible');
    initApp();
  } else {
    document.getElementById('l-err').textContent = 'Неверный логин или пароль';
    ['l-login', 'l-pass'].forEach(id => {
      const el = document.getElementById(id);
      el.classList.add('err');
      setTimeout(() => el.classList.remove('err'), 400);
    });
  }
}

// Enter в полях логина
['l-login', 'l-pass'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

// Автовход если сессия ещё активна
if (sessionStorage.getItem('bs_auth') === '1') {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  initApp();
}

// ── ИНИЦИАЛИЗАЦИЯ ─────────────────────────────────────────────────

function initApp() {
  buildSidebarNav();
  buildSidebarFilter();
  buildBottomNav();
  buildModalSelects();
  render();
}

function buildSidebarNav() {
  const items = [
    { id: 'calendar', icon: '◫', label: 'Расписание'    },
    { id: 'list',     icon: '≡', label: 'Журнал записей' },
    { id: 'stats',    icon: '◎', label: 'Статистика'    },
  ];
  document.getElementById('sidebar-nav').innerHTML = items.map(x =>
    `<div class="nav-item ${curView === x.id ? 'active' : ''}" id="snav-${x.id}" onclick="setView('${x.id}')">
      <span class="nav-item-icon">${x.icon}</span>${x.label}
    </div>`
  ).join('');
}

function buildBottomNav() {
  const items = [
    { id: 'calendar', icon: '◫', label: 'Расписание' },
    { id: 'list',     icon: '≡', label: 'Журнал'     },
    { id: 'stats',    icon: '◎', label: 'Статистика' },
  ];
  document.getElementById('bottom-nav').innerHTML = items.map(x =>
    `<button class="bottom-nav-item ${curView === x.id ? 'active' : ''}" id="bnav-${x.id}" onclick="setView('${x.id}')">
      <span class="bottom-nav-icon">${x.icon}</span>${x.label}
    </button>`
  ).join('');
}

function buildSidebarFilter() {
  const sf = document.getElementById('sidebar-filter');
  sf.innerHTML = `
    <div class="filter-title">Фильтр</div>
    <div class="filter-item ${filterM === 0 ? 'active' : ''}" onclick="setFilter(0)">Все мастера</div>
    ${MASTERS.map(m => `
      <div class="filter-item ${filterM === m.id ? 'active' : ''}" id="fi-${m.id}" onclick="setFilter(${m.id})">
        <span class="master-dot" style="background:${m.color}"></span>${m.name.split(' ')[0]}
      </div>`).join('')}`;
}

function buildModalSelects() {
  // Временные слоты
  const tSel = document.getElementById('f-time');
  TIME_SLOTS.forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    tSel.appendChild(o);
  });

  // Услуги
  const svSel = document.getElementById('f-service');
  SERVICES.forEach(s => {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = `${s.name} — ${s.price.toLocaleString('ru-RU')} ₽ (${s.duration} мин)`;
    svSel.appendChild(o);
  });

  // Мастера
  const mSel = document.getElementById('f-master');
  MASTERS.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = `${m.name} (${m.speciality})`;
    mSel.appendChild(o);
  });

  // Статусы
  const stSel = document.getElementById('f-status');
  Object.entries(STATUS).forEach(([k, v]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = v.label;
    stSel.appendChild(o);
  });
}

// ── НАВИГАЦИЯ ─────────────────────────────────────────────────────

function setView(v) {
  curView = v;
  render();
}

function setFilter(id) {
  filterM = id;
  buildSidebarFilter();
  render();
}

function selectDate(d)  { selDate = d; render(); }
function changeDay(n)   { selDate = addDays(selDate, n); render(); }
function goToday()      { selDate = getTodayStr(); render(); }
function doSearch(q)    { searchQ = q; renderList(); }
function setRevTab(t)   { revTab = t; renderStats(); }
function changeStatus(id, status) {
  apps = apps.map(a => a.id === id ? { ...a, status } : a);
  saveData();
  render();
}

// ── TOAST ─────────────────────────────────────────────────────────

let toastTimer;

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent  = (type === 'error' ? '🗑 ' : '✓ ') + msg;
  el.style.background = type === 'error' ? '#721c24' : '#2c2416';
  el.style.color  = '#e8d5b0';
  el.style.display = 'block';
  // Перезапускаем анимацию
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'fadein 0.3s ease';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.style.display = 'none', 2800);
}

// ── АДАПТАЦИЯ ПРИ РЕСАЙЗЕ ─────────────────────────────────────────

window.addEventListener('resize', () => {
  if (document.getElementById('app').classList.contains('visible')) {
    render();
  }
});
