# Reporte de validación — LogiFresh México

**Responsable:** Dra. Elda C. Morales  
**Fecha de validación local:** 2 de septiembre de 2026  
**Fuente:** `Datos_sinteticos_LogiFresh_dashboard.xlsx`  
**Alcance:** calidad de datos, cálculos, filtros, diseño responsive, accesibilidad básica, rutas y preparación para GitHub Pages.

## 1. Perfil de calidad

| Control | Resultado | Estado |
|---|---:|:---:|
| Filas de datos | 240 | Pasa |
| Columnas | 18 | Pasa |
| ID duplicados | 0 | Pasa |
| Celdas faltantes | 0 | Pasa |
| Categorías SLA inválidas | 0 | Pasa |
| Categorías de excursión inválidas | 0 | Pasa |
| Satisfacción fuera de 1–10 | 0 | Pasa |
| Ocupación fuera de 0–1 | 0 | Pasa |
| Reclamaciones negativas | 0 | Pasa |
| Retrasos negativos | 0 | Pasa |
| Inconsistencia SLA/retraso | 0 | Pasa |
| Periodo | 2026-04-01 a 2026-06-28 | Pasa |

Se verificó visualmente la hoja `Datos` y la hoja `Diccionario_y_control`. La suma de reclamaciones se calculó con dos lecturas independientes del libro y produjo el mismo resultado.

## 2. Reconciliación de valores de control

| Métrica | Esperado en guía/control | Obtenido de 240 filas | Estado |
|---|---:|---:|:---:|
| Embarques | 240 | 240 | Pasa |
| SLA | 76.7% | 76.7% (184/240) | Pasa |
| Retraso promedio de tardíos | 51.8 min | 51.8 min (56 tardíos) | Pasa |
| Incidentes | 52 | 52 | Pasa |
| Excursiones > 8 °C | 9 | 9 | Pasa |
| Reclamaciones | $882,649 MXN | **$882,549 MXN** | **No reconcilia: −$100** |
| Satisfacción | 8.5/10 | 8.5/10 | Pasa |

### Diagnóstico de la diferencia

Los 15 importes distintos de cero suman $882,549 MXN. La discrepancia no es redondeo: todos los importes son enteros. No existe evidencia para identificar qué fila debería cambiar; por ello, corregir una fila o sumar $100 artificialmente sería inventar un dato. Se conserva el archivo original y el dashboard presenta una alerta visible.

## 3. Preguntas analíticas

1. ¿Cuál es la brecha de SLA frente a la meta de 90%?
2. ¿Cómo evoluciona el SLA por mes?
3. ¿Qué segmentos muestran menor SLA o mayor impacto económico?
4. ¿Qué categorías concentran incidentes y reclamaciones?
5. ¿Qué registros requieren revisión?
6. ¿Qué hechos, hipótesis y datos faltantes deben guiar un piloto de 30 días?

## 4. Decisiones de diseño

- Sitio estático sin dependencias externas para reducir carga, fallas de CDN y superficie de seguridad.
- Un único estado de filtros intersecta criterios y alimenta todos los componentes.
- SVG para gráficas; cada gráfica incluye descripción textual equivalente.
- Barras desde cero para comparar categorías y línea con referencia explícita de 90% para el SLA mensual.
- Branding Elda HACKS · Berries en Frío: azul noche, cian de cadena fría, frambuesa para alertas y verde para estados favorables.
- En móvil, paneles y controles se apilan; la tabla desplaza dentro de su contenedor.

## 5. Pruebas funcionales locales

| Prueba | Esperado | Obtenido | Estado |
|---|---|---|:---:|
| Carga inicial | 240; SLA 76.7%; retraso 51.8; 52; 9; $882,649; 8.5 | 240; 76.7%; 51.8; 52; 9; **$882,549**; 8.5 | Parcial: control fuente difiere |
| Filtro individual | Producto = Berries actualiza todo | 48; SLA 75%; retraso 49.2; 10 incidentes; 2 excursiones; $119,400; 8.5 | Pasa |
| Dos filtros | Berries ∩ Prioritaria | 16; SLA 75%; retraso 52.5; 3 incidentes; 0 excursiones; $0; 8.5 | Pasa |
| Intersección | Resultado no debe sumar poblaciones | 16 filas, subconjunto de las 48 Berries | Pasa |
| Sincronía | KPI, 4 gráficas, interpretación y tabla cambian | Todos reflejan la población de 16 | Pasa |
| Restablecimiento | Regresa a 240 | 240 y filtros en “Todos” | Pasa |
| Sin resultados | CDMX ∩ Tijuana devuelve 0 y mensaje | Mensaje visible; panel analítico oculto sin error | Pasa |
| Rutas locales | CSS, datos y JS cargan con rutas relativas | Página estilizada, 240 filas y 4 SVG activos | Pasa |
| Consola | Sin errores ni advertencias | 0 errores / 0 advertencias | Pasa |
| Escritorio | 8 filtros, 8 KPI, 4 gráficas legibles | Confirmado a 1280 × 720 | Pasa |
| Móvil | Reflujo sin reducir toda la interfaz | Confirmado a 390 × 844; una columna | Pasa |
| Accesibilidad básica | H1 único, regiones, etiquetas, foco visible, `aria-live`, texto equivalente | Estructura semántica y controles nativos confirmados | Pasa |
| Publicación | URL pública y recursos HTTP correctos | URL responde; HTML, CSS y JS descargados; SHA-256 idénticos a la copia local | Pasa |

