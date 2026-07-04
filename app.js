// Калькулятор шансов на грант — статический сайт, вся логика на клиенте.
// Формула вероятности НЕ дублируется здесь: probability_curve уже
// предвычислена в Python (score_engine.py) при сборке датасета, здесь
// только индексация массива по баллу.

const DATA_FILES = [
  "specialties", "universities", "rural_quota_specialties",
  "paths", "group_paths", "ped_quota_info",
];

// ---------- Локализация (RU/KK) ----------
// Казахские формулировки квот (кроме пед-квоты) сверены с постановлениями
// adilet.zan.kz (Правила присуждения образовательного гранта, приказ о
// размере квоты приёма) — см. GROUP_QUOTA_LABELS ниже. Для пед-квоты
// официального краткого термина в актах нет, использовано описательное
// "Педагогикалық мамандықтар квотасы".
const I18N = {
  ru: {
    "nav.calculator": "Калькулятор",
    "nav.specialties": "Специальности",
    "nav.universities": "Вузы",
    "footer.disclaimer": "Данные: официальный список обладателей грантов 2023–2025 годов, приказы о распределении грантов 2024–2027, testcenter.kz, eduser.app. Оценки — эвристика на основе тренда прошлых лет, не гарантия поступления.",
    "calc.title": "Калькулятор шансов на грант",
    "calc.lede": "Оценка построена на реальных данных победителей 2023–2025 годов (тренд балла по годам) и актуальном количестве грантов на 2026-2027 учебный год. Это эвристика, а не гарантия — используй как ориентир, а не точный прогноз.",
    "calc.step1": "Профильные предметы ЕНТ",
    "calc.comboPlaceholder": "Выбери комбинацию предметов",
    "calc.comboHint": "Комбинация уже фиксирована тем, что ты сдавал(а) — выбери свою пару.",
    "calc.step2": "Балл ЕНТ (суммарный)",
    "calc.scorePlaceholder": "Например, 105",
    "calc.step3": "Квоты",
    "calc.ruralLabel": "У меня есть сельская квота",
    "calc.ruralHint": "Показывает отдельно шанс по сельской квоте и по общему конкурсу — они считаются независимо.",
    "calc.otherQuotasHint": "Эти квоты участвуют, только если не проходишь по общему конкурсу — оценка даётся по всей группе специальностей, не по одной ГОП.",
    "calc.submit": "Показать шансы",
    "results.title": "Результаты",
    "results.allUniversities": "Все вузы",
    "results.allSpecialties": "Все специальности",
    "results.searchPlaceholder": "Поиск...",
    "results.count": "{n} из {total}",
    "results.emptyCombo": "По этой комбинации предметов специальностей не найдено.",
    "results.emptyFilter": "Нет результатов с таким сочетанием фильтров.",
    "results.disclaimer": "Оценка — эвристика на основе тренда баллов реальных победителей 2023–2025 годов и изменения числа грантов в 2026-2027 году. Педагогическая квота (если применима к специальности) не учитывается в процентах — по ней нет исторических проходных баллов, только количество мест: {list}.",
    "results.noPedData": "нет данных",
    "results.pedPlaces": "{code} — {n} мест",
    "path.lowSample": "мало данных",
    "path.year": "Год",
    "path.cutoffCol": "Проходной",
    "path.minMaxCol": "Мин–Макс",
    "path.winnersCol": "Победителей",
    "path.onlyYear": "Данные только за {year} год.",
    "path.cutoffAt": "проходной балл {year}",
    "path.cutoffLabel": "проходной",
    "path.scoreRange": "диапазон баллов",
    "path.median": "медиана",
    "path.winnersIn": "победителей в {year}",
    "path.trendMore": "грантов больше, чем в прошлом году ({from} → {to})",
    "path.trendLess": "грантов меньше, чем в прошлом году ({from} → {to})",
    "path.trendNone": "нет данных о смене числа грантов",
    "path.trendNote": "В 2026-2027 году {trend}.",
    "quota.general": "Общий конкурс",
    "quota.rural": "Сельская квота",
    "confidence.high": "Высокий шанс",
    "confidence.medium": "Средний шанс",
    "confidence.low": "Низкий шанс",
    "groupSection.title": "Другие квоты (по группе специальностей)",
    "groupSection.hint": "Эти квоты выделяются на всю группу специальностей, а не на конкретный вуз или ГОП — участвуешь в них, только если не прошёл(а) по общему конкурсу.",
    "groupSection.group": "Группа {code}",
    "specialtiesList.title": "Специальности",
    "specialtiesList.lede": "Проходные баллы 2025 года и профильные предметы по каждой специальности.",
    "specialtiesList.searchPlaceholder": "Поиск по коду или названию...",
    "specialtiesList.allSpecialties": "Все специальности",
    "specialtiesList.allSubjects": "Все комбинации предметов",
    "specialtiesList.code": "Код",
    "specialtiesList.specialty": "Специальность",
    "specialtiesList.subjects": "Предметы",
    "cutoffTable.university": "Вуз",
    "cutoffTable.specialty": "Специальность",
    "cutoffTable.cutoff2025": "Проходной 2025",
    "cutoffTable.minMaxByYear": "Мин–Макс по годам",
    "cutoffTable.median": "Медиана",
    "cutoffTable.winners": "Победителей",
    "cutoffTable.noData": "Нет данных за 2025 год.",
    "specialtyDetail.subjects": "Профильные предметы: {combo}",
    "specialtyDetail.grants": "Грантов на 2026-2027: {n}",
    "specialtyDetail.backLink": "← Все специальности",
    "specialtyDetail.notFound": "Специальность не найдена.",
    "universitiesList.title": "Вузы",
    "universitiesList.lede": "Проходные баллы 2025 года по специальностям каждого вуза.",
    "universitiesList.searchPlaceholder": "Поиск по коду, названию или региону...",
    "universitiesList.allUniversities": "Все вузы",
    "universitiesList.allRegions": "Все регионы",
    "universitiesList.code": "Код",
    "universitiesList.university": "Вуз",
    "universitiesList.region": "Регион",
    "universityDetail.code": "Код ОВПО: {code}",
    "universityDetail.dormitory": "Общежитие: {value}",
    "universityDetail.militaryDept": "Военная кафедра: {value}",
    "universityDetail.yes": "есть",
    "universityDetail.no": "нет",
    "universityDetail.backLink": "← Все вузы",
    "universityDetail.notFound": "Вуз не найден.",
    "common.backToList": "Назад к списку",
    "common.notFoundPage": "Страница не найдена.",
    "common.home": "На главную",
    "theme.toLight": "Включить светлую тему",
    "theme.toDark": "Включить тёмную тему",
    "lang.toggle": "ҚАЗ",
  },
  kk: {
    "nav.calculator": "Калькулятор",
    "nav.specialties": "Мамандықтар",
    "nav.universities": "ЖОО-лар",
    "footer.disclaimer": "Деректер: 2023–2025 жылдардағы білім гранттарын иеленушілердің ресми тізімі, 2024–2027 жылдардағы гранттарды бөлу туралы бұйрықтар, testcenter.kz, eduser.app. Бағалау — өткен жылдардың трендіне негізделген эвристика, түсуге кепілдік емес.",
    "calc.title": "Грантқа түсу мүмкіндігін есептеу",
    "calc.lede": "Бағалау 2023–2025 жылдардағы грант иегерлерінің нақты деректеріне (жылдар бойынша балл трендіне) және 2026-2027 оқу жылына бөлінген грант санына негізделген. Бұл — эвристика, кепілдік емес, бағдар ретінде ғана пайдалан.",
    "calc.step1": "ҰБТ бойынша профильді пәндер",
    "calc.comboPlaceholder": "Пәндер комбинациясын таңда",
    "calc.comboHint": "Комбинация сен тапсырған пәндермен анықталады — өз жұбыңды таңда.",
    "calc.step2": "ҰБТ балы (жалпы сомасы)",
    "calc.scorePlaceholder": "Мысалы, 105",
    "calc.step3": "Квоталар",
    "calc.ruralLabel": "Менде ауыл квотасы бар",
    "calc.ruralHint": "Ауыл квотасы және жалпы конкурс бойынша мүмкіндік бөлек көрсетіледі — олар тәуелсіз есептеледі.",
    "calc.otherQuotasHint": "Бұл квоталар тек жалпы конкурстан өтпеген жағдайда қолданылады — бағалау бір ГОП бойынша емес, бүкіл мамандықтар тобы бойынша беріледі.",
    "calc.submit": "Мүмкіндікті көрсету",
    "results.title": "Нәтижелер",
    "results.allUniversities": "Барлық ЖОО-лар",
    "results.allSpecialties": "Барлық мамандықтар",
    "results.searchPlaceholder": "Іздеу...",
    "results.count": "{total} ішінен {n}",
    "results.emptyCombo": "Бұл пәндер комбинациясы бойынша мамандық табылмады.",
    "results.emptyFilter": "Осы сүзгі тіркесімі бойынша нәтиже жоқ.",
    "results.disclaimer": "Бағалау — 2023–2025 жылдардағы нақты грант иегерлерінің балл трендіне және 2026-2027 жылғы грант санының өзгеруіне негізделген эвристика. Педагогикалық квота (мамандыққа қатысты болса) пайызға есептелмейді — ол бойынша тарихи өту балы жоқ, тек орын саны: {list}.",
    "results.noPedData": "деректер жоқ",
    "results.pedPlaces": "{code} — {n} орын",
    "path.lowSample": "деректер аз",
    "path.year": "Жыл",
    "path.cutoffCol": "Өту балы",
    "path.minMaxCol": "Мин–Макс",
    "path.winnersCol": "Грант алғандар",
    "path.onlyYear": "Тек {year} жылға деректер бар.",
    "path.cutoffAt": "{year} жылғы өту балы",
    "path.cutoffLabel": "өту балы",
    "path.scoreRange": "балл аралығы",
    "path.median": "медиана",
    "path.winnersIn": "{year} жылғы грант алғандар",
    "path.trendMore": "өткен жылмен салыстырғанда грант көп ({from} → {to})",
    "path.trendLess": "өткен жылмен салыстырғанда грант аз ({from} → {to})",
    "path.trendNone": "грант санының өзгеруі туралы дерек жоқ",
    "path.trendNote": "2026-2027 жылы {trend}.",
    "quota.general": "Жалпы конкурс",
    "quota.rural": "Ауыл квотасы",
    "confidence.high": "Жоғары мүмкіндік",
    "confidence.medium": "Орташа мүмкіндік",
    "confidence.low": "Төмен мүмкіндік",
    "groupSection.title": "Басқа квоталар (мамандықтар тобы бойынша)",
    "groupSection.hint": "Бұл квоталар нақты ЖОО немесе ГОП-қа емес, бүкіл мамандықтар тобына бөлінеді — оларға тек жалпы конкурстан өтпеген жағдайда қатысасың.",
    "groupSection.group": "{code} тобы",
    "specialtiesList.title": "Мамандықтар",
    "specialtiesList.lede": "2025 жылғы өту баллдары және әр мамандықтың профильді пәндері.",
    "specialtiesList.searchPlaceholder": "Код немесе атауы бойынша іздеу...",
    "specialtiesList.allSpecialties": "Барлық мамандықтар",
    "specialtiesList.allSubjects": "Барлық пән комбинациялары",
    "specialtiesList.code": "Код",
    "specialtiesList.specialty": "Мамандық",
    "specialtiesList.subjects": "Пәндер",
    "cutoffTable.university": "ЖОО",
    "cutoffTable.specialty": "Мамандық",
    "cutoffTable.cutoff2025": "2025 өту балы",
    "cutoffTable.minMaxByYear": "Жылдар бойынша мин–макс",
    "cutoffTable.median": "Медиана",
    "cutoffTable.winners": "Грант алғандар",
    "cutoffTable.noData": "2025 жылға деректер жоқ.",
    "specialtyDetail.subjects": "Профильді пәндер: {combo}",
    "specialtyDetail.grants": "2026-2027 грант саны: {n}",
    "specialtyDetail.backLink": "← Барлық мамандықтар",
    "specialtyDetail.notFound": "Мамандық табылмады.",
    "universitiesList.title": "ЖОО-лар",
    "universitiesList.lede": "Әр ЖОО-ның мамандықтары бойынша 2025 жылғы өту баллдары.",
    "universitiesList.searchPlaceholder": "Код, атауы немесе аймақ бойынша іздеу...",
    "universitiesList.allUniversities": "Барлық ЖОО-лар",
    "universitiesList.allRegions": "Барлық аймақтар",
    "universitiesList.code": "Код",
    "universitiesList.university": "ЖОО",
    "universitiesList.region": "Аймақ",
    "universityDetail.code": "ОВПО коды: {code}",
    "universityDetail.dormitory": "Жатақхана: {value}",
    "universityDetail.militaryDept": "Әскери кафедра: {value}",
    "universityDetail.yes": "бар",
    "universityDetail.no": "жоқ",
    "universityDetail.backLink": "← Барлық ЖОО-лар",
    "universityDetail.notFound": "ЖОО табылмады.",
    "common.backToList": "Тізімге оралу",
    "common.notFoundPage": "Бет табылмады.",
    "common.home": "Басты бетке",
    "theme.toLight": "Ашық тақырыпқа ауысу",
    "theme.toDark": "Қараңғы тақырыпқа ауысу",
    "lang.toggle": "РУС",
  },
};

