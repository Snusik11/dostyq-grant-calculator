// Калькулятор шансов на грант — статический сайт, вся логика на клиенте.
// Формула вероятности НЕ дублируется здесь: probability_curve уже
// предвычислена в Python (score_engine.py) при сборке датасета, здесь
// только индексация массива по баллу.

const DATA_FILES = [
  "specialties", "universities", "rural_quota_specialties",
  "paths", "group_paths", "ped_quota_info",
];

const GROUP_QUOTA_LABELS = {
  disability: "Инвалидность 1-2 группы",
  veteran: "Ветераны боевых действий",
  orphan: "Дети-сироты",
  multi_child_family: "Многодетная семья (4+ детей)",
  incomplete_family: "Неполная семья",
  disabled_family_member: "Семья с ребёнком-инвалидом",
};

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
  if (p >= 0.7) return { cls: "high", text: "Высокий шанс" };
  if (p >= 0.35) return { cls: "medium", text: "Средний шанс" };
  return { cls: "low", text: "Низкий шанс" };
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
      <input type="text" class="select-filter-search" placeholder="Поиск..." autocomplete="off" />
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
    const filtered = ft ? options.filter((o) => o.label.toLowerCase().includes(ft)) : options;
    const allRow = `<div class="select-filter-option${selectedValue === "" ? " active" : ""}" data-value="">${escapeHtml(allLabel)}</div>`;
    const rows = filtered.map((o) => `
      <div class="select-filter-option${selectedValue === o.value ? " active" : ""}" data-value="${escapeHtml(o.value)}">
        ${escapeHtml(o.label)}
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

function buildSubjectCombos(specialties) {
  const seen = new Map();
  for (const code in specialties) {
    const combo = specialties[code].subject_combo;
    if (!combo) continue;
    const key = [combo.subject_1, combo.subject_2].sort().join("|");
    if (!seen.has(key)) {
      seen.set(key, { key, a: combo.subject_1, b: combo.subject_2 });
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
    app.innerHTML = "<p>Страница не найдена. <a href=\"#/\">На главную</a></p>";
  }
}

// ---------- Калькулятор ----------

function renderCalculator(app) {
  const { specialties } = state.data;
  const combos = buildSubjectCombos(specialties);

  app.innerHTML = `
    <h1>Калькулятор шансов на грант</h1>
    <p class="lede">Оценка построена на реальных данных победителей 2023–2025 годов (тренд балла по
      годам) и актуальном количестве грантов на 2026-2027 учебный год. Это эвристика,
      а не гарантия — используй как ориентир, а не точный прогноз.</p>
    <div class="card">
      <form id="calc-form">
        <div class="step">
          <div class="step-label"><span class="num">1</span> Профильные предметы ЕНТ</div>
          <div class="subject-row">
            <select id="combo-select" required>
              <option value="" disabled selected>Выбери комбинацию предметов</option>
              ${combos.map((c) => `<option value="${c.key}">${escapeHtml(formatSubjectCombo({ subject_1: c.a, subject_2: c.b }))}</option>`).join("")}
            </select>
          </div>
          <div class="hint">Комбинация уже фиксирована тем, что ты сдавал(а) — выбери свою пару.</div>
        </div>
        <div class="step">
          <div class="step-label"><span class="num">2</span> Балл ЕНТ (суммарный)</div>
          <input type="number" id="score-input" min="0" max="140" required placeholder="Например, 105" />
        </div>
        <div class="step">
          <div class="step-label"><span class="num">3</span> Квоты</div>
          <div class="checkbox-item">
            <input type="checkbox" id="rural-checkbox" />
            <label for="rural-checkbox">У меня есть сельская квота</label>
          </div>
          <div class="hint" style="margin-bottom:10px">Показывает отдельно шанс по сельской квоте и по общему конкурсу — они считаются независимо.</div>
          <div class="checkbox-grid">
            ${Object.entries(GROUP_QUOTA_LABELS).map(([id, label]) => `
              <div class="checkbox-item">
                <input type="checkbox" class="other-quota" value="${id}" id="q-${id}" />
                <label for="q-${id}">${label}</label>
              </div>`).join("")}
          </div>
          <div class="hint">Эти квоты участвуют, только если не проходишь по общему конкурсу — оценка даётся по всей группе специальностей, не по одной ГОП.</div>
        </div>
        <button type="submit" class="primary">Показать шансы</button>
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
    container.innerHTML = `<div class="empty-state">По этой комбинации предметов специальностей не найдено.</div>`;
    return;
  }

  const scored = rows.map((r) => ({ ...r, p: probabilityAt(r.probability_curve, score) }));
  scored.sort((a, b) => b.p - a.p);

  container.innerHTML = `
    <h2>Результаты</h2>
    <div class="result-controls">
      <div id="university-filter-mount"></div>
      <div id="specialty-filter-mount"></div>
    </div>
    <div class="result-count" id="result-count"></div>
    <div id="result-list"></div>
    ${groupRows.length ? renderGroupQuotaSection(groupRows, score) : ""}
    <div class="disclaimer">
      Оценка — эвристика на основе тренда баллов реальных победителей 2023–2025 годов и
      изменения числа грантов в 2026-2027 году. Педагогическая квота (если применима к специальности) не
      учитывается в процентах — по ней нет исторических проходных баллов, только количество
      мест: ${[...gopCodes].filter((c) => pedByGop.has(c)).map((c) => `${c} — ${pedByGop.get(c).grants_2026} мест`).join(", ") || "нет данных"}.
    </div>
  `;

  const listEl = document.getElementById("result-list");
  const countEl = document.getElementById("result-count");

  // Два независимых дискретных фильтра-дропдауна (вуз / специальность), а
  // не текстовый поиск: выбор одного варианта СУЖАЕТ список ровно до него,
  // как в обычном фильтре на любом каталожном сайте.
  const universityOptions = [...new Map(
    scored.map((r) => [r.university_code, { value: r.university_code, label: r.university_name }])
  ).values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));

  const specialtyOptions = [...new Map(
    scored.map((r) => [r.gop_code, { value: r.gop_code, label: `${r.gop_code} — ${specialties[r.gop_code]?.name || ""}` }])
  ).values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));

  const filterState = { university: "", specialty: "" };

  function draw() {
    const filtered = scored.filter((r) =>
      (!filterState.university || r.university_code === filterState.university) &&
      (!filterState.specialty || r.gop_code === filterState.specialty)
    );
    countEl.textContent = `${filtered.length} из ${scored.length}`;
    listEl.innerHTML = filtered.length
      ? filtered.map((r) => renderPathCard(r, specialties)).join("")
      : `<div class="empty-state">Нет результатов с таким сочетанием фильтров.</div>`;
  }

  createSearchableSelect(document.getElementById("university-filter-mount"), {
    allLabel: "Все вузы",
    options: universityOptions,
    onChange: (value) => { filterState.university = value; draw(); },
  });
  createSearchableSelect(document.getElementById("specialty-filter-mount"), {
    allLabel: "Все специальности",
    options: specialtyOptions,
    onChange: (value) => { filterState.specialty = value; draw(); },
  });

  draw();
}

