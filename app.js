(() => {
  "use strict";

  const DATA = Array.isArray(window.LOGIFRESH_DATA) ? window.LOGIFRESH_DATA : [];
  const SLA_TARGET = 90;
  const FILTERS = [
    ["mes", "Mes"], ["origen", "Origen"], ["destino", "Destino"], ["producto", "Producto"],
    ["transportista", "Transportista"], ["tipo_ruta", "Tipo de ruta"], ["sla_entrega", "SLA"], ["tipo_incidente", "Incidente"],
  ];
  const LABELS = Object.fromEntries(FILTERS);
  const MONTHS = { "2026-04": "Abr 2026", "2026-05": "May 2026", "2026-06": "Jun 2026" };
  const INCIDENT_ORDER = ["Falla mecánica", "Ventana de entrega", "Temperatura", "Documentación", "Tráfico"];
  const state = { filters: Object.fromEntries(FILTERS.map(([field]) => [field, ""])), segment: "producto", search: "", limit: 25 };

  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const round = (value, digits = 1) => Number(value.toFixed(digits));
  const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);
  const mean = (values) => values.length ? sum(values) / values.length : null;
  const formatNumber = new Intl.NumberFormat("es-MX");
  const formatCurrency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  const formatDate = (iso) => new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

  function metrics(rows) {
    const late = rows.filter((row) => Number(row.retraso_min) > 0);
    const compliant = rows.filter((row) => row.sla_entrega === "Cumple").length;
    return {
      embarques: rows.length,
      sla: rows.length ? compliant / rows.length * 100 : null,
      brecha: rows.length ? compliant / rows.length * 100 - SLA_TARGET : null,
      retraso: late.length ? mean(late.map((row) => row.retraso_min)) : null,
      tardios: late.length,
      incidentes: rows.filter((row) => row.tipo_incidente !== "Sin incidente").length,
      excursiones: rows.filter((row) => row.excursion_temp_mayor_8c === "Sí").length,
      reclamaciones: sum(rows.map((row) => row.reclamacion_mxn)),
      satisfaccion: rows.length ? mean(rows.map((row) => row.satisfaccion_1_10)) : null,
    };
  }

  function filteredRows() {
    return DATA.filter((row) => Object.entries(state.filters).every(([field, value]) => !value || String(row[field]) === value));
  }

  function unique(field) {
    return [...new Set(DATA.map((row) => String(row[field])))].sort((a, b) => a.localeCompare(b, "es"));
  }

  function group(rows, field, include = null) {
    const values = include || [...new Set(rows.map((row) => row[field]))];
    return values.map((value) => ({ value, rows: rows.filter((row) => row[field] === value) }));
  }

  function renderFilters() {
    const host = $("#filters");
    host.innerHTML = FILTERS.map(([field, label]) => {
      const options = unique(field).map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(field === "mes" ? MONTHS[value] : value)}</option>`).join("");
      return `<label class="filter-control" for="filter-${field}">${escapeHTML(label)}<select id="filter-${field}" data-filter="${field}"><option value="">Todos</option>${options}</select></label>`;
    }).join("");
    host.querySelectorAll("[data-filter]").forEach((select) => select.addEventListener("change", () => {
      state.filters[select.dataset.filter] = select.value;
      state.limit = 25;
      update();
    }));
  }

  function renderStatus(rows) {
    const active = Object.entries(state.filters).filter(([, value]) => value);
    const detail = active.length ? active.map(([field, value]) => `${LABELS[field]}: ${field === "mes" ? MONTHS[value] : value}`).join(" · ") : "Sin filtros activos";
    $("#filter-status").textContent = `${detail}. ${rows.length} de ${DATA.length} embarques en la selección.`;
  }

  function renderKPIs(rows) {
    const m = metrics(rows);
    const slaClass = m.sla !== null && m.sla >= SLA_TARGET ? "good" : "alert";
    const cards = [
      ["Embarques", formatNumber.format(m.embarques), `${rows.length === DATA.length ? "Población completa" : "Población filtrada"}`, ""],
      ["SLA", m.sla === null ? "—" : `${round(m.sla)}%`, "Meta SLA claramente definida: 90%", slaClass],
      ["Brecha vs. meta", m.brecha === null ? "—" : `${m.brecha > 0 ? "+" : ""}${round(m.brecha)} pp`, "Puntos porcentuales frente a 90%", slaClass],
      ["Retraso de tardíos", m.retraso === null ? "—" : `${round(m.retraso)} min`, `${m.tardios} embarques con retraso > 0`, ""],
      ["Incidentes", formatNumber.format(m.incidentes), "Excluye “Sin incidente”", m.incidentes ? "alert" : "good"],
      ["Excursiones > 8 °C", formatNumber.format(m.excursiones), "Conteo de indicadores “Sí”", m.excursiones ? "alert" : "good"],
      ["Reclamaciones", formatCurrency.format(m.reclamaciones), "Suma observada; control global difiere por $100", m.reclamaciones ? "alert" : ""],
      ["Satisfacción", m.satisfaccion === null ? "—" : `${round(m.satisfaccion)}/10`, "Promedio simple", ""],
    ];
    $("#kpi-grid").innerHTML = cards.map(([label, value, note, klass]) => `<article class="kpi-card ${klass}"><span class="kpi-label">${label}</span><strong class="kpi-value">${value}</strong><span class="kpi-note">${note}</span></article>`).join("");
  }

  function trendChart(rows) {
    const values = group(rows, "mes", ["2026-04", "2026-05", "2026-06"]).map(({ value, rows: monthRows }) => ({ month: value, metric: metrics(monthRows) }));
    const present = values.filter((item) => item.metric.embarques > 0);
    if (!present.length) return `<p class="chart-summary">No hay datos mensuales para esta selección.</p>`;
    const width = 620, height = 275, left = 54, right = 20, top = 20, bottom = 48;
    const x = (index) => present.length === 1 ? (left + width - right) / 2 : left + index * ((width - left - right) / (present.length - 1));
    const y = (value) => top + (100 - value) / 100 * (height - top - bottom);
    const ticks = [0, 25, 50, 75, 100];
    const path = present.map((item, index) => `${index ? "L" : "M"}${x(index)},${y(item.metric.sla)}`).join(" ");
    const points = present.map((item, index) => `<circle class="point" cx="${x(index)}" cy="${y(item.metric.sla)}" r="6"><title>${MONTHS[item.month]}: ${round(item.metric.sla)}%, ${item.metric.embarques} embarques</title></circle><text class="value-label" x="${x(index)}" y="${Math.max(14, y(item.metric.sla) - 12)}" text-anchor="middle">${round(item.metric.sla)}%</text><text class="axis-label" x="${x(index)}" y="${height - 15}" text-anchor="middle">${MONTHS[item.month].slice(0, 3)}</text>`).join("");
    const grid = ticks.map((tick) => `<line class="grid-line" x1="${left}" x2="${width-right}" y1="${y(tick)}" y2="${y(tick)}"/><text class="axis-label" x="${left-10}" y="${y(tick)+4}" text-anchor="end">${tick}%</text>`).join("");
    const summary = present.map((item) => `${MONTHS[item.month]} ${round(item.metric.sla)}% (n=${item.metric.embarques})`).join("; ");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="SLA mensual: ${escapeHTML(summary)}. Meta 90%.">${grid}<line class="target-line" x1="${left}" x2="${width-right}" y1="${y(SLA_TARGET)}" y2="${y(SLA_TARGET)}"/><text class="axis-label" x="${width-right}" y="${y(SLA_TARGET)-7}" text-anchor="end">Meta 90%</text><path class="line-series" d="${path}"/>${points}</svg><p class="chart-summary">${escapeHTML(summary)}. La línea punteada representa la meta de 90%.</p>`;
  }

  function horizontalBars(items, { max = null, formatter = (value) => String(value), className = "bar", unit = "" } = {}) {
    if (!items.length || items.every((item) => item.value === 0)) return `<p class="chart-summary">No hay valores distintos de cero para esta selección.</p>`;
    const width = 620, labelWidth = 168, valueWidth = 86, rowHeight = 42, top = 10, height = top + items.length * rowHeight + 12;
    const maximum = max || Math.max(...items.map((item) => item.value), 1);
    const available = width - labelWidth - valueWidth - 20;
    const describe = (item) => {
      const suffix = unit === "embarques" ? (item.value === 1 ? " embarque" : " embarques") : (unit ? ` ${unit}` : "");
      return `${item.label}: ${formatter(item.value)}${suffix}`;
    };
    const rows = items.map((item, index) => {
      const y = top + index * rowHeight;
      const barWidth = Math.max(item.value ? 2 : 0, item.value / maximum * available);
      return `<text class="axis-label" x="0" y="${y+23}">${escapeHTML(item.label.length > 24 ? `${item.label.slice(0,23)}…` : item.label)}</text><rect class="${className}${item.low ? " low" : ""}" x="${labelWidth}" y="${y+8}" width="${barWidth}" height="20" rx="4"><title>${escapeHTML(describe(item))}</title></rect><text class="value-label" x="${labelWidth + barWidth + 8}" y="${y+23}">${escapeHTML(formatter(item.value))}</text>`;
    }).join("");
    const aria = items.map(describe).join("; ");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(aria)}">${rows}</svg><p class="chart-summary">${escapeHTML(aria)}.</p>`;
  }

  function renderCharts(rows) {
    $("#trend-chart").innerHTML = trendChart(rows);
    const segmentItems = group(rows, state.segment).map(({ value, rows: segmentRows }) => ({ label: String(value), value: metrics(segmentRows).sla, n: segmentRows.length })).sort((a, b) => a.value - b.value);
    $("#segment-chart").innerHTML = horizontalBars(segmentItems.map((item) => ({ ...item, low: item.value < SLA_TARGET })), { max: 100, formatter: (value) => `${round(value)}%`, unit: "SLA" });
    const incidentItems = INCIDENT_ORDER.map((incident) => ({ label: incident, value: rows.filter((row) => row.tipo_incidente === incident).length })).sort((a, b) => b.value - a.value);
    $("#incident-chart").innerHTML = horizontalBars(incidentItems, { formatter: (value) => formatNumber.format(value), unit: "embarques" });
    const claimItems = INCIDENT_ORDER.concat(["Sin incidente"]).map((incident) => ({ label: incident, value: sum(rows.filter((row) => row.tipo_incidente === incident).map((row) => row.reclamacion_mxn)) })).sort((a, b) => b.value - a.value);
    $("#claims-chart").innerHTML = horizontalBars(claimItems, { formatter: (value) => formatCurrency.format(value), className: "bar claim", unit: "" });
  }

  function renderInterpretation(rows) {
    const m = metrics(rows);
    const productGroups = group(rows, "producto").filter((item) => item.rows.length).map((item) => ({ name: item.value, n: item.rows.length, ...metrics(item.rows) })).sort((a, b) => a.sla - b.sla || b.n - a.n);
    const lowest = productGroups[0];
    $("#facts").innerHTML = `<ul><li>El SLA es <strong>${round(m.sla)}%</strong>, una brecha de <strong>${round(Math.abs(m.brecha))} pp ${m.brecha < 0 ? "por debajo" : "por encima"}</strong> de la meta.</li><li>Se observan <strong>${m.incidentes}</strong> incidentes, <strong>${m.excursiones}</strong> excursiones y <strong>${formatCurrency.format(m.reclamaciones)}</strong> en reclamaciones.</li>${lowest ? `<li><strong>${escapeHTML(lowest.name)}</strong> presenta el SLA más bajo entre productos visibles: ${round(lowest.sla)}% (n=${lowest.n}).</li>` : ""}</ul>`;
    $("#hypotheses").innerHTML = `<ol><li>Las condiciones operativas de junio podrían estar asociadas con el aumento de tardíos; se requieren tiempos por etapa y factores externos.</li><li>La mezcla de producto y tipo de ruta podría relacionarse con la brecha de SLA; hace falta comparar exposición, severidad y controles equivalentes.</li></ol><p class="caution"><strong>Cautela:</strong> la coincidencia temporal o segmentada no demuestra causalidad.</p>`;
    $("#next-step").innerHTML = `<ol><li>Definir como línea basal SLA, retraso de tardíos y reclamaciones de la población elegida.</li><li>Aplicar durante 30 días una intervención acotada en <strong>${lowest ? escapeHTML(lowest.name) : "el segmento prioritario"}</strong>, con un segmento comparable sin intervención.</li><li>Responsable: Operaciones; revisión semanal con Calidad y Servicio al Cliente.</li><li>Éxito: mejora sostenida del SLA hacia 90% sin aumentar excursiones ni reclamaciones.</li></ol>`;
  }

  function renderTable(rows) {
    const query = state.search.trim().toLocaleLowerCase("es");
    const searched = query ? rows.filter((row) => [row.id_embarque, row.origen, row.destino, row.producto, row.tipo_incidente].some((value) => String(value).toLocaleLowerCase("es").includes(query))) : rows;
    const visible = searched.slice(0, state.limit);
    $("#table-caption").textContent = `Se muestran ${visible.length} de ${searched.length} registros coincidentes (${rows.length} en la selección global).`;
    $("#detail-body").innerHTML = visible.map((row) => `<tr><td><strong>${escapeHTML(row.id_embarque)}</strong></td><td>${escapeHTML(formatDate(row.fecha_salida))}</td><td>${escapeHTML(row.origen)} → ${escapeHTML(row.destino)}</td><td>${escapeHTML(row.producto)}</td><td><span class="status-pill ${row.sla_entrega === "Cumple" ? "ok" : "bad"}">${escapeHTML(row.sla_entrega)}</span></td><td>${formatNumber.format(row.retraso_min)} min</td><td>${escapeHTML(row.tipo_incidente)}</td><td>${Number(row.temperatura_max_c).toFixed(1)} °C</td><td>${formatCurrency.format(row.reclamacion_mxn)}</td></tr>`).join("");
    $("#show-more").hidden = visible.length >= searched.length;
  }

  function update() {
    const rows = filteredRows();
    renderStatus(rows);
    renderKPIs(rows);
    const empty = rows.length === 0;
    $("#empty-state").hidden = !empty;
    $("#analysis-content").hidden = empty;
    if (!empty) {
      renderCharts(rows);
      renderInterpretation(rows);
      renderTable(rows);
    }
    document.dispatchEvent(new CustomEvent("logifresh:updated", { detail: { rows: rows.length, metrics: metrics(rows) } }));
  }

  function reset() {
    Object.keys(state.filters).forEach((field) => {
      state.filters[field] = "";
      const select = $(`#filter-${field}`);
      if (select) select.value = "";
    });
    state.search = "";
    state.limit = 25;
    $("#record-search").value = "";
    update();
  }

  function applyFilters(filters) {
    reset();
    Object.entries(filters).forEach(([field, value]) => {
      if (!(field in state.filters)) return;
      state.filters[field] = String(value);
      const select = $(`#filter-${field}`);
      if (select) select.value = String(value);
    });
    update();
    return metrics(filteredRows());
  }

  function init() {
    renderFilters();
    $("#reset-filters").addEventListener("click", reset);
    document.querySelectorAll("[data-reset]").forEach((button) => button.addEventListener("click", reset));
    $("#segment-dimension").addEventListener("change", (event) => { state.segment = event.target.value; renderCharts(filteredRows()); });
    $("#record-search").addEventListener("input", (event) => { state.search = event.target.value; state.limit = 25; renderTable(filteredRows()); });
    $("#show-more").addEventListener("click", () => { state.limit += 25; renderTable(filteredRows()); });
    update();
  }

  window.LogiFreshDashboard = { metrics, filteredRows, applyFilters, reset, getState: () => JSON.parse(JSON.stringify(state)), dataLength: DATA.length };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
