/* ══════════════════════════════════════
   МОДАЛЬНОЕ ОКНО — открытие, закрытие, сохранение, удаление
   Зависит от: constants.js, helpers.js, state (app.js)
══════════════════════════════════════ */

function openNewModal(date, time, masterId) {
  editId   = null;
  confDel  = false;
  document.getElementById('modal-title').textContent = 'Новая запись';
  document.getElementById('f-name').value    = '';
  document.getElementById('f-phone').value   = '+7 ';
  document.getElementById('f-date').value    = date || selDate;
  document.getElementById('f-time').value    = time || '10:00';
  document.getElementById('f-service').value = 1;
  document.getElementById('f-master').value  = masterId || 1;
  document.getElementById('f-status').value  = 'confirmed';
  document.getElementById('f-notes').value   = '';
  document.getElementById('f-name').classList.remove('err');
  document.getElementById('f-phone').classList.remove('err');
  hideFormErr();
  renderBtnRow();
  document.getElementById('modal').style.display = 'flex';
}

function openEditModal(id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;
  editId  = id;
  confDel = false;
  document.getElementById('modal-title').textContent = 'Редактировать запись';
  document.getElementById('f-name').value    = app.clientName;
  document.getElementById('f-phone').value   = app.phone;
  document.getElementById('f-date').value    = app.date;
  document.getElementById('f-time').value    = app.time;
  document.getElementById('f-service').value = app.serviceId;
  document.getElementById('f-master').value  = app.masterId;
  document.getElementById('f-status').value  = app.status;
  document.getElementById('f-notes').value   = app.notes || '';
  document.getElementById('f-name').classList.remove('err');
  document.getElementById('f-phone').classList.remove('err');
  hideFormErr();
  renderBtnRow();
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editId  = null;
  confDel = false;
}

// ── КНОПКИ В МОДАЛКЕ ─────────────────────────────────────────────

function renderBtnRow() {
  const row = document.getElementById('btn-row');

  if (editId && !confDel) {
    row.innerHTML = `
      <button class="btn-danger"    onclick="startConfirmDel()">Удалить</button>
      <button class="btn-secondary" onclick="closeModal()">Отмена</button>
      <button class="btn-primary"   onclick="saveAppointment()">Сохранить</button>`;

  } else if (editId && confDel) {
    row.innerHTML = `
      <div class="confirm-panel">
        <span class="confirm-text">Удалить запись?</span>
        <button class="btn-danger"    style="padding:8px 16px" onclick="deleteAppointment()">Да</button>
        <button class="btn-secondary" style="padding:8px 16px;flex:none" onclick="cancelConfirmDel()">Нет</button>
      </div>`;

  } else {
    row.innerHTML = `
      <button class="btn-secondary" onclick="closeModal()">Отмена</button>
      <button class="btn-primary"   onclick="saveAppointment()">Добавить</button>`;
  }
}

function startConfirmDel()  { confDel = true;  renderBtnRow(); }
function cancelConfirmDel() { confDel = false; renderBtnRow(); }

// ── СОХРАНЕНИЕ / УДАЛЕНИЕ ─────────────────────────────────────────

function saveAppointment() {
  const name  = document.getElementById('f-name').value.trim();
  const phone = document.getElementById('f-phone').value;

  // Валидация
  let hasError = false;
  if (!name) {
    document.getElementById('f-name').classList.add('err');
    showFormErr('Введите имя клиента');
    hasError = true;
  } else {
    document.getElementById('f-name').classList.remove('err');
  }
  if (!isPhoneComplete(phone)) {
    document.getElementById('f-phone').classList.add('err');
    if (!hasError) showFormErr('Введите корректный номер (+7 и 10 цифр)');
    hasError = true;
  } else {
    document.getElementById('f-phone').classList.remove('err');
  }
  if (hasError) return;

  hideFormErr();

  const appointmentData = {
    clientName: name,
    phone,
    date:      document.getElementById('f-date').value,
    time:      document.getElementById('f-time').value,
    serviceId: +document.getElementById('f-service').value,
    masterId:  +document.getElementById('f-master').value,
    status:    document.getElementById('f-status').value,
    notes:     document.getElementById('f-notes').value,
  };

  if (editId) {
    apps = apps.map(a => a.id === editId ? { ...appointmentData, id: editId } : a);
    showToast('Запись обновлена');
  } else {
    apps.push({ ...appointmentData, id: Date.now() });
    showToast('Запись добавлена');
  }

  saveData();
  closeModal();
  render();
}

function deleteAppointment() {
  apps = apps.filter(a => a.id !== editId);
  saveData();
  showToast('Запись удалена', 'error');
  closeModal();
  render();
}

// ── ОШИБКИ ФОРМЫ ─────────────────────────────────────────────────

function showFormErr(msg) {
  const el = document.getElementById('form-err');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideFormErr() {
  const el = document.getElementById('form-err');
  el.style.display = 'none';
  el.textContent = '';
}