// Официальные (adilet.zan.kz) казахские названия квот — краткие формы для
// интерфейса; педагогическая квота — описательный термин (официального
// короткого названия в актах МОН РК нет).
const GROUP_QUOTA_LABELS = {
  ru: {
    disability: "Инвалидность 1-2 группы",
    veteran: "Ветераны боевых действий",
    orphan: "Дети-сироты",
    multi_child_family: "Многодетная семья (4+ детей)",
    incomplete_family: "Неполная семья",
    disabled_family_member: "Семья с ребёнком-инвалидом",
  },
  kk: {
    disability: "Мүгедектігі бар адамдар квотасы",
    veteran: "Ардагерлер квотасы",
    orphan: "Жетім балалар квотасы",
    multi_child_family: "Көп балалы отбасы квотасы",
    incomplete_family: "Толық емес отбасы квотасы",
    disabled_family_member: "Мүгедек баланы тәрбиелеп отырған отбасы",
  },
};

let LANG = localStorage.getItem("lang") || "ru";

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.ru[key] ?? key;
  if (vars) {
    for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  }
  return s;
}

function groupQuotaLabel(id) {
  return (GROUP_QUOTA_LABELS[LANG] && GROUP_QUOTA_LABELS[LANG][id]) || GROUP_QUOTA_LABELS.ru[id] || id;
}