function renderPathCard(r, specialties) {
  const conf = confidenceLabel(r.p);
  const spName = specialties[r.gop_code]?.name || r.gop_code;
  const quotaLabel = r.quota_id === "rural" ? "Сельская квота" : "Общий конкурс";
  const rangeSpan = Math.max(1, r.max_2025 - r.min_2025);
  const cutoffPos = ((r.cutoff_2025 - r.min_2025) / rangeSpan) * 100;
  const latestYear = r.data_years ? r.data_years[r.data_years.length - 1] : 2025;
  const yearsNote = r.yearly && r.yearly.length > 1
    ? `
        <table class="stat-table yearly-table">
          <thead><tr><th>Год</th><th>Проходной</th><th>Мин–Макс</th><th>Победителей</th></tr></thead>
          <tbody>
            ${r.yearly.map((y) => `<tr><td>${y.year}</td><td>${y.cutoff}</td><td>${y.min}–${y.max}</td><td>${y.count}</td></tr>`).join("")}
          </tbody>
        </table>
      `
    : `<p class="hint">Данные только за ${latestYear} год.</p>`;
  const trend = r.grants_2025 && r.grants_2026
    ? (r.grants_2026 >= r.grants_2025 ? `грантов больше, чем в прошлом году (${r.grants_2025} → ${r.grants_2026})` : `грантов меньше, чем в прошлом году (${r.grants_2025} → ${r.grants_2026})`)
    : "нет данных о смене числа грантов";

  return `
    <details class="path-card">
      <summary>
        <div class="path-main">
          <div class="path-uni">${escapeHtml(r.university_name)}</div>
          <div class="path-sub">${escapeHtml(r.gop_code)} · ${escapeHtml(spName)} · ${quotaLabel}${r.low_sample ? '<span class="badge-note">мало данных</span>' : ""}</div>
        </div>
        <span class="badge ${conf.cls}">${pct(r.p)} · ${conf.text}</span>
      </summary>
      <div class="path-details">
        <div class="detail-grid">
          <div><b>${r.cutoff_2025}</b><span>проходной балл ${latestYear}</span></div>
          <div><b>${r.min_2025}–${r.max_2025}</b><span>диапазон баллов</span></div>
          <div><b>${r.median_2025}</b><span>медиана</span></div>
          <div><b>${r.winners_count_2025}</b><span>победителей в ${latestYear}</span></div>
        </div>
        <div class="range-track">
          <div class="range-fill" style="left:0; width:${cutoffPos}%"></div>
          <div class="range-marker" style="left:${cutoffPos}%"></div>
        </div>
        <div class="range-labels"><span>${r.min_2025}</span><span>проходной: ${r.cutoff_2025}</span><span>${r.max_2025}</span></div>
        ${yearsNote}
        <p class="hint">В 2026-2027 году ${trend}.</p>
      </div>
    </details>
  `;
}

