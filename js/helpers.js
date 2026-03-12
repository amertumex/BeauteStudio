/* ══════════════════════════════════════
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   - Работа с датами
   - Форматирование телефона
   - Логика статуса записи
══════════════════════════════════════ */

// ── ДАТЫ ──────────────────────────────────────────────────────────

/** Возвращает сегодняшнюю дату в формате YYYY-MM-DD */
function getTodayStr() {
  const d = new Date();
  return toDateStr(d);
}

/** Объект Date → строка YYYY-MM-DD (без UTC-смещения) */
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Прибавляет n дней к строке-дате, возвращает новую строку */
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateStr(new Date(y, m - 1, d + n));
}

/** Форматирует дату: "понедельник, 12 марта" */
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/** Форматирует дату кратко: "пн, 12 мар" */
function formatDateMini(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

/** Возвращает массив из 7 дат (пн–вс) недели, содержащей anchorDate */
function getWeekDates(anchorDate) {
  const [y, m, d] = anchorDate.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) =>
    toDateStr(new Date(y, m - 1, d + offset + i))
  );
}

/** Возвращает массив всех дат текущего месяца */
function getMonthDates(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) =>
    `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  );
}

// ── ТЕЛЕФОН ───────────────────────────────────────────────────────

/** Форматирует строку в маску +7 (XXX) XXX-XX-XX */
function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  const local  = (digits.startsWith('8') || digits.startsWith('7'))
    ? digits.slice(1) : digits;
  const d = local.slice(0, 10);
  let r = '+7';
  if (d.length > 0) r += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) r += ')';
  if (d.length >= 4) r += ` ${d.slice(3, 6)}`;
  if (d.length >= 7) r += `-${d.slice(6, 8)}`;
  if (d.length >= 9) r += `-${d.slice(8, 10)}`;
  return r;
}

/** Проверяет, введены ли все 10 цифр */
function isPhoneComplete(phone) {
  const digits = phone.replace(/\D/g, '');
  const local  = (digits.startsWith('8') || digits.startsWith('7'))
    ? digits.slice(1) : digits;
  return local.length === 10;
}

/** Обработчик события oninput для поля телефона */
function handlePhone(el) {
  el.value = formatPhone(el.value);
}

// ── ЛОГИКА ЗАПИСЕЙ ────────────────────────────────────────────────

/**
 * Возвращает «эффективный» статус записи.
 * Прошедшие записи автоматически считаются завершёнными.
 */
function getEffectiveStatus(app) {
  if (app.status === 'cancelled') return 'cancelled';
  if (app.status === 'completed') return 'completed';

  const today = getTodayStr();
  if (app.date < today) return 'completed';

  if (app.date === today) {
    const [h, min] = app.time.split(':').map(Number);
    const svc = SERVICES.find(s => s.id === app.serviceId);
    const endMin = h * 60 + min + (svc?.duration || 60);
    const now = new Date();
    if (now.getHours() * 60 + now.getMinutes() >= endMin) return 'completed';
  }

  return app.status;
}

/**
 * Считает выручку по массиву записей (только завершённые).
 */
function calcRevenue(appsArr) {
  return appsArr
    .filter(a => getEffectiveStatus(a) === 'completed')
    .reduce((sum, a) => sum + (SERVICES.find(s => s.id === a.serviceId)?.price || 0), 0);
}

/**
 * Ищет запись, занимающую данный временной слот у мастера.
 * Учитывает длительность услуги (не только стартовый слот).
 */
function getAppForSlot(apps, masterId, slotTime) {
  for (const app of apps) {
    if (app.masterId !== masterId) continue;
    const svc  = SERVICES.find(s => s.id === app.serviceId);
    const dur  = svc?.duration || 60;
    const [ah, am] = app.time.split(':').map(Number);
    const [sh, sm] = slotTime.split(':').map(Number);
    const appStart  = ah * 60 + am;
    const appEnd    = appStart + dur;
    const slotStart = sh * 60 + sm;
    if (slotStart >= appStart && slotStart < appEnd) return app;
  }
  return null;
}

/** Начальные демо-записи (используется при первом запуске) */
function getInitialAppointments() {
  const TODAY     = getTodayStr();
  const YESTERDAY = addDays(TODAY, -1);
  const TOMORROW  = addDays(TODAY,  1);
  return [
    { id:1, clientName:'Виктория Иванова',  phone:'+7 (900) 123-45-67', serviceId:1, masterId:1, date:TODAY,     time:'10:00', status:'confirmed', notes:'' },
    { id:2, clientName:'Светлана Морозова', phone:'+7 (900) 234-56-78', serviceId:4, masterId:2, date:TODAY,     time:'11:30', status:'pending',   notes:'Гель-лак' },
    { id:3, clientName:'Дарья Лебедева',    phone:'+7 (900) 345-67-89', serviceId:3, masterId:1, date:TODAY,     time:'14:00', status:'confirmed', notes:'' },
    { id:4, clientName:'Ирина Кузнецова',   phone:'+7 (900) 456-78-90', serviceId:5, masterId:2, date:YESTERDAY, time:'12:00', status:'confirmed', notes:'' },
    { id:5, clientName:'Алина Попова',      phone:'+7 (900) 567-89-01', serviceId:7, masterId:4, date:TOMORROW,  time:'10:30', status:'confirmed', notes:'Коррекция' },
    { id:6, clientName:'Наталья Смирнова',  phone:'+7 (900) 678-90-12', serviceId:2, masterId:1, date:TOMORROW,  time:'15:00', status:'pending',   notes:'' },
  ];
}