// Название специальности/вуза и пара предметов — на казахском берём поле
// из eduser.app (name_kk/subject_combo_kk), если оно есть; иначе остаёмся
// на русском, а не показываем пусто.
function localizedName(entity) {
  if (!entity) return "";
  if (LANG === "kk" && entity.name_kk) return entity.name_kk;
  return entity.name || entity.full_name || "";
}

// Регион вуза в датасете хранится на казахском (так его отдаёт eduser.app
// по умолчанию) плюс отдельное поле region_ru для русского режима — список
// каталога eduser не переводит регион вообще независимо от локали, перевод
// пришлось забирать отдельным проходом с детальных страниц (см. scrape_eduser.py).
function localizedRegion(entity) {
  if (!entity) return null;
  if (LANG === "ru" && entity.region_ru) return entity.region_ru;
  return entity.region || entity.region_ru || null;
}

// Не у каждой специальности есть свой казахский перевод пары предметов
// (eduser покрывает не 100% кодов), но одну и ту же пару предметов может
// делить много специальностей — если перевод есть хотя бы у одной из них,
// нет причин показывать русский для остальных с ТОЙ ЖЕ парой. Карта
// строится один раз при загрузке данных (см. init()).
let SUBJECT_COMBO_KK_BY_KEY = null;

function buildSubjectComboKkIndex(specialties) {
  const index = new Map();
  for (const code in specialties) {
    const s = specialties[code];
    if (!s.subject_combo || !s.subject_combo_kk) continue;
    const key = [s.subject_combo.subject_1, s.subject_combo.subject_2].sort().join("|");
    if (!index.has(key)) index.set(key, s.subject_combo_kk);
  }
  return index;
}

function localizedSubjectCombo(entity) {
  if (!entity) return null;
  if (LANG !== "kk") return entity.subject_combo || null;
  if (entity.subject_combo_kk) return entity.subject_combo_kk;
  if (entity.subject_combo && SUBJECT_COMBO_KK_BY_KEY) {
    const key = [entity.subject_combo.subject_1, entity.subject_combo.subject_2].sort().join("|");
    const fallback = SUBJECT_COMBO_KK_BY_KEY.get(key);
    if (fallback) return fallback;
  }
  return entity.subject_combo || null;
}

