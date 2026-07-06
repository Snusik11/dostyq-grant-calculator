// Калькулятор шансов на грант — статический сайт, вся логика на клиенте.
// Формула вероятности НЕ дублируется здесь: probability_curve уже
// предвычислена в Python (score_engine.py) при сборке датасета, здесь
// только индексация массива по баллу.

const DATA_FILES = [
  "specialties", "universities", "rural_quota_specialties",
  "paths", "group_paths",
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
    "results.disclaimer": "Оценка — эвристика на основе тренда баллов реальных победителей 2023–2025 годов (edutest.kz — для педагогической квоты и части лет) и изменения числа грантов в 2026-2027 году. Не гарантия поступления.",
    "results.generalGrant": "Общий грант",
    "results.pedQuota": "Педагогическая квота",
    "results.thresholdFiltered": "Показаны только вузы, куда твой балл проходит по порогу допуска.",
    "path.thresholdLabel": "проходной балл (допуск к конкурсу)",
    "path.lastYearMin": "мин. балл победителя {year}",
    "btn.uniCard": "Карточка вуза →",
    "btn.specCard": "Карточка специальности →",
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
    "subjects.foreignLanguage": "Иностранный язык",
    "specialtyDetail.subjects": "Профильные предметы: {combo}",
    "specialtyDetail.grants": "Грантов на 2026-2027: {n}",
    "specialtyDetail.eyebrow": "Специальность (ГОП)",
    "specialtyDetail.grantsLabel": "Грантов на 2026-2027",
    "specialtyDetail.backLink": "← Все специальности",
    "specialtyDetail.notFound": "Специальность не найдена.",
    "specialtyDetail.minMax": "Мин/макс баллы",
    "specialtyDetail.grantCounts": "Количество грантов",
    "specialtyDetail.universitiesSection": "Вузы",
    "specialtyDetail.allUniversities": "Все вузы",
    "specialtyDetail.totalNote": "2026-2027: общий грант {g} + педквота {p} = {total} грантов всего.",
    "path.thresholdCol": "Проходной балл",
    "table.min": "Мин",
    "table.max": "Макс",
    "table.total": "Итого",
    "filter.university": "Вуз",
    "filter.region": "Регион",
    "filter.dormitory": "Общежитие",
    "filter.militaryDept": "Военная кафедра",
    "filter.any": "Неважно",
    "filter.specialty": "Специальность",
    "filter.combo": "Комбинация предметов",
    "universitiesList.title": "Вузы",
    "universitiesList.lede": "Проходные баллы 2025 года по специальностям каждого вуза.",
    "universitiesList.searchPlaceholder": "Поиск по коду, названию или региону...",
    "universitiesList.allUniversities": "Все вузы",
    "universitiesList.allRegions": "Все регионы",
    "universitiesList.code": "Код",
    "universitiesList.university": "Вуз",
    "universitiesList.region": "Регион",
    "universitiesList.dormitory": "Общежитие",
    "universitiesList.militaryDept": "Военная кафедра",
    "universityDetail.eyebrow": "Вуз",
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
    "results.disclaimer": "Бағалау — 2023–2025 жылдардағы нақты грант иегерлерінің балл трендіне (педагогикалық квота және кейбір жылдар үшін — edutest.kz) және 2026-2027 жылғы грант санының өзгеруіне негізделген эвристика. Түсуге кепілдік емес.",
    "results.generalGrant": "Жалпы грант",
    "results.pedQuota": "Педагогикалық квота",
    "results.thresholdFiltered": "Тек балың рұқсат шегінен өтетін ЖОО-лар көрсетілген.",
    "path.thresholdLabel": "өту балы (конкурсқа рұқсат)",
    "path.lastYearMin": "{year} жылғы жеңімпаздың мин. балы",
    "btn.uniCard": "ЖОО картасы →",
    "btn.specCard": "Мамандық картасы →",
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
    "subjects.foreignLanguage": "Шет тілі",
    "specialtyDetail.subjects": "Профильді пәндер: {combo}",
    "specialtyDetail.grants": "2026-2027 грант саны: {n}",
    "specialtyDetail.eyebrow": "Мамандық (ГОП)",
    "specialtyDetail.grantsLabel": "2026-2027 грант саны",
    "specialtyDetail.backLink": "← Барлық мамандықтар",
    "specialtyDetail.notFound": "Мамандық табылмады.",
    "specialtyDetail.minMax": "Мин/макс баллдар",
    "specialtyDetail.grantCounts": "Грант саны",
    "specialtyDetail.universitiesSection": "ЖОО-лар",
    "specialtyDetail.allUniversities": "Барлық ЖОО-лар",
    "specialtyDetail.totalNote": "2026-2027: жалпы грант {g} + педквота {p} = барлығы {total} грант.",
    "path.thresholdCol": "Өту балы",
    "table.min": "Мин",
    "table.max": "Макс",
    "table.total": "Барлығы",
    "filter.university": "ЖОО",
    "filter.region": "Аймақ",
    "filter.dormitory": "Жатақхана",
    "filter.militaryDept": "Әскери кафедра",
    "filter.any": "Маңызды емес",
    "filter.specialty": "Мамандық",
    "filter.combo": "Пәндер комбинациясы",
    "universitiesList.title": "ЖОО-лар",
    "universitiesList.lede": "Әр ЖОО-ның мамандықтары бойынша 2025 жылғы өту баллдары.",
    "universitiesList.searchPlaceholder": "Код, атауы немесе аймақ бойынша іздеу...",
    "universitiesList.allUniversities": "Барлық ЖОО-лар",
    "universitiesList.allRegions": "Барлық аймақтар",
    "universitiesList.code": "Код",
    "universitiesList.university": "ЖОО",
    "universitiesList.region": "Аймақ",
    "universitiesList.dormitory": "Жатақхана",
    "universitiesList.militaryDept": "Әскери кафедра",
    "universityDetail.eyebrow": "ЖОО",
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

// Специальности с несколькими официальными треками (языковые/учебные —
// см. build_dataset.py SUBJECT_COMBOS_XLSX) хранят ИХ ВСЕ в subject_combos,
// каждый уже со своим subject_*_kk — без нужды в фолбэк-индексе выше.
function localizedSubjectCombos(sp) {
  if (!sp) return [];
  const list = (sp.subject_combos && sp.subject_combos.length) ? sp.subject_combos : (sp.subject_combo ? [sp.subject_combo] : []);
  return list.map((c) => (
    LANG === "kk" && c.subject_1_kk && c.subject_2_kk
      ? { subject_1: c.subject_1_kk, subject_2: c.subject_2_kk }
      : { subject_1: c.subject_1, subject_2: c.subject_2 }
  ));
}

// Для 9 специальностей с выбором иностранного языка (англ/нем/фр — B018,
// B035, B036, B039, B040, B091, B093, B135, B140) показывать все 3 варианта
// через "/" нечитаемо. Если выбор языка есть — показываем обобщённо
// "Иностранный язык + X"; если языка нет в выборе (комбинация всего одна) —
// оставляем конкретное название, как есть.
const FOREIGN_LANGUAGE_NAMES = new Set([
  "Английский язык", "Немецкий язык", "Французский язык",
  "Ағылшын тілі", "Неміс тілі", "Француз тілі",
]);

function genericSubjectCombos(sp) {
  const combos = localizedSubjectCombos(sp);
  const isLangChoice = combos.length > 1 && combos.every(
    (c) => FOREIGN_LANGUAGE_NAMES.has(c.subject_1) || FOREIGN_LANGUAGE_NAMES.has(c.subject_2)
  );
  if (!isLangChoice) return combos;
  const first = combos[0];
  const langLabel = t("subjects.foreignLanguage");
  return FOREIGN_LANGUAGE_NAMES.has(first.subject_1)
    ? [{ subject_1: langLabel, subject_2: first.subject_2 }]
    : [{ subject_1: first.subject_1, subject_2: langLabel }];
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
  const { specialties, paths, group_paths } = state.data;
  const gopCodes = new Set(specialtiesForCombo(specialties, comboKey));

  const quotaIds = ["general", ...(rural ? ["rural"] : [])];
  const rows = paths.filter((p) => gopCodes.has(p.gop_code) && quotaIds.includes(p.quota_id));

  const groupCodesInScope = new Set([...gopCodes].map((c) => specialties[c]?.group_code).filter(Boolean));
  const groupRows = otherQuotas.length
    ? group_paths.filter((g) => groupCodesInScope.has(g.group_code) && otherQuotas.includes(g.quota_id))
    : [];

  const scored = rows.map((r) => ({ ...r, p: probabilityAt(r.probability_curve, score) }));

  // Вуз не показывается, если его проходной балл (порог допуска к конкурсу)
  // выше балла ученика — подать документы туда всё равно нельзя. Вузы без
  // известного порога остаются в списке.
  const passesThreshold = (threshold) => threshold == null || score >= threshold;

  // Гранты выделяются на специальность, а не на вуз — сначала группируем
  // по ГОП (общий грант и пед-квота — РАЗНЫЕ пулы, у пед-квоты вузы вообще
  // не участвуют в общем конкурсе на эти же места), внутри уже вузы.
  // Один вуз = одна строка: общий конкурс и сельская квота — два бейджа
  // рядом, а не две отдельные карточки.
  const specialtyGroups = [];
  for (const code of gopCodes) {
    const sp = specialties[code];
    if (!sp) continue;

    const byUni = new Map();
    for (const r of scored.filter((x) => x.gop_code === code)) {
      const m = byUni.get(r.university_code) || {
        university_code: r.university_code,
        university_name: r.university_name,
        university_name_kk: r.university_name_kk,
        threshold_score: r.threshold_score,
        general: null, rural: null, pGeneral: null, pRural: null,
      };
      m.threshold_score = m.threshold_score ?? r.threshold_score;
      if (r.quota_id === "rural") { m.rural = r; m.pRural = r.p; }
      else { m.general = r; m.pGeneral = r.p; }
      byUni.set(r.university_code, m);
    }
    const generalRows = [...byUni.values()]
      .filter((m) => passesThreshold(m.threshold_score))
      .sort((a, b) => Math.max(b.pGeneral ?? 0, b.pRural ?? 0) - Math.max(a.pGeneral ?? 0, a.pRural ?? 0));

    const pedByUni = (sp.ped_quota && sp.ped_quota.by_university) || {};
    const pedRows = Object.entries(pedByUni).map(([universityCode, u]) => ({
      university_code: universityCode,
      ...u,
      pGeneral: u.probability_curve_general ? probabilityAt(u.probability_curve_general, score) : null,
      pRural: rural && u.probability_curve_rural ? probabilityAt(u.probability_curve_rural, score) : null,
    }))
      .filter((r) => passesThreshold(r.threshold_score))
      .sort((a, b) => Math.max(b.pGeneral ?? 0, b.pRural ?? 0) - Math.max(a.pGeneral ?? 0, a.pRural ?? 0));

    if (generalRows.length === 0 && pedRows.length === 0) continue;

    // Процент самой специальности — по агрегатному порогу общего гранта
    // (кривая предпосчитана на уровне специальности в build_dataset.py).
    const pSpecGeneral = sp.probability_curve_general ? probabilityAt(sp.probability_curve_general, score) : null;
    const pSpecRural = rural && sp.probability_curve_rural ? probabilityAt(sp.probability_curve_rural, score) : null;

    // Тренд числа грантов — свойство специальности (грант выделяется на неё),
    // показывается один раз в шапке, не в каждом вузе.
    const summaryYearly = (sp.general_grant_summary && sp.general_grant_summary.yearly) || [];
    const countsByYear = Object.fromEntries(summaryYearly.filter((y) => y.count != null).map((y) => [y.year, y.count]));

    const bestP = Math.max(pSpecGeneral ?? 0, pSpecRural ?? 0,
      ...generalRows.map((r) => Math.max(r.pGeneral ?? 0, r.pRural ?? 0)),
      ...pedRows.map((r) => Math.max(r.pGeneral ?? 0, r.pRural ?? 0)));
    specialtyGroups.push({ code, sp, generalRows, pedRows, pSpecGeneral, pSpecRural, countsByYear, bestP });
  }
  specialtyGroups.sort((a, b) => Math.max(b.pSpecGeneral ?? 0, b.pSpecRural ?? 0, b.bestP) - Math.max(a.pSpecGeneral ?? 0, a.pSpecRural ?? 0, a.bestP));

  if (specialtyGroups.length === 0) {
    container.innerHTML = `<div class="empty-state">${t("results.emptyCombo")}</div>`;
    return;
  }

  container.innerHTML = `
    <h2>${t("results.title")}</h2>
    <div class="result-controls">
      <div id="university-filter-mount"></div>
      <div id="specialty-filter-mount"></div>
    </div>
    <div class="result-count" id="result-count"></div>
    <p class="hint">${t("results.thresholdFiltered")}</p>
    <div id="result-list"></div>
    ${groupRows.length ? renderGroupQuotaSection(groupRows, score) : ""}
    <div class="disclaimer">${t("results.disclaimer")}</div>
  `;

  const listEl = document.getElementById("result-list");
  const countEl = document.getElementById("result-count");

  const universityOptions = [...new Map(
    specialtyGroups.flatMap((g) => [
      ...g.generalRows.map((r) => [r.university_code, { value: r.university_code, label: localizedName({ name: r.university_name, name_kk: r.university_name_kk }), showCode: true }]),
      ...g.pedRows.map((r) => [r.university_code, { value: r.university_code, label: localizedName({ name: r.university_name, name_kk: r.university_name_kk }), showCode: true }]),
    ])
  ).values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));

  const specialtyOptions = specialtyGroups
    .map((g) => ({ value: g.code, label: `${g.code} — ${localizedName(g.sp)}` }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru"));

  const filterState = { university: "", specialty: "" };

  function draw() {
    const filtered = specialtyGroups
      .filter((g) => !filterState.specialty || g.code === filterState.specialty)
      .map((g) => ({
        ...g,
        generalRows: filterState.university ? g.generalRows.filter((r) => r.university_code === filterState.university) : g.generalRows,
        pedRows: filterState.university ? g.pedRows.filter((r) => r.university_code === filterState.university) : g.pedRows,
      }))
      .filter((g) => g.generalRows.length > 0 || g.pedRows.length > 0);

    countEl.textContent = t("results.count", { n: filtered.length, total: specialtyGroups.length });
    listEl.innerHTML = filtered.length
      ? filtered.map((g) => renderSpecialtyResultCard(g)).join("")
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

// Бейджи "Общий конкурс N%" + "Сельская квота M%" рядом — единый вид и для
// строки вуза, и для заголовка специальности.
function quotaBadges(pGeneral, pRural) {
  const badges = [];
  if (pGeneral != null) {
    const conf = confidenceLabel(pGeneral);
    badges.push(`<span class="badge-quota general">${t("quota.general")}</span><span class="badge ${conf.cls}">${pct(pGeneral)} · ${conf.text}</span>`);
  }
  if (pRural != null) {
    const conf = confidenceLabel(pRural);
    badges.push(`<span class="badge-quota rural">${t("quota.rural")}</span><span class="badge ${conf.cls}">${pct(pRural)} · ${conf.text}</span>`);
  }
  return badges.join("");
}

function grantsTrendNote(countsByYear) {
  const c25 = countsByYear[2025];
  const c26 = countsByYear[2026];
  const trend = c25 != null && c26 != null
    ? (c26 >= c25 ? t("path.trendMore", { from: c25, to: c26 }) : t("path.trendLess", { from: c25, to: c26 }))
    : t("path.trendNone");
  return t("path.trendNote", { trend });
}

function renderSpecialtyResultCard(group) {
  const { code, sp, generalRows, pedRows, pSpecGeneral, pSpecRural, countsByYear } = group;
  const spName = localizedName(sp) || code;
  const combos = genericSubjectCombos(sp);

  return `
    <details class="specialty-result-card">
      <summary class="specialty-result-header">
        <div class="specialty-result-main">
          <div class="specialty-result-title">${escapeHtml(code)} — ${escapeHtml(spName)}</div>
          <div class="combo-tags">${combos.map((c) => `<span class="combo-tag">${escapeHtml(formatSubjectCombo(c))}</span>`).join("")}</div>
        </div>
        <div class="path-badges">${quotaBadges(pSpecGeneral, pSpecRural)}</div>
      </summary>
      <div class="specialty-result-body">
        <p class="hint">${grantsTrendNote(countsByYear)} <a class="card-link" href="#/specialties/${encodeURIComponent(code)}">${t("btn.specCard")}</a></p>
        ${generalRows.length ? `
          <div class="grant-pool">
            <h3 class="grant-pool-title">${t("results.generalGrant")}</h3>
            ${generalRows.map((r) => renderMergedUniRow(r)).join("")}
          </div>
        ` : ""}
        ${pedRows.length ? `
          <div class="grant-pool">
            <h3 class="grant-pool-title">${t("results.pedQuota")}</h3>
            ${pedRows.map((r) => renderPedUniRow(r)).join("")}
          </div>
        ` : ""}
      </div>
    </details>
  `;
}

// Объединяет погодовые истории общего конкурса и сельской квоты одного вуза
// в одну таблицу: год | общий мин–макс | сельский мин–макс | победителей.
function mergePathYearly(generalRow, ruralRow) {
  const byYear = new Map();
  for (const y of (generalRow?.yearly || [])) {
    byYear.set(y.year, { year: y.year, general: { min: y.min, max: y.max }, rural: null, count: y.count });
  }
  for (const y of (ruralRow?.yearly || [])) {
    const e = byYear.get(y.year) || { year: y.year, general: null, rural: null, count: 0 };
    e.rural = { min: y.min, max: y.max };
    e.count = (e.count || 0) + y.count;
    byYear.set(y.year, e);
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

function yearlyQuotaTable(rows) {
  if (!rows.length) return `<p class="hint">${t("cutoffTable.noData")}</p>`;
  return `
    <div class="table-scroll">
    <table class="stat-table yearly-table">
      <thead><tr><th>${t("path.year")}</th><th class="th-general">${t("quota.general")}</th><th class="th-rural">${t("quota.rural")}</th><th>${t("path.winnersCol")}</th></tr></thead>
      <tbody>
        ${rows.map((y) => `<tr><td>${y.year}</td><td class="stat-general">${y.general ? `${y.general.min}–${y.general.max}` : "—"}</td><td class="stat-rural">${y.rural ? `${y.rural.min}–${y.rural.max}` : "—"}</td><td>${y.count ?? "—"}</td></tr>`).join("")}
      </tbody>
    </table>
    </div>
  `;
}

// Раскрываемая строка вуза: акцент — на проходной балл (порог допуска)
// текущего цикла; исторический минимум победителя — второстепенная справка.
function uniRowDetails({ threshold, lastYearMin, lastYear, yearlyRows, uniCode }) {
  return `
    <div class="path-details">
      <div class="detail-grid">
        <div class="detail-accent"><b>${threshold ?? "—"}</b><span>${t("path.thresholdLabel")}</span></div>
        ${lastYearMin != null ? `<div><b>${lastYearMin}</b><span>${t("path.lastYearMin", { year: lastYear })}</span></div>` : ""}
      </div>
      ${yearlyQuotaTable(yearlyRows)}
      <p><a class="card-link" href="#/universities/${uniCode}">${t("btn.uniCard")}</a></p>
    </div>
  `;
}

function renderMergedUniRow(m) {
  const uniName = localizedName({ name: m.university_name, name_kk: m.university_name_kk });
  const base = m.general || m.rural;
  const lastYear = base.data_years ? base.data_years[base.data_years.length - 1] : 2025;
  const lowSample = (m.general?.low_sample ?? true) && (m.rural?.low_sample ?? true);

  return `
    <details class="path-card">
      <summary>
        <div class="path-main">
          <div class="path-uni">${codeBadge(m.university_code)} ${escapeHtml(uniName)}</div>
          <div class="path-sub">${lowSample ? `<span class="badge-note">${t("path.lowSample")}</span>` : ""}</div>
        </div>
        <div class="path-badges">${quotaBadges(m.pGeneral, m.pRural)}</div>
      </summary>
      ${uniRowDetails({
        threshold: m.threshold_score,
        lastYearMin: m.general?.cutoff_2025 ?? m.rural?.cutoff_2025,
        lastYear,
        yearlyRows: mergePathYearly(m.general, m.rural),
        uniCode: m.university_code,
      })}
    </details>
  `;
}

function renderPedUniRow(r) {
  const uniName = localizedName({ name: r.university_name, name_kk: r.university_name_kk });
  const yearsRows = (r.yearly || []).filter((y) => y.general || y.rural || y.count != null);
  const scoreYears = yearsRows.filter((y) => y.general || y.rural);
  const lastScoreYear = scoreYears.length ? scoreYears[scoreYears.length - 1] : null;

  return `
    <details class="path-card">
      <summary>
        <div class="path-main">
          <div class="path-uni">${codeBadge(r.university_code)} ${escapeHtml(uniName)}</div>
        </div>
        <div class="path-badges">${quotaBadges(r.pGeneral, r.pRural)}</div>
      </summary>
      ${uniRowDetails({
        threshold: r.threshold_score,
        lastYearMin: lastScoreYear?.general?.min ?? lastScoreYear?.rural?.min,
        lastYear: lastScoreYear?.year,
        yearlyRows: yearsRows,
        uniCode: r.university_code,
      })}
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
  // Сначала все базовые коды (B001…B271), потом совместные/двудипломные
  // программы с суффиксом ('B001 (AST-ALM)', 'B003 (US)' …).
  const items = Object.entries(specialties).sort((a, b) => {
    const aSuffixed = a[0].includes("(") ? 1 : 0;
    const bSuffixed = b[0].includes("(") ? 1 : 0;
    return aSuffixed - bSuffixed || a[0].localeCompare(b[0]);
  });

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
      <div class="specialty-row-list">
        ${filtered.map(([code, s]) => `
          <a href="#/specialties/${code}" class="path-card specialty-row">
            <div class="specialty-row-code">${code}</div>
            <div class="specialty-row-body">
              <div class="specialty-row-name">${escapeHtml(localizedName(s))}</div>
            </div>
            <div class="specialty-row-combo">${genericSubjectCombos(s).map((c) => `<span class="combo-tag combo-tag-lg">${escapeHtml(formatSubjectCombo(c))}</span>`).join("")}</div>
          </a>
        `).join("")}
      </div>
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

// Фильтр-дропдаун с подписью сверху — без подписи 4 фильтра в ряд не
// различить ("есть"/"есть" — что из них общежитие, а что военная кафедра?).
function labeledFilter(labelKey, mountId) {
  return `<div class="filter-field"><label class="filter-label">${t(labelKey)}</label><div id="${mountId}"></div></div>`;
}

// Код вуза/специальности — отдельным бейджем, чтобы не сливаться с названием
// в одну строку текста (были жалобы, что таблицы выглядят одним сплошным текстом).
function codeBadge(code) {
  return `<span class="code-badge">${code}</span>`;
}

function regionTag(text) {
  return text ? `<span class="region-tag">${escapeHtml(text)}</span>` : "—";
}

// Проходной балл — цветной пилюлей, а не голой цифрой: это главное число
// в строке таблицы, оно не должно теряться среди обычного текста.
function scorePill(value) {
  return value != null ? `<span class="score-pill">${value}</span>` : "—";
}

const ICON_CHECK = `<svg class="yn-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CROSS = `<svg class="yn-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

// Иконка + текст вместо голого "есть/нет" — так колонку видно взглядом,
// не построчным чтением (цвет не единственный носитель смысла, см. текст).
function ynCell(flag) {
  return flag
    ? `<span class="yn yes">${ICON_CHECK}${t("universityDetail.yes")}</span>`
    : `<span class="yn no">${ICON_CROSS}${t("universityDetail.no")}</span>`;
}

function renderSpecialtyDetail(app, code) {
  const { specialties, paths, universities } = state.data;
  const sp = specialties[code];
  if (!sp) {
    app.innerHTML = `<p>${t("specialtyDetail.notFound")} <a href="#/specialties">${t("common.backToList")}</a></p>`;
    return;
  }
  const general = paths.filter((p) => p.gop_code === code && p.quota_id === "general");
  const rural = paths.filter((p) => p.gop_code === code && p.quota_id === "rural");

  const summaryYearly = (sp.general_grant_summary && sp.general_grant_summary.yearly) || [];
  const pedEntries = Object.entries((sp.ped_quota && sp.ped_quota.by_university) || {});

  // Вкладка 1: мин/макс баллы — мин и макс отдельными колонками; общий
  // грант агрегатом (один пул), пед-квота по каждому вузу с годами.
  const scoreYears = summaryYearly.filter((y) => y.general || y.rural);
  const minMaxTab = `
    <h3>${t("results.generalGrant")}</h3>
    ${scoreYears.length ? `
      <div class="table-scroll">
      <table class="stat-table">
        <thead>
          <tr><th rowspan="2">${t("path.year")}</th><th colspan="2" class="th-general">${t("quota.general")}</th><th colspan="2" class="th-rural">${t("quota.rural")}</th></tr>
          <tr><th>${t("table.min")}</th><th>${t("table.max")}</th><th>${t("table.min")}</th><th>${t("table.max")}</th></tr>
        </thead>
        <tbody>
          ${scoreYears.map((y) => `<tr><td>${y.year}</td><td class="stat-general">${y.general?.min ?? "—"}</td><td class="stat-general">${y.general?.max ?? "—"}</td><td class="stat-rural">${y.rural?.min ?? "—"}</td><td class="stat-rural">${y.rural?.max ?? "—"}</td></tr>`).join("")}
        </tbody>
      </table>
      </div>
    ` : `<p class="hint">${t("cutoffTable.noData")}</p>`}
    ${pedEntries.length ? `
      <h3>${t("results.pedQuota")}</h3>
      <div class="uni-stat-list">
        ${pedEntries.map(([uniCode, u]) => {
          const rows = (u.yearly || []).filter((y) => y.general || y.rural);
          if (!rows.length) return "";
          const uniName = escapeHtml(localizedName({ name: u.university_name, name_kk: u.university_name_kk }));
          return `
            <div class="path-card uni-stat-card">
              <div class="path-uni"><a href="#/universities/${uniCode}">${codeBadge(uniCode)}</a> <a href="#/universities/${uniCode}">${uniName}</a></div>
              <div class="table-scroll">
                <table class="stat-table yearly-table">
                  <thead>
                    <tr><th rowspan="2">${t("path.year")}</th><th colspan="2" class="th-general">${t("quota.general")}</th><th colspan="2" class="th-rural">${t("quota.rural")}</th></tr>
                    <tr><th>${t("table.min")}</th><th>${t("table.max")}</th><th>${t("table.min")}</th><th>${t("table.max")}</th></tr>
                  </thead>
                  <tbody>
                    ${rows.map((y) => `<tr><td>${y.year}</td><td class="stat-general">${y.general?.min ?? "—"}</td><td class="stat-general">${y.general?.max ?? "—"}</td><td class="stat-rural">${y.rural?.min ?? "—"}</td><td class="stat-rural">${y.rural?.max ?? "—"}</td></tr>`).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    ` : ""}
  `;

  // Вкладка 2: количество грантов — общий грант по годам (включая
  // 2026-2027) + пед-квота по вузам с колонками-годами; их сумма за
  // 2026-2027 равна официально выделенному числу грантов.
  const countYears = [...new Set([
    ...summaryYearly.filter((y) => y.count != null).map((y) => y.year),
    ...pedEntries.flatMap(([, u]) => (u.yearly || []).filter((y) => y.count != null).map((y) => y.year)),
  ])].sort();
  const pedTotals = {};
  for (const [, u] of pedEntries) {
    for (const e of (u.yearly || [])) {
      if (e.count != null) pedTotals[e.year] = (pedTotals[e.year] ?? 0) + e.count;
    }
  }
  const general2026 = summaryYearly.find((y) => y.year === 2026)?.count;
  const countsTab = `
    <h3>${t("results.generalGrant")}</h3>
    ${summaryYearly.some((y) => y.count != null) ? `
      <div class="table-scroll">
      <table class="stat-table">
        <thead><tr><th>${t("path.year")}</th>${countYears.map((y) => `<th>${y}</th>`).join("")}</tr></thead>
        <tbody><tr><td>${t("results.generalGrant")}</td>${countYears.map((y) => `<td class="stat-count">${summaryYearly.find((e) => e.year === y)?.count ?? "—"}</td>`).join("")}</tr></tbody>
      </table>
      </div>
    ` : `<p class="hint">${t("cutoffTable.noData")}</p>`}
    ${pedEntries.length ? `
      <h3>${t("results.pedQuota")}</h3>
      <div class="uni-stat-list">
        ${pedEntries.map(([uniCode, u]) => `
          <div class="path-card uni-stat-card">
            <div class="path-uni"><a href="#/universities/${uniCode}">${codeBadge(uniCode)}</a> <a href="#/universities/${uniCode}">${escapeHtml(localizedName({ name: u.university_name, name_kk: u.university_name_kk }))}</a></div>
            <div class="uni-year-stats">
              ${countYears.map((y) => `<div><b>${(u.yearly || []).find((e) => e.year === y)?.count ?? "—"}</b><span>${y}</span></div>`).join("")}
            </div>
          </div>
        `).join("")}
        <div class="path-card uni-stat-card total-card">
          <div class="path-uni">${t("table.total")}</div>
          <div class="uni-year-stats">
            ${countYears.map((y) => `<div><b>${pedTotals[y] ?? "—"}</b><span>${y}</span></div>`).join("")}
          </div>
        </div>
      </div>
      ${general2026 != null ? `<p class="hint">${t("specialtyDetail.totalNote", { g: general2026, p: pedTotals[2026] ?? 0, total: general2026 + (pedTotals[2026] ?? 0) })}</p>` : ""}
    ` : ""}
  `;

  // Вкладка 3: вузы — как страница вузов (регион/общежитие/военная кафедра)
  // + проходной балл этой специальности, с фильтрами по всем параметрам.
  const uniByCode = new Map(universities.map((u) => [u.code, u]));
  const uniMap = new Map();
  const addUni = (uniCode, threshold) => {
    const u = uniByCode.get(uniCode);
    if (!u || uniMap.has(uniCode)) return;
    uniMap.set(uniCode, { ...u, threshold: threshold ?? u.specialty_thresholds?.[code] });
  };
  for (const u of universities) {
    if (u.specialty_thresholds && code in u.specialty_thresholds) addUni(u.code, u.specialty_thresholds[code]);
  }
  for (const p of [...general, ...rural]) addUni(p.university_code, p.threshold_score);
  for (const [uniCode, u] of pedEntries) addUni(uniCode, u.threshold_score);
  const uniList = [...uniMap.values()].sort((a, b) => a.code.localeCompare(b.code));

  app.innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-eyebrow">${t("specialtyDetail.eyebrow")}</div>
      <span class="detail-hero-code">${code}</span>
      <h1>${escapeHtml(localizedName(sp))}</h1>
      <div class="detail-hero-tags">
        ${genericSubjectCombos(sp).map((c) => `<span class="detail-hero-tag">${escapeHtml(formatSubjectCombo(c))}</span>`).join("")}
      </div>
      <div class="detail-hero-stat">
        <div><b>${sp.full_time ?? "—"}</b><span>${t("specialtyDetail.grantsLabel")}</span></div>
      </div>
    </div>
    <div class="tabs" id="spec-tabs">
      <button class="tab-btn active" data-tab="minmax">${t("specialtyDetail.minMax")}</button>
      <button class="tab-btn" data-tab="counts">${t("specialtyDetail.grantCounts")}</button>
      <button class="tab-btn" data-tab="unis">${t("specialtyDetail.universitiesSection")}</button>
    </div>
    <div class="tab-panel" id="tab-minmax">${minMaxTab}</div>
    <div class="tab-panel" id="tab-counts" hidden>${countsTab}</div>
    <div class="tab-panel" id="tab-unis" hidden>
      <div class="result-controls">
        ${labeledFilter("filter.university", "uni-filter-mount")}
        ${labeledFilter("filter.region", "region-filter-mount")}
        ${labeledFilter("filter.dormitory", "dorm-filter-mount")}
        ${labeledFilter("filter.militaryDept", "military-filter-mount")}
      </div>
      <div id="uni-list"></div>
    </div>
    <p style="margin-top:20px"><a href="#/specialties">${t("specialtyDetail.backLink")}</a></p>
  `;

  document.getElementById("spec-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll("#spec-tabs .tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-panel").forEach((p) => { p.hidden = p.id !== `tab-${btn.dataset.tab}`; });
  });

  const uniListEl = document.getElementById("uni-list");
  const filterState = { university: "", region: "", dormitory: "", military: "" };
  const hasFlag = (v) => v === "Иә";

  function drawUniList() {
    const filtered = uniList.filter((u) =>
      (!filterState.university || u.code === filterState.university) &&
      (!filterState.region || u.region === filterState.region) &&
      (!filterState.dormitory || (filterState.dormitory === "yes") === hasFlag(u.dormitory)) &&
      (!filterState.military || (filterState.military === "yes") === hasFlag(u.military_department))
    );
    uniListEl.innerHTML = `
      <div class="table-scroll">
      <table class="stat-table">
        <thead><tr>
          <th>${t("universitiesList.code")}</th><th>${t("cutoffTable.university")}</th>
          <th>${t("universitiesList.region")}</th><th>${t("universitiesList.dormitory")}</th>
          <th>${t("universitiesList.militaryDept")}</th><th>${t("path.thresholdCol")}</th>
        </tr></thead>
        <tbody>
          ${filtered.map((u) => `
            <tr>
              <td><a href="#/universities/${u.code}">${codeBadge(u.code)}</a></td>
              <td><a href="#/universities/${u.code}">${escapeHtml(localizedName(u))}</a></td>
              <td>${regionTag(localizedRegion(u))}</td>
              <td>${ynCell(hasFlag(u.dormitory))}</td>
              <td>${ynCell(hasFlag(u.military_department))}</td>
              <td class="num">${scorePill(u.threshold)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      </div>
    `;
  }

  const regionByKey = new Map();
  for (const u of uniList) {
    if (u.region && !regionByKey.has(u.region)) regionByKey.set(u.region, localizedRegion(u));
  }
  const yesNoOptions = [
    { value: "yes", label: t("universityDetail.yes") },
    { value: "no", label: t("universityDetail.no") },
  ];
  createSearchableSelect(document.getElementById("uni-filter-mount"), {
    allLabel: t("specialtyDetail.allUniversities"),
    options: uniList.map((u) => ({ value: u.code, label: localizedName(u), showCode: true })),
    onChange: (v) => { filterState.university = v; drawUniList(); },
  });
  createSearchableSelect(document.getElementById("region-filter-mount"), {
    allLabel: t("universitiesList.allRegions"),
    options: [...regionByKey.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru")).map(([key, label]) => ({ value: key, label })),
    onChange: (v) => { filterState.region = v; drawUniList(); },
  });
  createSearchableSelect(document.getElementById("dorm-filter-mount"), {
    allLabel: t("filter.any"),
    options: yesNoOptions,
    onChange: (v) => { filterState.dormitory = v; drawUniList(); },
  });
  createSearchableSelect(document.getElementById("military-filter-mount"), {
    allLabel: t("filter.any"),
    options: yesNoOptions,
    onChange: (v) => { filterState.military = v; drawUniList(); },
  });
  drawUniList();
}

function renderUniversitiesList(app) {
  const { universities } = state.data;
  const items = [...universities].sort((a, b) => a.code.localeCompare(b.code));

  const universityOptions = items.map((u) => ({ value: u.code, label: localizedName(u), showCode: true }));
  const regionByKey = new Map();
  for (const u of items) {
    if (u.region && !regionByKey.has(u.region)) regionByKey.set(u.region, localizedRegion(u));
  }
  const regionOptions = [...regionByKey.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .map(([key, label]) => ({ value: key, label }));
  const yesNoOptions = [
    { value: "yes", label: t("universityDetail.yes") },
    { value: "no", label: t("universityDetail.no") },
  ];
  const hasFlag = (value) => value === "Иә";

  app.innerHTML = `
    <h1>${t("universitiesList.title")}</h1>
    <p class="lede">${t("universitiesList.lede")}</p>
    <div class="search-page">
      <div class="result-controls filter-grid">
        ${labeledFilter("filter.university", "university-filter-mount")}
        ${labeledFilter("filter.region", "region-filter-mount")}
        ${labeledFilter("filter.dormitory", "dorm-filter-mount")}
        ${labeledFilter("filter.militaryDept", "military-filter-mount")}
      </div>
      <div id="list"></div>
    </div>
  `;
  const listEl = document.getElementById("list");
  const filterState = { university: "", region: "", dormitory: "", military: "" };

  function draw() {
    const filtered = items.filter((u) =>
      (!filterState.university || u.code === filterState.university) &&
      (!filterState.region || u.region === filterState.region) &&
      (!filterState.dormitory || (filterState.dormitory === "yes") === hasFlag(u.dormitory)) &&
      (!filterState.military || (filterState.military === "yes") === hasFlag(u.military_department))
    );
    listEl.innerHTML = `
      <div class="table-scroll">
      <table class="stat-table">
        <thead><tr>
          <th>${t("universitiesList.code")}</th>
          <th>${t("universitiesList.university")}</th>
          <th>${t("universitiesList.region")}</th>
          <th>${t("universitiesList.dormitory")}</th>
          <th>${t("universitiesList.militaryDept")}</th>
        </tr></thead>
        <tbody>
          ${filtered.map((u) => `
            <tr>
              <td><a href="#/universities/${u.code}">${codeBadge(u.code)}</a></td>
              <td><a href="#/universities/${u.code}">${escapeHtml(localizedName(u))}</a></td>
              <td>${regionTag(localizedRegion(u))}</td>
              <td>${ynCell(hasFlag(u.dormitory))}</td>
              <td>${ynCell(hasFlag(u.military_department))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      </div>
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
  createSearchableSelect(document.getElementById("dorm-filter-mount"), {
    allLabel: t("filter.any"),
    options: yesNoOptions,
    onChange: (value) => { filterState.dormitory = value; draw(); },
  });
  createSearchableSelect(document.getElementById("military-filter-mount"), {
    allLabel: t("filter.any"),
    options: yesNoOptions,
    onChange: (value) => { filterState.military = value; draw(); },
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

  const dormText = uni.dormitory ? t("universityDetail.dormitory", { value: uni.dormitory === "Иә" ? t("universityDetail.yes") : t("universityDetail.no") }) : "";
  const militaryText = uni.military_department ? t("universityDetail.militaryDept", { value: uni.military_department === "Иә" ? t("universityDetail.yes") : t("universityDetail.no") }) : "";

  // Полный перечень специальностей вуза: база — проходные баллы eduser
  // (есть и у медвузов, где победители не парсились), поверх — данные
  // победителей (общий конкурс + сельская квота ОДНИМ списком, история в
  // раскрытии строки).
  const generalByGop = new Map(paths.filter((p) => p.university_code === code && p.quota_id === "general").map((p) => [p.gop_code, p]));
  const ruralByGop = new Map(paths.filter((p) => p.university_code === code && p.quota_id === "rural").map((p) => [p.gop_code, p]));
  const specCodes = new Set([
    ...Object.keys(uni.specialty_thresholds || {}),
    ...generalByGop.keys(),
    ...ruralByGop.keys(),
  ]);
  const specRows = [...specCodes]
    .filter((gop) => specialties[gop])
    .map((gop) => ({
      gop,
      sp: specialties[gop],
      threshold: (uni.specialty_thresholds || {})[gop] ?? generalByGop.get(gop)?.threshold_score ?? ruralByGop.get(gop)?.threshold_score,
      general: generalByGop.get(gop) || null,
      rural: ruralByGop.get(gop) || null,
    }))
    .sort((a, b) => a.gop.localeCompare(b.gop));

  const comboKeyOf = (sp) => {
    const c = sp.subject_combo;
    return c ? [c.subject_1, c.subject_2].sort().join("|") : "";
  };
  const comboOptions = [...new Map(
    specRows.filter((r) => r.sp.subject_combo).map((r) => [comboKeyOf(r.sp), {
      value: comboKeyOf(r.sp),
      label: genericSubjectCombos(r.sp).map(formatSubjectCombo).join(" / "),
    }])
  ).values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));

  app.innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-eyebrow">${t("universityDetail.eyebrow")}</div>
      <span class="detail-hero-code">${uni.code}</span>
      <h1>${escapeHtml(localizedName(uni))}</h1>
      <div class="detail-hero-tags">
        ${localizedRegion(uni) ? `<span class="detail-hero-tag">${escapeHtml(localizedRegion(uni))}</span>` : ""}
        ${dormText ? `<span class="detail-hero-tag">${dormText}</span>` : ""}
        ${militaryText ? `<span class="detail-hero-tag">${militaryText}</span>` : ""}
      </div>
    </div>
    <div class="result-controls filter-grid">
      ${labeledFilter("filter.specialty", "specialty-filter-mount")}
      ${labeledFilter("filter.combo", "combo-filter-mount")}
    </div>
    <div id="specialty-list"></div>
    <p style="margin-top:20px"><a href="#/universities">${t("universityDetail.backLink")}</a></p>
  `;

  const listEl = document.getElementById("specialty-list");
  const filterState = { specialty: "", combo: "" };

  function specRowHtml(r) {
    const combos = genericSubjectCombos(r.sp);
    const yearlyRows = mergePathYearly(r.general, r.rural);
    const base = r.general || r.rural;
    const lastYear = base?.data_years ? base.data_years[base.data_years.length - 1] : null;
    return `
      <details class="path-card">
        <summary>
          <div class="path-main">
            <div class="path-uni">${codeBadge(r.gop)} ${escapeHtml(localizedName(r.sp))}</div>
            <div class="combo-tags">${combos.map((c) => `<span class="combo-tag">${escapeHtml(formatSubjectCombo(c))}</span>`).join("")}</div>
          </div>
          <div class="path-badges">
            <span class="path-threshold">${t("path.thresholdCol")}: ${scorePill(r.threshold)}</span>
          </div>
        </summary>
        <div class="path-details">
          <div class="detail-grid">
            <div class="detail-accent"><b>${r.threshold ?? "—"}</b><span>${t("path.thresholdLabel")}</span></div>
            ${base ? `<div><b>${base.cutoff_2025}</b><span>${t("path.lastYearMin", { year: lastYear })}</span></div>` : ""}
          </div>
          ${yearlyQuotaTable(yearlyRows)}
          <p><a class="card-link" href="#/specialties/${encodeURIComponent(r.gop)}">${t("btn.specCard")}</a></p>
        </div>
      </details>
    `;
  }

  function draw() {
    const filtered = specRows.filter((r) =>
      (!filterState.specialty || r.gop === filterState.specialty) &&
      (!filterState.combo || comboKeyOf(r.sp) === filterState.combo)
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(specRowHtml).join("")
      : `<p class="hint">${t("cutoffTable.noData")}</p>`;
  }

  createSearchableSelect(document.getElementById("specialty-filter-mount"), {
    allLabel: t("specialtiesList.allSpecialties"),
    options: specRows.map((r) => ({ value: r.gop, label: `${r.gop} — ${localizedName(r.sp)}` })),
    onChange: (v) => { filterState.specialty = v; draw(); },
  });
  createSearchableSelect(document.getElementById("combo-filter-mount"), {
    allLabel: t("specialtiesList.allSubjects"),
    options: comboOptions,
    onChange: (v) => { filterState.combo = v; draw(); },
  });
  draw();
}

// ---------- Инициализация ----------

// ---------- Тема ----------

const ICON_SUN = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"/></g></svg>`;
const ICON_MOON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="currentColor"/></svg>`;

function applyTheme(theme) {
  const btn = document.getElementById("theme-toggle");
  document.documentElement.dataset.theme = theme;
  btn.innerHTML = theme === "dark" ? ICON_SUN : ICON_MOON;
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