function renderGroupQuotaSection(groupRows, score) {
  const scored = groupRows.map((g) => ({ ...g, p: probabilityAt(g.probability_curve, score) }));
  scored.sort((a, b) => b.p - a.p);
  return `
    <h2>Другие квоты (по группе специальностей)</h2>
    <p class="hint">Эти квоты выделяются на всю группу специальностей, а не на конкретный вуз или
      ГОП — участвуешь в них, только если не прошёл(а) по общему конкурсу.</p>
    ${scored.map((g) => `
      <details class="path-card">
        <summary>
          <div class="path-main">
            <div class="path-uni">${GROUP_QUOTA_LABELS[g.quota_id] || g.quota_id}</div>
            <div class="path-sub">Группа ${escapeHtml(g.group_code)}${g.low_sample ? '<span class="badge-note">мало данных</span>' : ""}</div>
          </div>
          <span class="badge ${confidenceLabel(g.p).cls}">${pct(g.p)} · ${confidenceLabel(g.p).text}</span>
        </summary>
        <div class="path-details">
          <div class="detail-grid">
            <div><b>${g.cutoff_2025}</b><span>проходной балл 2025</span></div>
            <div><b>${g.min_2025}–${g.max_2025}</b><span>диапазон баллов</span></div>
            <div><b>${g.winners_count_2025}</b><span>победителей в 2025</span></div>
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
  app.innerHTML = `
    <h1>Специальности</h1>
    <p class="lede">Проходные баллы 2025 года и профильные предметы по каждой специальности.</p>
    <div class="search-page">
      <input type="search" id="search-input" placeholder="Поиск по коду или названию..." />
      <div id="list"></div>
    </div>
  `;
  const listEl = document.getElementById("list");
  function draw(q) {
    const qq = q.trim().toLowerCase();
    const filtered = items.filter(([code, s]) => {
      if (!qq) return true;
      const combo = s.subject_combo ? formatSubjectCombo(s.subject_combo).toLowerCase() : "";
      return (
        code.toLowerCase().includes(qq) ||
        (s.name || "").toLowerCase().includes(qq) ||
        combo.includes(qq)
      );
    });
    listEl.innerHTML = `
      <table class="stat-table">
        <thead><tr><th>Код</th><th>Специальность</th><th>Предметы</th></tr></thead>
        <tbody>
          ${filtered.map(([code, s]) => `
            <tr>
              <td><a href="#/specialties/${code}">${code}</a></td>
              <td><a href="#/specialties/${code}">${escapeHtml(s.name || "")}</a></td>
              <td>${s.subject_combo ? escapeHtml(formatSubjectCombo(s.subject_combo)) : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
  draw("");
  document.getElementById("search-input").addEventListener("input", (e) => draw(e.target.value));
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
  if (!rows.length) return `<p class="hint">Нет данных за 2025 год.</p>`;
  const sorted = [...rows].sort((a, b) => a.cutoff_2025 - b.cutoff_2025);
  return `
    <table class="stat-table">
      <thead><tr><th>${linkTo === "universities" ? "Вуз" : "Специальность"}</th><th>Проходной 2025</th><th>Мин–Макс по годам</th><th>Медиана</th><th>Победителей</th></tr></thead>
      <tbody>
        ${sorted.map((r) => `
          <tr>
            <td><a href="#/${linkTo}/${linkTo === "universities" ? r.university_code : r.gop_code}">${escapeHtml(labelFn(r))}</a></td>
            <td>${r.cutoff_2025}</td>
            <td>${renderYearlyBreakdown(r.yearly) || `${r.min_2025}–${r.max_2025}`}</td>
            <td>${r.median_2025}</td>
            <td>${r.winners_count_2025}${r.low_sample ? ' <span class="badge-note">мало данных</span>' : ""}</td>
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
    app.innerHTML = `<p>Специальность не найдена. <a href="#/specialties">Назад к списку</a></p>`;
    return;
  }
  const general = paths.filter((p) => p.gop_code === code && p.quota_id === "general");
  const rural = paths.filter((p) => p.gop_code === code && p.quota_id === "rural");
  const labelFn = (r) => r.university_name;

  app.innerHTML = `
    <h1>${code} — ${escapeHtml(sp.name || "")}</h1>
    <p class="lede">${sp.subject_combo ? `Профильные предметы: ${escapeHtml(formatSubjectCombo(sp.subject_combo))}` : ""}
      · Грантов на 2026-2027: ${sp.full_time ?? "—"}</p>
    <h2>Общий конкурс</h2>
    ${renderCutoffTable(general, { linkTo: "universities", labelFn })}
    ${rural.length ? `<h2>Сельская квота</h2>${renderCutoffTable(rural, { linkTo: "universities", labelFn })}` : ""}
    <p style="margin-top:20px"><a href="#/specialties">← Все специальности</a></p>
  `;
}

function renderUniversitiesList(app) {
  const { universities } = state.data;
  const items = [...universities].sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));
  app.innerHTML = `
    <h1>Вузы</h1>
    <p class="lede">Проходные баллы 2025 года по специальностям каждого вуза.</p>
    <div class="search-page">
      <input type="search" id="search-input" placeholder="Поиск по коду, названию или региону..." />
      <div id="list"></div>
    </div>
  `;
  const listEl = document.getElementById("list");
  function draw(q) {
    const qq = q.trim().toLowerCase();
    const filtered = items.filter((u) =>
      !qq ||
      u.code.toLowerCase().includes(qq) ||
      u.full_name.toLowerCase().includes(qq) ||
      u.short_name.toLowerCase().includes(qq) ||
      (u.region || "").toLowerCase().includes(qq)
    );
    listEl.innerHTML = `
      <table class="stat-table">
        <thead><tr><th>Код</th><th>Вуз</th><th>Регион</th></tr></thead>
        <tbody>
          ${filtered.map((u) => `
            <tr>
              <td><a href="#/universities/${u.code}">${u.code}</a></td>
              <td><a href="#/universities/${u.code}">${escapeHtml(u.full_name)}</a></td>
              <td>${escapeHtml(u.region || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
  draw("");
  document.getElementById("search-input").addEventListener("input", (e) => draw(e.target.value));
}

function renderUniversityDetail(app, code) {
  const { universities, paths, specialties } = state.data;
  const uni = universities.find((u) => u.code === code);
  if (!uni) {
    app.innerHTML = `<p>Вуз не найден. <a href="#/universities">Назад к списку</a></p>`;
    return;
  }
  const general = paths.filter((p) => p.university_code === code && p.quota_id === "general");
  const rural = paths.filter((p) => p.university_code === code && p.quota_id === "rural");
  const labelFn = (r) => `${r.gop_code} — ${specialties[r.gop_code]?.name || ""}`;

  app.innerHTML = `
    <h1>${escapeHtml(uni.full_name)}</h1>
    <p class="lede">Код ОВПО: ${uni.code}${uni.region ? ` · ${escapeHtml(uni.region)}` : ""}${uni.dormitory ? ` · Общежитие: ${uni.dormitory === "Иә" ? "есть" : "нет"}` : ""}${uni.military_department ? ` · Военная кафедра: ${uni.military_department === "Иә" ? "есть" : "нет"}` : ""}</p>
    <h2>Общий конкурс</h2>
    ${renderCutoffTable(general, { linkTo: "specialties", labelFn })}
    ${rural.length ? `<h2>Сельская квота</h2>${renderCutoffTable(rural, { linkTo: "specialties", labelFn })}` : ""}
    <p style="margin-top:20px"><a href="#/universities">← Все вузы</a></p>
  `;
}

// ---------- Инициализация ----------

// ---------- Тема ----------

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.title = theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";
  };
  apply(document.documentElement.dataset.theme || "light");
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    apply(next);
  });
}

async function init() {
  setupThemeToggle();
  document.getElementById("app").innerHTML = `<p class="lede">Загрузка данных...</p>`;
  state.data = await loadData();
  window.addEventListener("hashchange", render);
  render();
}

init();
