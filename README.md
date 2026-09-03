# LogiFresh México — Dashboard ejecutivo

Dashboard HTML interactivo para explorar el desempeño de 240 embarques sintéticos de cadena fría entre abril y junio de 2026. El producto está orientado a decidir dónde conviene ejecutar un piloto operativo de 30 días y qué evidencia adicional debe reunirse antes de intervenir.

**Responsable del material:** Dra. Elda C. Morales  
**Identidad:** ELDA HACKS · Berries en Frío  
**Repositorio previsto:** `https://github.com/eldamorales/ai-tools-logifresh-Elda`  
**GitHub Pages previsto:** `https://eldamorales.github.io/ai-tools-logifresh-Elda/`

## Qué incluye

- Ocho KPI: embarques, SLA, brecha frente a la meta de 90%, retraso promedio de tardíos, incidentes, excursiones mayores a 8 °C, reclamaciones y satisfacción.
- Ocho filtros globales: mes, origen, destino, producto, transportista, tipo de ruta, SLA e incidente.
- Evolución mensual del SLA, comparación por segmento, incidentes y reclamaciones.
- Tabla de detalle con búsqueda y carga progresiva.
- Estado sin resultados y botón de restablecimiento.
- Panel separado de Hechos, Hipótesis y Próximo paso.
- Definiciones, fuente, periodo, fecha de actualización y limitaciones visibles.

## Hallazgos principales

1. El SLA observado es **76.7% (184/240)**, **13.3 puntos porcentuales** por debajo de la meta de 90%.
2. Abril y mayo muestran 100% de SLA y junio 30%; todos los retrasos aparecen en junio y todos los incidentes clasificados en abril. Esta separación temporal extrema es una limitación del dataset sintético y no permite explicar causas.
3. Las reclamaciones calculadas desde las filas suman **$882,549 MXN**. Falla mecánica concentra $396,250 (44.9%), pero la concentración no prueba que el incidente haya causado la reclamación.

## Hallazgo de calidad que debe resolverse

La hoja `Diccionario_y_control` y la guía indican **$882,649 MXN** en reclamaciones, pero la suma independiente de las 240 filas es **$882,549 MXN**. La diferencia es **$100 MXN**. El dashboard preserva el valor calculado desde los datos, muestra la alerta y no modifica la fuente para forzar el resultado esperado.

## Arquitectura

El sitio usa HTML, CSS, JavaScript y SVG nativos. No requiere instalación, backend, base de datos, API, claves ni recursos de terceros. `data.js` contiene únicamente las 240 observaciones sintéticas convertidas desde el libro original.

```text
index.html        Estructura semántica del dashboard
styles.css        Diseño responsive y branding
data.js           Dataset sintético incorporado
app.js            Cálculos, filtros, gráficas y tabla
tests/             Pruebas reproducibles de datos y estructura
evidencia/         Capturas de validación visual
REPORTE_VALIDACION.md  Trazabilidad de calidad y pruebas
.nojekyll         Publicación estática sin procesamiento Jekyll
```

## Cálculos

- **Embarques:** `N = conteo de filas filtradas`.
- **SLA:** `100 × conteo(Cumple) / N`.
- **Brecha:** `SLA − 90%`, en puntos porcentuales.
- **Retraso de tardíos:** `suma(retraso_min) / conteo(retraso_min > 0)`.
- **Incidentes:** conteo de filas con categoría distinta de `Sin incidente`.
- **Excursiones:** conteo de filas marcadas `Sí` en `excursion_temp_mayor_8c`.
- **Reclamaciones:** suma de `reclamacion_mxn`, en MXN.
- **Satisfacción:** promedio simple de `satisfaccion_1_10`.

Cuando la selección está vacía, los conteos son cero y los promedios se muestran como no disponibles; no se divide entre cero.

## Ejecución local

No se necesita instalar ninguna biblioteca. Desde la carpeta del proyecto, puede abrirse con un servidor estático local. Por ejemplo, en una terminal:

```bash
python3 -m http.server 8000
```

Luego se visita `http://localhost:8000/`. El sitio también funciona en cualquier alojamiento estático equivalente.

## Pruebas

La prueba reproducible de datos y estructura se ejecuta desde la carpeta del proyecto:

```bash
node tests/test-data.mjs
```

La matriz completa, los valores esperados y obtenidos, las correcciones y la evidencia visual están en [REPORTE_VALIDACION.md](./REPORTE_VALIDACION.md).

## Piloto recomendado de 30 días

Probar una intervención operativa acotada en rutas **Estándar**, que muestran el mayor retraso promedio entre tardíos (55.6 min) y la mayor suma de reclamaciones entre tipos de ruta ($443,749 MXN), con rutas Prioritarias o Consolidadas comparables como referencia. Registrar hitos por etapa, causa raíz validada y factores externos; revisar semanalmente SLA, retraso, excursiones y reclamaciones. La asociación observada justifica investigar, no atribuir causalidad.

## Limitaciones

- Dataset sintético y periodo de solo tres meses.
- Patrones temporales artificiales: incidentes y retrasos no coinciden en el mismo mes.
- No hay causa raíz validada, tiempos por etapa, clima, tráfico observado, costo de intervención ni exposición comparable por segmento.
- El valor de control de reclamaciones no reconcilia con las filas.
- Las diferencias pequeñas entre segmentos no deben interpretarse como evidencia estadística de desempeño distinto.

## Publicación

Se publica desde la rama `main`, carpeta raíz `/`, con `index.html` en la raíz y `.nojekyll`. GitHub recomienda publicar desde una rama cuando un sitio estático no necesita proceso de compilación y señala que la publicación puede tardar hasta 10 minutos.

## Fuentes técnicas

- GitHub Docs. [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Consulta: 2 de septiembre de 2026.
- GitHub Docs. [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Consulta: 2 de septiembre de 2026.
- GitHub Docs. [Troubleshooting 404 errors for GitHub Pages sites](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites). Consulta: 2 de septiembre de 2026.

## Privacidad y seguridad

No se incluyen credenciales, tokens, datos personales ni el libro de trabajo original. El repositorio contiene únicamente el sitio estático, pruebas, documentación y capturas basadas en datos sintéticos.