const state = { data: null };

async function loadData() {
  const entries = await Promise.all(
    DATA_FILES.map((name) => fetch(`data/${name}.json`).then((r) => r.json()))
  );
  const data = {};
  DATA_FILES.forEach((name, i) => (data[name] = entries[i]));
  return data;
}

function pct(p) {
  return `${Math.round(p * 100)}%`;
}

function confidenceLabel(p) {
  if (p >= 0.7) return { cls: "high", text: t("confidence.high") };
  if (p >= 0.35) return { cls: "medium", text: t("confidence.medium") };
  return { cls: "low", text: t("confidence.low") };
}

function probabilityAt(curve, score) {
  const idx = Math.max(0, Math.min(140, Math.round(score)));
  return curve[idx];
}

// ---------- Раскрывающийся список с поиском (комбобокс-фильтр) ----------
// Настоящий dropdown: поле со стрелкой, по клику открывается панель со
// своим поисковым полем и списком вариантов ("Все ..." + опции). В отличие
// от текстового автокомплита, это ДИСКРЕТНЫЙ фильтр — выбор одного значения
// сужает список результатов ровно до него, а не просто подсказывает.
function createSearchableSelect(mount, { allLabel, options, onChange }) {
  let selectedValue = "";
  let open = false;

  const root = document.createElement("div");
  root.className = "select-filter";
  root.innerHTML = `
    <button type="button" class="select-filter-trigger">
      <span class="select-filter-label">${escapeHtml(allLabel)}</span>
      <span class="select-filter-arrow">▾</span>
    </button>
    <div class="select-filter-panel" hidden>
      <input type="text" class="select-filter-search" placeholder="${escapeHtml(t("results.searchPlaceholder"))}" autocomplete="off" />
      <div class="select-filter-options"></div>
    </div>
  `;
  mount.appendChild(root);

  const trigger = root.querySelector(".select-filter-trigger");
  const labelEl = root.querySelector(".select-filter-label");
  const panel = root.querySelector(".select-filter-panel");
  const searchInput = root.querySelector(".select-filter-search");
  const optionsEl = root.querySelector(".select-filter-options");

  function renderOptions(filterText) {
    const ft = filterText.trim().toLowerCase();
    // Ищем и по названию, и по коду (o.value) — код может не входить в
    // видимый label (например, у вузов код не дублируется в тексте).
    const filtered = ft
      ? options.filter((o) => o.label.toLowerCase().includes(ft) || o.value.toLowerCase().includes(ft))
      : options;
    const allRow = `<div class="select-filter-option${selectedValue === "" ? " active" : ""}" data-value="">${escapeHtml(allLabel)}</div>`;
    const rows = filtered.map((o) => `
      <div class="select-filter-option${selectedValue === o.value ? " active" : ""}" data-value="${escapeHtml(o.value)}">
        <span>${escapeHtml(o.label)}</span>${o.showCode ? `<span class="code">${escapeHtml(o.value)}</span>` : ""}
      </div>
    `).join("");
    optionsEl.innerHTML = allRow + (rows || `<div class="dropdown-empty">Ничего не найдено</div>`);
  }

  function setOpen(v) {
    open = v;
    panel.hidden = !open;
    trigger.classList.toggle("open", open);
    if (open) {
      renderOptions("");
      searchInput.value = "";
      searchInput.focus();
    }
  }

  trigger.addEventListener("click", () => setOpen(!open));
  searchInput.addEventListener("input", (e) => renderOptions(e.target.value));
  optionsEl.addEventListener("click", (e) => {
    const item = e.target.closest(".select-filter-option[data-value]");
    if (!item) return;
    selectedValue = item.dataset.value;
    const chosen = options.find((o) => o.value === selectedValue);
    labelEl.textContent = chosen ? chosen.label : allLabel;
    setOpen(false);
    onChange(selectedValue);
  });
  document.addEventListener("click", (e) => {
    if (open && !root.contains(e.target)) setOpen(false);
  });

  return {
    reset() {
      selectedValue = "";
      labelEl.textContent = allLabel;
    },
  };
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Для творческих специальностей оба профильных предмета — буквально одна и
// та же запись ('Творческий экзамен' и 'Творческий экзамен') — показывать
// её дважды через "+" читается как баг, а не как две разные дисциплины.
function formatSubjectCombo(combo) {
  if (!combo) return "";
  if (combo.subject_1 === combo.subject_2) return combo.subject_1;
  return `${combo.subject_1} + ${combo.subject_2}`;
}

// ---------- Комбинации предметов ----------

// Ключ комбинации всегда строится по русским названиям предметов (стабилен
// при переключении языка — иначе уже выбранная комбинация "терялась" бы
// при смене RU/KK), а подпись для показа — на текущем языке.
function buildSubjectCombos(specialties) {
  const seen = new Map();
  for (const code in specialties) {
    const combo = specialties[code].subject_combo;
    if (!combo) continue;
    const key = [combo.subject_1, combo.subject_2].sort().join("|");
    if (!seen.has(key)) {
      const localized = localizedSubjectCombo(specialties[code]);
      seen.set(key, { key, a: localized.subject_1, b: localized.subject_2 });
    }
  }
  return [...seen.values()].sort((x, y) => `${x.a}${x.b}`.localeCompare(`${y.a}${y.b}`, "ru"));
}

function specialtiesForCombo(specialties, comboKey) {
  return Object.entries(specialties)
    .filter(([, s]) => {
      if (!s.subject_combo) return false;
      const key = [s.subject_combo.subject_1, s.subject_combo.subject_2].sort().join("|");
      return key === comboKey;
    })
    .map(([code]) => code);
}

// ---------- Роутер ----------

function parseRoute() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  return parts;
}

