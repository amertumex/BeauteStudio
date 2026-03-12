/* ══════════════════════════════════════
   РЕНДЕР — все функции отрисовки UI
   Зависит от: constants.js, helpers.js, state (app.js)
══════════════════════════════════════ */

// ── ГЛАВНЫЙ РЕНДЕР ────────────────────────────────────────────────

function render() {
  renderStatsCards();
  renderDateLabel();
  renderMobileStrip();
  renderNavHighlight();

  document.getElementById('view-calendar').style.display = curView === 'calendar' ? 'block' : 'none';
  document.getElementById('view-list').style.display     = curView === 'list'     ? 'block' : 'none';
  document.getElementById('view-stats').style.display    = curView === 'stats'    ? 'block' : 'none';

  if (curView === 'calendar') renderCalendar();
  if (curView === 'list')     renderList();
  if (curView === 'stats')    renderStats();
}

// ── КАРТОЧКИ СТАТИСТИКИ ───────────────────────────────────────────

function renderStatsCards() {
  const today   = getTodayStr();
  const todayApps = apps.filter(a => a.date === today);
  const weekApps  = apps.filter(a => getWeekDates(selDate).includes(a.date));
  const revenue   = calcRevenue(todayApps);

  const stats = [
    { label: 'Сегодня',      value: todayApps.length },
    { label: 'Подтверждено', value: todayApps.filter(a => getEffectiveStatus(a) === 'confirmed').length },
    { label: 'Выручка',      value: `${revenue.toLocaleString('ru-RU')} ₽` },
    { label: 'За неделю',    value: weekApps.length },
  ];

  document.getElementById('stats-cards').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
    </div>`).join('');
}

// ── ЗАГОЛОВОК ДАТЫ (ДЕСКТОП) ──────────────────────────────────────

function renderDateLabel() {
  const today = getTodayStr();
  const dl = document.getElementById('date-label');
  if (dl) {
    dl.innerHTML = formatDate(selDate) +
      (selDate === today ? '<span class="today-badge">сегодня</span>' : '');
  }
  const tb = document.getElementById('today-btn');
  if (tb) tb.style.display = selDate === today ? 'none' : 'flex';
}

// ── ЛЕНТА ДАТ (МОБИЛЬНЫЙ) ────────────────────────────────────────

function renderMobileStrip() {
  const strip = document.getElementById('date-strip');
  if (!strip) return;
  const today = getTodayStr();
  const days  = Array.from({ length: 7 }, (_, i) => addDays(selDate, i - 3));

  strip.innerHTML = days.map(d => {
    const isSel  = d === selDate;
    const isToday = d === today;
    const cnt    = apps.filter(a => a.date === d && (filterM === 0 || a.masterId === filterM)).length;
    const [y, mo, dy] = d.split('-').map(Number);
    const dayName = new Date(y, mo - 1, dy).toLocaleDateString('ru-RU', { weekday: 'short' });

    return `<div class="date-chip" onclick="selectDate('${d}')"
      style="background:${isSel ? '#2c2416' : '#fff'};border-color:${isSel ? '#2c2416' : '#ede6d9'};color:${isSel ? '#e8d5b0' : '#2c2416'}">
      <div class="date-chip-day" style="opacity:${isSel ? 0.7 : 0.5}">${dayName}</div>
      <div class="date-chip-num">${dy}</div>
      ${isToday ? '<div class="date-chip-today" style="opacity:0.6">сегодня</div>' : ''}
      ${cnt > 0 ? `<div class="date-chip-dot" style="background:${isSel ? '#e8d5b0' : '#9c8e7a'}"></div>` : ''}
    </div>`;
  }).join('');
}

// ── ПОДСВЕТКА НАВИГАЦИИ ───────────────────────────────────────────

function renderNavHighlight() {
  ['calendar', 'list', 'stats'].forEach(v => {
    document.getElementById(`snav-${v}`)?.classList.toggle('active', v === curView);
    document.getElementById(`bnav-${v}`)?.classList.toggle('active', v === curView);
  });

  const titles = { calendar: 'Расписание', list: 'Журнал записей', stats: 'Статистика' };
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = titles[curView];

  const dn = document.getElementById('date-nav');
  if (dn) dn.style.display = curView === 'calendar' ? 'flex' : 'none';

  const mt = document.getElementById('mob-title');
  if (mt) mt.textContent = titles[curView];

  const ds = document.getElementById('date-strip');
  if (ds) ds.style.display = curView === 'calendar' ? 'flex' : 'none';
}

// ── РАСПИСАНИЕ ────────────────────────────────────────────────────

function renderCalendar() {
  const el = document.getElementById('view-calendar');
  if (window.innerWidth < 768) {
    renderDayList(el);
    return;
  }

  const dayApps = apps.filter(a =>
    a.date === selDate && (filterM === 0 || a.masterId === filterM)
  );
  const masters = filterM === 0 ? MASTERS : MASTERS.filter(m => m.id === filterM);

  let html = `<div class="cal-grid" style="grid-template-columns:64px repeat(${masters.length},1fr)">`;

  // Заголовки мастеров
  html += `<div class="cal-header"></div>`;
  masters.forEach(m => {
    html += `<div class="cal-header">
      <span class="master-dot" style="background:${m.color}"></span>${m.name}
      <div class="cal-master-spec">${m.speciality}</div>
    </div>`;
  });

  // Временные слоты
  TIME_SLOTS.forEach(ts => {
    const isHalf   = ts.endsWith(':30');
    const rowBorder = isHalf ? '1px solid #ede6d9' : '1px dashed #f0ebe1';
    const rowBg     = isHalf ? '#fdfcfa' : '#fff';

    html += `<div class="time-cell" style="border-bottom:${rowBorder};background:${rowBg}">${!isHalf ? ts : ''}</div>`;

    masters.forEach(m => {
      const app     = getAppForSlot(dayApps, m.id, ts);
      const isStart = app && app.time === ts;
      const isOcc   = app && !isStart;
      const slotBg  = isOcc ? m.color + '18' : rowBg;

      if (isStart) {
        const ef  = getEffectiveStatus(app);
        const cb  = ef === 'cancelled' ? '#f8d7da' : ef === 'completed' ? '#e8f4fd' : m.color + '40';
        const cbr = ef === 'cancelled' ? '#f5c6cb' : ef === 'completed' ? '#98c5e8' : m.color;
        const svc = SERVICES.find(s => s.id === app.serviceId);
        html += `<div class="slot" style="background:${slotBg};border-bottom:${rowBorder};cursor:default">
          <div class="app-card" style="background:${cb};border:1px solid ${cbr}" onclick="openEditModal(${app.id})">
            <div class="app-card-name">${app.clientName}</div>
            <div class="app-card-svc">${svc?.name || ''}</div>
          </div></div>`;
      } else {
        const clickAttr = !app ? `onclick="openNewModal('${selDate}','${ts}',${m.id})"` : '';
        html += `<div class="slot" style="background:${slotBg};border-bottom:${rowBorder};cursor:${app ? 'default' : 'pointer'}" ${clickAttr}></div>`;
      }
    });
  });

  html += '</div>';
  el.innerHTML = html;
}

// ── МОБИЛЬНЫЙ СПИСОК ДНЯ ─────────────────────────────────────────

function renderDayList(el) {
  const dayApps = apps
    .filter(a => a.date === selDate && (filterM === 0 || a.masterId === filterM))
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!dayApps.length) {
    el.innerHTML = '<div class="empty-state">Записей нет — нажмите «+» чтобы добавить</div>';
    return;
  }

  el.innerHTML = dayApps.map(app => {
    const m   = MASTERS.find(x => x.id === app.masterId);
    const sv  = SERVICES.find(x => x.id === app.serviceId);
    const ef  = getEffectiveStatus(app);
    const sc  = STATUS[ef];
    return `<div class="day-card" onclick="openEditModal(${app.id})">
      <div class="day-card-time">
        <div class="day-card-time-val">${app.time}</div>
        <div class="day-card-time-dur">${sv?.duration}м</div>
      </div>
      <div class="day-card-bar" style="background:${m?.color}"></div>
      <div style="flex:1;min-width:0">
        <div class="day-card-name">${app.clientName}</div>
        <div class="day-card-meta">${sv?.name} · ${m?.name.split(' ')[0]}</div>
        ${app.notes ? `<div class="day-card-notes">💬 ${app.notes}</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <span class="badge" style="background:${sc?.bg};color:${sc?.text}">${sc?.label}</span>
        <div class="day-card-price">${sv?.price.toLocaleString('ru-RU')} ₽</div>
      </div>
    </div>`;
  }).join('');
}

