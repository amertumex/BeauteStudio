/* ══════════════════════════════════════
   КОНСТАНТЫ — services, masters, statuses, time slots
   Используются во всех остальных файлах
══════════════════════════════════════ */

const SERVICES = [
  { id:1, name:'Стрижка женская', duration:60,  price:1500 },
  { id:2, name:'Стрижка мужская', duration:30,  price:800  },
  { id:3, name:'Окрашивание',     duration:120, price:3500 },
  { id:4, name:'Маникюр',         duration:90,  price:1200 },
  { id:5, name:'Педикюр',         duration:90,  price:1400 },
  { id:6, name:'Макияж',          duration:60,  price:2000 },
  { id:7, name:'Брови',           duration:45,  price:700  },
  { id:8, name:'Ресницы',         duration:120, price:2500 },
];

const MASTERS = [
  { id:1, name:'Анна Соколова',  speciality:'Парикмахер',      color:'#e8a598' },
  { id:2, name:'Мария Петрова',  speciality:'Мастер маникюра', color:'#98c5e8' },
  { id:3, name:'Елена Козлова',  speciality:'Визажист',        color:'#a8d5a2' },
  { id:4, name:'Ольга Новикова', speciality:'Бровист',         color:'#d4a8e8' },
];

const STATUS = {
  confirmed: { bg:'#d4edda', text:'#155724', label:'Подтверждено' },
  pending:   { bg:'#fff3cd', text:'#856404', label:'Ожидает'      },
  cancelled: { bg:'#f8d7da', text:'#721c24', label:'Отменено'     },
  completed: { bg:'#cce5ff', text:'#004085', label:'Завершено'    },
};

// Временные слоты: 9:00 — 19:30, шаг 30 минут
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => i + 9)
  .flatMap(h => [`${h}:00`, `${h}:30`]);