function navHighlight(routeName) {
  document.querySelectorAll("nav.site-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === routeName);
  });
}

function render() {
  const parts = parseRoute();
  const app = document.getElementById("app");
  if (parts.length === 0) {
    navHighlight("calculator");
    renderCalculator(app);
  } else if (parts[0] === "specialties" && parts[1]) {
    navHighlight("specialties");
    renderSpecialtyDetail(app, decodeURIComponent(parts[1]));
  } else if (parts[0] === "specialties") {
    navHighlight("specialties");
    renderSpecialtiesList(app);
  } else if (parts[0] === "universities" && parts[1]) {
    navHighlight("universities");
    renderUniversityDetail(app, decodeURIComponent(parts[1]));
  } else if (parts[0] === "universities") {
    navHighlight("universities");
    renderUniversitiesList(app);
  } else {
    app.innerHTML = `<p>${t("common.notFoundPage")} <a href="#/">${t("common.home")}</a></p>`;
  }
}

// ---------- Калькулятор ----------

function renderCalculator(app) {
  const { specialties } = state.data;
  const combos = buildSubjectCombos(specialties);

  app.innerHTML = `
    <h1>${t("calc.title")}</h1>
    <p class="lede">${t("calc.lede")}</p>
    <div class="card">
      <form id="calc-form">
        <div class="step">
          <div class="step-label"><span class="num">1</span> ${t("calc.step1")}</div>
          <div class="subject-row">
            <select id="combo-select" required>
              <option value="" disabled selected>${t("calc.comboPlaceholder")}</option>
              ${combos.map((c) => `<option value="${c.key}">${escapeHtml(formatSubjectCombo({ subject_1: c.a, subject_2: c.b }))}</option>`).join("")}
            </select>
          </div>
          <div class="hint">${t("calc.comboHint")}</div>
        </div>
        <div class="step">
          <div class="step-label"><span class="num">2</span> ${t("calc.step2")}</div>
          <input type="number" id="score-input" min="0" max="140" required placeholder="${t("calc.scorePlaceholder")}" />
        </div>
        <div class="step">
          <div class="step-label"><span class="num">3</span> ${t("calc.step3")}</div>
          <div class="checkbox-item">
            <input type="checkbox" id="rural-checkbox" />
            <label for="rural-checkbox">${t("calc.ruralLabel")}</label>
          </div>
          <div class="hint" style="margin-bottom:10px">${t("calc.ruralHint")}</div>
          <div class="checkbox-grid">
            ${Object.keys(GROUP_QUOTA_LABELS.ru).map((id) => `
              <div class="checkbox-item">
                <input type="checkbox" class="other-quota" value="${id}" id="q-${id}" />
                <label for="q-${id}">${groupQuotaLabel(id)}</label>
              </div>`).join("")}
          </div>
          <div class="hint">${t("calc.otherQuotasHint")}</div>
        </div>
        <button type="submit" class="primary">${t("calc.submit")}</button>
      </form>
    </div>
    <div id="results"></div>
  `;

  document.getElementById("calc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const comboKey = document.getElementById("combo-select").value;
    const score = parseFloat(document.getElementById("score-input").value);
    const rural = document.getElementById("rural-checkbox").checked;
    const otherQuotas = [...document.querySelectorAll(".other-quota:checked")].map((el) => el.value);
    renderResults(document.getElementById("results"), { comboKey, score, rural, otherQuotas });
  });
}

function renderResults(container, { comboKey, score, rural, otherQuotas }) {
  const { specialties, paths, group_paths, ped_quota_info } = state.data;
  const gopCodes = new Set(specialtiesForCombo(specialties, comboKey));

  const quotaIds = ["general", ...(rural ? ["rural"] : [])];
  const rows = paths.filter((p) => gopCodes.has(p.gop_code) && quotaIds.includes(p.quota_id));

  const pedByGop = new Map(ped_quota_info.map((p) => [p.gop_code, p]));

  const groupCodesInScope = new Set([...gopCodes].map((c) => specialties[c]?.group_code).filter(Boolean));
  const groupRows = otherQuotas.length
    ? group_paths.filter((g) => groupCodesInScope.has(g.group_code) && otherQuotas.includes(g.quota_id))
    : [];

  if (rows.length === 0) {
    container.innerHTML = `<div class="empty-state">${t("results.emptyCombo")}</div>`;
    return;
  }

  const scored = rows.map((r) => ({ ...r, p: probabilityAt(r.probability_curve, score) }));
  scored.sort((a, b) => b.p - a.p);

  const pedList = [...gopCodes]
    .filter((c) => pedByGop.has(c))
    .map((c) => t("results.pedPlaces", { code: c, n: pedByGop.get(c).grants_2026 }))
    .join(", ") || t("results.noPedData");

  container.innerHTML = `
    <h2>${t("results.title")}</h2>
    <div class="result-controls">
      <div id="university-filter-mount"></div>
      <div id="specialty-filter-mount"></div>
    </div>
    <div class="result-count" id="result-count"></div>
    <div id="result-list"></div>
    ${groupRows.length ? renderGroupQuotaSection(groupRows, score) : ""}
    <div class="disclaimer">${t("results.disclaimer", { list: pedList })}</div>
  `;

  const listEl = document.getElementById("result-list");
  const countEl = document.getElementById("result-count");

  // Два независимых дискретных фильтра-дропдауна (вуз / специальность), а
  // не текстовый поиск: выбор одного варианта СУЖАЕТ список ровно до него,
  // как в обычном фильтре на любом каталожном сайте.
  const universityOptions = [...new Map(
    scored.map((r) => [r.university_code, {
      value: r.university_code,
      label: localizedName({ name: r.university_name, name_kk: r.university_name_kk }),
      showCode: true,
    }])
  ).values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));

  const specialtyOptions = [...new Map(
    scored.map((r) => [r.gop_code, { value: r.gop_code, label: `${r.gop_code} — ${localizedName(specialties[r.gop_code])}` }])
  ).values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));

  const filterState = { university: "", specialty: "" };

  function draw() {
    const filtered = scored.filter((r) =>
      (!filterState.university || r.university_code === filterState.university) &&
      (!filterState.specialty || r.gop_code === filterState.specialty)
    );
    countEl.textContent = t("results.count", { n: filtered.length, total: scored.length });
    listEl.innerHTML = filtered.length
      ? filtered.map((r) => renderPathCard(r, specialties)).join("")
      : `<div class="empty-state">${t("results.emptyFilter")}</div>`;
  }

  createSearchableSelect(document.getElementById("university-filter-mount"), {
    allLabel: t("results.allUniversities"),
    options: universityOptions,
    onChange: (value) => { filterState.university = value; draw(); },
  });
  createSearchableSelect(document.getElementById("specialty-filter-mount"), {
    allLabel: t("results.allSpecialties"),
    options: specialtyOptions,
    onChange: (value) => { filterState.specialty = value; draw(); },
  });

  draw();
}

