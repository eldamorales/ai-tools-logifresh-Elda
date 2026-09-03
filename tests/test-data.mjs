import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../data.js", import.meta.url), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const data = sandbox.window.LOGIFRESH_DATA;

const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);
const mean = (values) => values.length ? sum(values) / values.length : null;
const round = (value, digits = 1) => Number(value.toFixed(digits));

function metrics(rows) {
  const late = rows.filter((row) => row.retraso_min > 0);
  return {
    embarques: rows.length,
    sla: rows.length ? round(rows.filter((row) => row.sla_entrega === "Cumple").length / rows.length * 100) : null,
    retraso: late.length ? round(mean(late.map((row) => row.retraso_min))) : null,
    incidentes: rows.filter((row) => row.tipo_incidente !== "Sin incidente").length,
    excursiones: rows.filter((row) => row.excursion_temp_mayor_8c === "Sí").length,
    reclamaciones: sum(rows.map((row) => row.reclamacion_mxn)),
    satisfaccion: rows.length ? round(mean(rows.map((row) => row.satisfaccion_1_10))) : null,
  };
}

const overall = metrics(data);
assert.deepEqual(overall, { embarques: 240, sla: 76.7, retraso: 51.8, incidentes: 52, excursiones: 9, reclamaciones: 882549, satisfaccion: 8.5 });

const berries = metrics(data.filter((row) => row.producto === "Berries"));
assert.deepEqual(berries, { embarques: 48, sla: 75, retraso: 49.2, incidentes: 10, excursiones: 2, reclamaciones: 119400, satisfaccion: 8.5 });

const combined = metrics(data.filter((row) => row.producto === "Berries" && row.tipo_ruta === "Prioritaria"));
assert.deepEqual(combined, { embarques: 16, sla: 75, retraso: 52.5, incidentes: 3, excursiones: 0, reclamaciones: 0, satisfaccion: 8.5 });

const empty = metrics(data.filter((row) => row.origen === "CDMX" && row.destino === "Tijuana"));
assert.deepEqual(empty, { embarques: 0, sla: null, retraso: null, incidentes: 0, excursiones: 0, reclamaciones: 0, satisfaccion: null });

assert.equal(new Set(data.map((row) => row.id_embarque)).size, 240, "Los ID deben ser únicos");
assert.equal(data.every((row) => Object.values(row).every((value) => value !== null && value !== "")), true, "No debe haber faltantes");
assert.equal(data.filter((row) => row.tipo_incidente !== "Sin incidente").length, 14 + 12 + 9 + 9 + 8);

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const required of ["Meta SLA: 90%", "Hechos, hipótesis y próximo paso", "./styles.css", "./data.js", "./app.js", "Datos_sinteticos_LogiFresh_dashboard.xlsx"]) {
  assert.ok(html.includes(required), `Falta contenido o ruta requerida: ${required}`);
}
assert.equal((html.match(/<h1/g) || []).length, 1, "Debe existir un solo H1");
assert.ok((html.match(/aria-live=/g) || []).length >= 5, "Deben anunciarse cambios dinámicos");

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(a, b) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
}
for (const [foreground, background] of [["102232", "ffffff"], ["ffffff", "071522"], ["006d83", "ffffff"], ["8e1f46", "fff5f8"], ["405462", "ffffff"]]) {
  assert.ok(contrast(foreground, background) >= 4.5, `Contraste insuficiente: #${foreground} / #${background}`);
}
for (const file of ["../index.html", "../styles.css", "../data.js", "../app.js", "../README.md", "../REPORTE_VALIDACION.md", "../.nojekyll"]) {
  assert.ok(fs.existsSync(new URL(file, import.meta.url)), `Falta archivo: ${file}`);
}

console.log(JSON.stringify({ status: "PASS", tests: 23, overall, berries, combined, empty }, null, 2));