// ── ЖУРНАЛ ЗАПИСЕЙ ────────────────────────────────────────────────

function renderList() {
  const el  = document.getElementById('view-list');
  const mob = window.innerWidth < 768;

  const filtered = [...apps]
    .filter(a => filterM === 0 || a.masterId === filterM)
    .filter(a => {
      if (!searchQ.trim()) return true;
      const q = searchQ.toLowerCase();
      return (
        a.clientName.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        SERVICES.find(s => s.id === a.serviceId)?.name.toLowerCase().includes(q) ||
        MASTERS.find(m => m.id === a.masterId)?.name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  let html = `<input class="search-box" value="${searchQ.replace(/"/g, '&quot;')}"
    oninput="doSearch(this.value)" placeholder="🔍  Поиск по имени, телефону, услуге...">`;

  if (!filtered.length) {
    html += `<div class="empty-state">${searchQ ? 'Ничего не найдено' : 'Записей пока нет'}</div>`;
  } else {
    filtered.forEach(app => {
      const m  = MASTERS.find(x => x.id === app.masterId);
      const sv = SERVICES.find(x => x.id === app.serviceId);
      const ef = getEffectiveStatus(app);
      const sc = STATUS[ef];
      const statusOpts = Object.entries(STATUS)
        .map(([k, v]) => `<option value="${k}" ${ef === k ? 'selected' : ''}>${v.label}</option>`)
        .join('');

      html += `<div class="list-card">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          <div style="width:4px;height:52px;border-radius:2px;background:${m?.color};flex-shrink:0"></div>
          <div style="min-width:0">
            <div class="list-card-name">${app.clientName}</div>
            <div class="list-card-meta">${app.phone} · ${sv?.name}</div>
            <div class="list-card-sub">${m?.name.split(' ')[0]} · ${formatDateMini(app.date)}, ${app.time}</div>
            ${app.notes ? `<div class="list-card-notes">💬 ${app.notes}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:${mob ? 'column' : 'row'};align-items:${mob ? 'flex-end' : 'center'};gap:8px;flex-shrink:0">
          ${!mob
            ? `<select class="status-select" onchange="changeStatus(${app.id},this.value)">${statusOpts}</select>`
            : `<span class="badge" style="background:${sc?.bg};color:${sc?.text}">${sc?.label}</span>`}
          <div class="list-card-price">${sv?.price.toLocaleString('ru-RU')} ₽</div>
          <button class="btn-secondary" style="padding:7px 14px;flex:none;font-size:15px"
            onclick="openEditModal(${app.id})">Ред.</button>
        </div>
      </div>`;
    });
  }
  el.innerHTML = html;
}

// ── СТАТИСТИКА ────────────────────────────────────────────────────

function renderStats() {
  const el  = document.getElementById('view-stats');
  const mob = window.innerWidth < 768;
  const today = getTodayStr();

  const todayApps = apps.filter(a => a.date === today);
  const weekApps  = apps.filter(a => getWeekDates(selDate).includes(a.date));
  const monthApps = apps.filter(a => getMonthDates(today).includes(a.date));

  const revData = {
    day:   { apps: todayApps, label: 'День',   sub: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) },
    week:  { apps: weekApps,  label: 'Неделя', sub: 'Текущая неделя' },
    month: { apps: monthApps, label: 'Месяц',  sub: new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) },
  };

  // Загруженность мастеров
  const counts = MASTERS.map(m =>
    apps.filter(a => a.masterId === m.id && getEffectiveStatus(a) !== 'cancelled').length
  );
  const maxCount = Math.max(...counts, 1);

  const mastersHtml = MASTERS.map((m, i) => `
    <div class="progress-row">
      <div class="progress-row-header">
        <span><span class="master-dot" style="background:${m.color}"></span>${m.name}</span>
        <span class="progress-row-count">${counts[i]} зап.</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${(counts[i] / maxCount) * 100}%;background:${m.color}"></div>
      </div>
    </div>`).join('');

  // Популярные услуги
  const svcList = SERVICES
    .map(s => ({ ...s, cnt: apps.filter(a => a.serviceId === s.id && getEffectiveStatus(a) !== 'cancelled').length }))
    .filter(s => s.cnt > 0)
    .sort((a, b) => b.cnt - a.cnt);

  const svcHtml = svcList.length
    ? svcList.map(s => `<div class="svc-row"><span>${s.name}</span><span class="svc-row-meta">${s.cnt}× · ${s.price.toLocaleString('ru-RU')} ₽</span></div>`).join('')
    : '<div class="empty-state" style="padding:20px 0">Нет активных записей</div>';

  // Статусы записей
  const statusHtml = Object.entries(STATUS).map(([key, val]) => {
    const cnt = apps.filter(a => getEffectiveStatus(a) === key).length;
    const pct = apps.length ? Math.round(cnt / apps.length * 100) : 0;
    return `<div class="status-row">
      <div class="status-row-header">
        <span class="badge" style="background:${val.bg};color:${val.text}">${val.label}</span>
        <span class="status-row-count">${cnt} <span class="status-row-pct">(${pct}%)</span></span>
      </div>
      <div class="status-progress">
        <div class="status-progress-fill" style="width:${pct}%;background:${val.text}"></div>
      </div>
    </div>`;
  }).join('');

  // Выручка
  const rObj   = revData[revTab];
  const rAmt   = calcRevenue(rObj.apps);
  const expAmt = rObj.apps
    .filter(a => ['confirmed', 'pending'].includes(getEffectiveStatus(a)))
    .reduce((s, a) => s + (SERVICES.find(x => x.id === a.serviceId)?.price || 0), 0);

  const tabsHtml = Object.entries(revData).map(([k, v]) =>
    `<button class="rev-tab ${revTab === k ? 'active' : ''}" onclick="setRevTab('${k}')">${v.label}</button>`
  ).join('');

  const breakdownHtml = [
    { l: 'Завершено', c: rObj.apps.filter(a => getEffectiveStatus(a) === 'completed').length },
    { l: 'Ожидается', c: rObj.apps.filter(a => ['confirmed', 'pending'].includes(getEffectiveStatus(a))).length },
    { l: 'Отменено',  c: rObj.apps.filter(a => getEffectiveStatus(a) === 'cancelled').length },
  ].map(x => `<div>
    <div class="rev-meta-item-val">${x.c}</div>
    <div class="rev-meta-item-label">${x.l}</div>
  </div>`).join('');

  el.innerHTML = `
    <div class="stats-panels" style="grid-template-columns:${mob ? '1fr' : '1fr 1fr'}">
      <div class="panel">
        <div class="panel-title">Загруженность мастеров</div>
        ${mastersHtml}
      </div>
      <div class="panel">
        <div class="panel-title">Популярные услуги</div>
        ${svcHtml}
      </div>
      <div class="panel">
        <div class="panel-title">Статусы записей</div>
        ${statusHtml}
      </div>
      <div class="panel-dark">
        <div class="panel-title">Выручка</div>
        <div class="rev-tabs">${tabsHtml}</div>
        <div class="rev-sublabel">${rObj.sub}</div>
        <div class="rev-amount">${rAmt.toLocaleString('ru-RU')} ₽</div>
        <div class="rev-meta">${breakdownHtml}</div>
        ${expAmt > 0 ? `<div class="rev-expected">+ ещё ${expAmt.toLocaleString('ru-RU')} ₽ ожидается</div>` : ''}
      </div>
    </div>`;
}