function renderPathCard(r, specialties) {
  const conf = confidenceLabel(r.p);
  const spName = localizedName(specialties[r.gop_code]) || r.gop_code;
  const uniName = localizedName({ name: r.university_name, name_kk: r.university_name_kk });
  const quotaLabel = r.quota_id === "rural" ? t("quota.rural") : t("quota.general");
  const rangeSpan = Math.max(1, r.max_2025 - r.min_2025);
  const cutoffPos = ((r.cutoff_2025 - r.min_2025) / rangeSpan) * 100;
  const latestYear = r.data_years ? r.data_years[r.data_years.length - 1] : 2025;
  const yearsNote = r.yearly && r.yearly.length > 1
    ? `
        <table class="stat-table yearly-table">
          <thead><tr><th>${t("path.year")}</th><th>${t("path.cutoffCol")}</th><th>${t("path.minMaxCol")}</th><th>${t("path.winnersCol")}</th></tr></thead>
          <tbody>
            ${r.yearly.map((y) => `<tr><td>${y.year}</td><td>${y.cutoff}</td><td>${y.min}–${y.max}</td><td>${y.count}</td></tr>`).join("")}
          </tbody>
        </table>
      `
    : `<p class="hint">${t("path.onlyYear", { year: latestYear })}</p>`;
  const trend = r.grants_2025 && r.grants_2026
    ? (r.grants_2026 >= r.grants_2025
        ? t("path.trendMore", { from: r.grants_2025, to: r.grants_2026 })
        : t("path.trendLess", { from: r.grants_2025, to: r.grants_2026 }))
    : t("path.trendNone");

  return `
    <details class="path-card">
      <summary>
        <div class="path-main">
          <div class="path-uni">${escapeHtml(uniName)}</div>
          <div class="path-sub">${escapeHtml(r.gop_code)} · ${escapeHtml(spName)}${r.low_sample ? `<span class="badge-note">${t("path.lowSample")}</span>` : ""}</div>
        </div>
        <div class="path-badges">
          <span class="badge-quota ${r.quota_id}">${quotaLabel}</span>
          <span class="badge ${conf.cls}">${pct(r.p)} · ${conf.text}</span>
        </div>
      </summary>
      <div class="path-details">
        <div class="detail-grid">
          <div><b>${r.cutoff_2025}</b><span>${t("path.cutoffAt", { year: latestYear })}</span></div>
          <div><b>${r.min_2025}–${r.max_2025}</b><span>${t("path.scoreRange")}</span></div>
          <div><b>${r.median_2025}</b><span>${t("path.median")}</span></div>
          <div><b>${r.winners_count_2025}</b><span>${t("path.winnersIn", { year: latestYear })}</span></div>
        </div>
        <div class="range-track">
          <div class="range-fill" style="left:0; width:${cutoffPos}%"></div>
          <div class="range-marker" style="left:${cutoffPos}%"></div>
        </div>
        <div class="range-labels"><span>${r.min_2025}</span><span>${t("path.cutoffLabel")}: ${r.cutoff_2025}</span><span>${r.max_2025}</span></div>
        ${yearsNote}
        <p class="hint">${t("path.trendNote", { trend })}</p>
      </div>
    </details>
  `;
}

function renderGroupQuotaSection(groupRows, score) {
  const scored = groupRows.map((g) => ({ ...g, p: probabilityAt(g.probability_curve, score) }));
  scored.sort((a, b) => b.p - a.p);
  return `
    <h2>${t("groupSection.title")}</h2>
    <p class="hint">${t("groupSection.hint")}</p>
    ${scored.map((g) => `
      <details class="path-card">
        <summary>
          <div class="path-main">
            <div class="path-uni">${escapeHtml(groupQuotaLabel(g.quota_id))}</div>
            <div class="path-sub">${escapeHtml(t("groupSection.group", { code: g.group_code }))}${g.low_sample ? `<span class="badge-note">${t("path.lowSample")}</span>` : ""}</div>
          </div>
          <span class="badge ${confidenceLabel(g.p).cls}">${pct(g.p)} · ${confidenceLabel(g.p).text}</span>
        </summary>
        <div class="path-details">
          <div class="detail-grid">
            <div><b>${g.cutoff_2025}</b><span>${t("path.cutoffAt", { year: 2025 })}</span></div>
            <div><b>${g.min_2025}–${g.max_2025}</b><span>${t("path.scoreRange")}</span></div>
            <div><b>${g.winners_count_2025}</b><span>${t("path.winnersIn", { year: 2025 })}</span></div>
          </div>
        </div>
      </details>
    `).join("")}
  `;
}