## 6. Evidencia visual

- Vista de escritorio sin filtros: archivo local `evidencia/dashboard-escritorio.jpg`.
- Vista con Producto = Berries y Tipo de ruta = Prioritaria: archivo local `evidencia/dashboard-dos-filtros.jpg`.
- Vista móvil a 390 × 844: archivo local `evidencia/dashboard-movil.jpg`.

Las capturas se conservan en la copia local de auditoría. La evidencia pública reproducible está formada por este reporte, `tests/test-data.mjs` y la verificación directa de la URL publicada.

### Pruebas sobre la URL pública

| Prueba | Esperado | Obtenido | Estado |
|---|---|---|:---:|
| Carga inicial | 240; 76.7%; 51.8 min; 52; 9; $882,549 observado; 8.5/10 | Coincide en los ocho KPI | Pasa |
| Filtro Berries | 48 embarques y actualización integral | 48; 75%; 49.2 min; 10; 2; $119,400; 8.5/10; 4 gráficas | Pasa |
| Berries + Prioritaria | 16 embarques | 16; 75%; 52.5 min; 3; 0; $0; 8.5/10; 16 filas | Pasa |
| Restablecer | Volver a 240 | 240 y KPI iniciales restaurados | Pasa |
| CDMX + Tijuana | 0 y estado sin datos | Mensaje visible; análisis oculto; sin promedios engañosos | Pasa |
| Vista móvil | 390 × 844 con componentes visibles | H1, filtros y cuatro gráficas presentes | Pasa |
| Integridad de recursos | HTML, CSS, datos y lógica idénticos | Cuatro pares de SHA-256 coincidentes | Pasa |

## 7. Correcciones realizadas

1. La primera prueba de estado vacío intentó usar un destino `CDMX`, valor que no existe en el filtro. Se corrigió el caso a `Origen = CDMX` y `Destino = Tijuana`, combinación válida sin filas.
2. Las etiquetas de frecuencia mostraban “1 embarques”; se añadió pluralización correcta.
3. Se ajustaron resúmenes de reclamaciones para eliminar espacios sobrantes cuando la unidad ya está incluida en el formato monetario.
4. Se hizo explícita la discrepancia de $100 en el encabezado, el KPI, las definiciones y la documentación.

## 8. Hallazgos, hipótesis y piloto

### Hechos

1. El SLA agregado de 76.7% está 13.3 puntos porcentuales por debajo de la meta.
2. Los 52 incidentes se concentran en abril, mientras los 56 tardíos se concentran en junio; el patrón es artificial y limita cualquier explicación causal.
3. Las rutas Estándar registran $443,749 MXN en reclamaciones y 55.6 minutos de retraso promedio entre tardíos, los valores más altos entre tipos de ruta.

### Hipótesis por validar

1. La operación de junio podría estar asociada con la caída del SLA; deben capturarse tiempos por etapa, clima, tráfico y cambios operativos para evaluar la hipótesis.
2. La combinación de tipo de ruta y producto podría asociarse con mayor impacto económico; debe compararse exposición, severidad y costo por embarque antes de atribuir un efecto.

### Piloto de 30 días

Seleccionar rutas Estándar comparables, estratificadas por producto. Aplicar puntos de control en salida, tránsito y preentrega; registrar responsable, marca de tiempo, desviación y causa validada. Usar rutas Prioritarias o Consolidadas comparables como referencia. Revisar semanalmente SLA, retraso de tardíos, excursiones y reclamaciones. Criterio sugerido: mejorar al menos 8 puntos porcentuales el SLA frente a la línea basal sin aumentar excursiones ni reclamaciones; mantener la meta estratégica de 90%.

## 9. Riesgos y datos faltantes

- Causa raíz validada y relación temporal entre evento e incumplimiento.
- Tiempos por etapa y marcas de tiempo operativas.
- Condiciones externas: tráfico, clima, cierres y ventanas del cliente.
- Costo de la intervención y valor/carga expuesta por segmento.
- Tamaño de muestra suficiente para comparar segmentos y variabilidad.
- Corrección autorizada del valor de control o de la fila que explica los $100 faltantes.

## 10. Estado de publicación

Publicación completada el 2 de septiembre de 2026, después de la aprobación explícita de la Dra. Elda C. Morales.

- Repositorio: <https://github.com/eldamorales/ai-tools-logifresh-Elda>
- GitHub Pages: <https://eldamorales.github.io/ai-tools-logifresh-Elda/>
- Fuente de publicación: rama `main`, carpeta `/`.
- HTTPS: obligatorio y activo en el dominio predeterminado de GitHub Pages.
- Verificación: URL abierta con un navegador independiente; filtros, estado vacío, vista móvil y recursos propios comprobados.

## 11. Fuentes técnicas verificadas

- GitHub Docs. [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Consulta: 2 de septiembre de 2026.
- GitHub Docs. [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Consulta: 2 de septiembre de 2026.
- GitHub Docs. [Troubleshooting 404 errors for GitHub Pages sites](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites). Consulta: 2 de septiembre de 2026.