// ---------- Списки/страницы статистики ----------

function renderSpecialtiesList(app) {
  const { specialties } = state.data;
  const items = Object.entries(specialties).sort((a, b) => a[0].localeCompare(b[0]));

  const specialtyOptions = items.map(([code, s]) => ({ value: code, label: `${code} — ${localizedName(s)}` }));
  const comboOptions = buildSubjectCombos(specialties).map((c) => ({
    value: c.key,
    label: formatSubjectCombo({ subject_1: c.a, subject_2: c.b }),
  }));

  app.innerHTML = `
    <h1>${t("specialtiesList.title")}</h1>
    <p class="lede">${t("specialtiesList.lede")}</p>
    <div class="search-page">
      <div class="result-controls">
        <div id="specialty-filter-mount"></div>
        <div id="combo-filter-mount"></div>
      </div>
      <div id="list"></div>
    </div>
  `;
  const listEl = document.getElementById("list");
  const filterState = { specialty: "", combo: "" };

  function draw() {
    const filtered = items.filter(([code, s]) => {
      if (filterState.specialty && code !== filterState.specialty) return false;
      if (filterState.combo) {
        const combo = s.subject_combo;
        const key = combo ? [combo.subject_1, combo.subject_2].sort().join("|") : "";
        if (key !== filterState.combo) return false;
      }
      return true;
    });
    listEl.innerHTML = `
      <table class="stat-table">
        <thead><tr><th>${t("specialtiesList.code")}</th><th>${t("specialtiesList.specialty")}</th><th>${t("specialtiesList.subjects")}</th></tr></thead>
        <tbody>
          ${filtered.map(([code, s]) => `
            <tr>
              <td><a href="#/specialties/${code}">${code}</a></td>
              <td><a href="#/specialties/${code}">${escapeHtml(localizedName(s))}</a></td>
              <td>${s.subject_combo ? escapeHtml(formatSubjectCombo(localizedSubjectCombo(s))) : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  createSearchableSelect(document.getElementById("specialty-filter-mount"), {
    allLabel: t("specialtiesList.allSpecialties"),
    options: specialtyOptions,
    onChange: (value) => { filterState.specialty = value; draw(); },
  });
  createSearchableSelect(document.getElementById("combo-filter-mount"), {
    allLabel: t("specialtiesList.allSubjects"),
    options: comboOptions,
    onChange: (value) => { filterState.combo = value; draw(); },
  });

  draw();
}

// Общий конкурс и сельская квота считаются и показываются раздельно (см.
// калькулятор) — университет может не иметь ни одного победителя по общему
// конкурсу, но иметь их по сельской квоте, и наоборот. Показывать только
// одну из таблиц значит молча терять часть вузов.
function renderYearlyBreakdown(yearly) {
  if (!yearly || yearly.length < 2) return "";
  return yearly.map((y) => `<div>${y.year}: ${y.min}–${y.max}</div>`).join("");
}

function renderCutoffTable(rows, { linkTo, labelFn }) {
  if (!rows.length) return `<p class="hint">${t("cutoffTable.noData")}</p>`;
  const sorted = [...rows].sort((a, b) => a.cutoff_2025 - b.cutoff_2025);
  const headLabel = linkTo === "universities" ? t("cutoffTable.university") : t("cutoffTable.specialty");
  return `
    <table class="stat-table">
      <thead><tr><th>${headLabel}</th><th>${t("cutoffTable.cutoff2025")}</th><th>${t("cutoffTable.minMaxByYear")}</th><th>${t("cutoffTable.median")}</th><th>${t("cutoffTable.winners")}</th></tr></thead>
      <tbody>
        ${sorted.map((r) => `
          <tr>
            <td><a href="#/${linkTo}/${linkTo === "universities" ? r.university_code : r.gop_code}">${escapeHtml(labelFn(r))}</a></td>
            <td>${r.cutoff_2025}</td>
            <td>${renderYearlyBreakdown(r.yearly) || `${r.min_2025}–${r.max_2025}`}</td>
            <td>${r.median_2025}</td>
            <td>${r.winners_count_2025}${r.low_sample ? ` <span class="badge-note">${t("path.lowSample")}</span>` : ""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderSpecialtyDetail(app, code) {
  const { specialties, paths } = state.data;
  const sp = specialties[code];
  if (!sp) {
    app.innerHTML = `<p>${t("specialtyDetail.notFound")} <a href="#/specialties">${t("common.backToList")}</a></p>`;
    return;
  }
  const general = paths.filter((p) => p.gop_code === code && p.quota_id === "general");
  const rural = paths.filter((p) => p.gop_code === code && p.quota_id === "rural");
  const labelFn = (r) => localizedName({ name: r.university_name, name_kk: r.university_name_kk });

  app.innerHTML = `
    <h1>${code} — ${escapeHtml(localizedName(sp))}</h1>
    <p class="lede">${sp.subject_combo ? t("specialtyDetail.subjects", { combo: escapeHtml(formatSubjectCombo(localizedSubjectCombo(sp))) }) : ""}
      · ${t("specialtyDetail.grants", { n: sp.full_time ?? "—" })}</p>
    <h2>${t("quota.general")}</h2>
    ${renderCutoffTable(general, { linkTo: "universities", labelFn })}
    ${rural.length ? `<h2>${t("quota.rural")}</h2>${renderCutoffTable(rural, { linkTo: "universities", labelFn })}` : ""}
    <p style="margin-top:20px"><a href="#/specialties">${t("specialtyDetail.backLink")}</a></p>
  `;
}

function renderUniversitiesList(app) {
  const { universities } = state.data;
  const items = [...universities].sort((a, b) => localizedName(a).localeCompare(localizedName(b), "ru"));

  const universityOptions = items.map((u) => ({ value: u.code, label: localizedName(u), showCode: true }));
  const regionByKey = new Map();
  for (const u of items) {
    if (u.region && !regionByKey.has(u.region)) regionByKey.set(u.region, localizedRegion(u));
  }
  const regionOptions = [...regionByKey.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .map(([key, label]) => ({ value: key, label }));

  app.innerHTML = `
    <h1>${t("universitiesList.title")}</h1>
    <p class="lede">${t("universitiesList.lede")}</p>
    <div class="search-page">
      <div class="result-controls">
        <div id="university-filter-mount"></div>
        <div id="region-filter-mount"></div>
      </div>
      <div id="list"></div>
    </div>
  `;
  const listEl = document.getElementById("list");
  const filterState = { university: "", region: "" };

  function draw() {
    const filtered = items.filter((u) =>
      (!filterState.university || u.code === filterState.university) &&
      (!filterState.region || u.region === filterState.region)
    );
    listEl.innerHTML = `
      <table class="stat-table">
        <thead><tr><th>${t("universitiesList.code")}</th><th>${t("universitiesList.university")}</th><th>${t("universitiesList.region")}</th></tr></thead>
        <tbody>
          ${filtered.map((u) => `
            <tr>
              <td><a href="#/universities/${u.code}">${u.code}</a></td>
              <td><a href="#/universities/${u.code}">${escapeHtml(localizedName(u))}</a></td>
              <td>${escapeHtml(localizedRegion(u) || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  createSearchableSelect(document.getElementById("university-filter-mount"), {
    allLabel: t("universitiesList.allUniversities"),
    options: universityOptions,
    onChange: (value) => { filterState.university = value; draw(); },
  });
  createSearchableSelect(document.getElementById("region-filter-mount"), {
    allLabel: t("universitiesList.allRegions"),
    options: regionOptions,
    onChange: (value) => { filterState.region = value; draw(); },
  });

  draw();
}

function renderUniversityDetail(app, code) {
  const { universities, paths, specialties } = state.data;
  const uni = universities.find((u) => u.code === code);
  if (!uni) {
    app.innerHTML = `<p>${t("universityDetail.notFound")} <a href="#/universities">${t("common.backToList")}</a></p>`;
    return;
  }
  const general = paths.filter((p) => p.university_code === code && p.quota_id === "general");
  const rural = paths.filter((p) => p.university_code === code && p.quota_id === "rural");
  const labelFn = (r) => `${r.gop_code} — ${localizedName(specialties[r.gop_code])}`;

  const dormText = uni.dormitory ? t("universityDetail.dormitory", { value: uni.dormitory === "Иә" ? t("universityDetail.yes") : t("universityDetail.no") }) : "";
  const militaryText = uni.military_department ? t("universityDetail.militaryDept", { value: uni.military_department === "Иә" ? t("universityDetail.yes") : t("universityDetail.no") }) : "";

  app.innerHTML = `
    <h1>${escapeHtml(localizedName(uni))}</h1>
    <p class="lede">${t("universityDetail.code", { code: uni.code })}${localizedRegion(uni) ? ` · ${escapeHtml(localizedRegion(uni))}` : ""}${dormText ? ` · ${dormText}` : ""}${militaryText ? ` · ${militaryText}` : ""}</p>
    <h2>${t("quota.general")}</h2>
    ${renderCutoffTable(general, { linkTo: "specialties", labelFn })}
    ${rural.length ? `<h2>${t("quota.rural")}</h2>${renderCutoffTable(rural, { linkTo: "specialties", labelFn })}` : ""}
    <p style="margin-top:20px"><a href="#/universities">${t("universityDetail.backLink")}</a></p>
  `;
}

// ---------- Инициализация ----------

// ---------- Тема ----------

function applyTheme(theme) {
  const btn = document.getElementById("theme-toggle");
  document.documentElement.dataset.theme = theme;
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
  btn.title = theme === "dark" ? t("theme.toLight") : t("theme.toDark");
}

function setupThemeToggle() {
  applyTheme(document.documentElement.dataset.theme || "light");
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

// ---------- Язык ----------
// Статические куски (шапка/подвал) обновляются через data-i18n атрибуты в
// index.html; всё остальное — через полный re-render() текущего маршрута,
// т.к. app.innerHTML и так каждый раз строится через t() заново.
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

function setupLanguageToggle() {
  const btn = document.getElementById("lang-toggle");
  const apply = () => {
    btn.textContent = t("lang.toggle");
    applyStaticI18n();
  };
  apply();
  btn.addEventListener("click", () => {
    LANG = LANG === "ru" ? "kk" : "ru";
    localStorage.setItem("lang", LANG);
    apply();
    applyTheme(document.documentElement.dataset.theme || "light"); // обновляет title на новом языке
    render();
  });
}

async function init() {
  setupThemeToggle();
  applyStaticI18n();
  document.getElementById("app").innerHTML = `<p class="lede">Загрузка данных...</p>`;
  state.data = await loadData();
  SUBJECT_COMBO_KK_BY_KEY = buildSubjectComboKkIndex(state.data.specialties);
  setupLanguageToggle();
  window.addEventListener("hashchange", render);
  render();
}

init();
