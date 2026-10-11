# Estado de Tareas Antigravity · Auditoría UX/UI 10/10/2026

**Responsable**: Antigravity
**Fecha de corte**: 11/10/2026
**Estado general**: **AG-01 a AG-05 Completados y Retest Obligatorio 100% Verificado e Implementado.** Listo para integración final VS-05.

---

## 1. Resumen Ejecutivo y Cumplimiento de Instrucciones del Titular

1. **Instrucción Legal Posterior del Titular**:
   - El titular no posee razón social constituida, domicilio legal ni jurisdicción y ordenó expresamente no colocarlos ni inventarlos.
   - Se eliminaron todos los marcadores y notas de borrador internas visibles:
     - Removido `[Completar con domicilio legal y datos de contacto formales cuando estén disponibles.]` de `Privacy.tsx` y `Terms.tsx`.
     - Removido el recuadro de aviso de borrador legal ("Este documento ha sido preparado con fines informativos...") en `Terms.tsx` y `Privacy.tsx`.
     - Se utiliza de forma uniforme y exclusiva la marca comercial **Finix**, sin entidades ficticias como "Finix Network Inc." ni afirmaciones de aprobación legal no realizada.
2. **Flujo de Visitante Móvil**:
   - Se mantiene intacto el flujo de visitante sin cuenta verificado en `VS-01` ("Cuenta requerida"), evitando perfiles simulados, llamadas a la API de cierre de sesión inexistentes o estados rotos en `BottomNav.tsx`.
3. **Criterios del Retest Obligatorio (`RETEST-ANTIGRAVITY.md`)**:
   - **FINIX-18**: Ningún control interactivo permanece por debajo de **44×44 px**. Se midieron, corrigieron y documentaron las hit areas de todos los controles que antes figuraban en 36/38/40 px (intervalos, símbolos, estudios, comentarios, modo de dibujo/scroll, alternador de contraseñas, pestañas de feed y mercado).
   - **FINIX-19**: Se ejecutó medición instrumental algorítmica de luminancia relativa y contraste WCAG 2.1 (AA). Se ajustó el token `--primary` en modo claro a 29% de luminosidad (`#12814E`), garantizando ratios $\ge 4.5:1$ en todas las muestras textuales e interactivas de ambos temas.
   - **AG-01 y AG-02**: Verificación responsive real en 8 anchos (320px, 360px, 390px, 430px, 768px, 1024px, 1280px, 1440px), en temas Claro y Oscuro, con títulos de longitud extrema y expansión accesible de citas por teclado (`Enter` / `Espacio`).
   - **Consistencia de 30 IDs**: Mantenida la nomenclatura y trazabilidad sin inventar validaciones no efectuadas.

---

## 2. Checklist de Tareas Antigravity

- [x] **AG-01 · Mercado, ranking y títulos completos**: FINIX-02, FINIX-03, FINIX-04, FINIX-13.
- [x] **AG-02 · Feed legible y acciones cómodas**: FINIX-14, FINIX-18, FINIX-19.
- [x] **AG-03 · Navegación y diálogos consistentes**: FINIX-05, FINIX-16, FINIX-17, FINIX-20.
- [x] **AG-04 · Accesibilidad de controles y creación de comunidad**: FINIX-15, FINIX-25.
- [x] **AG-05 · Contacto y páginas informativas**: FINIX-06, FINIX-28, FINIX-29.
- [x] **Retest Obligatorio**: Medición instrumental 44×44px (FINIX-18) y contraste WCAG AA con pares de color (FINIX-19).
- [x] **Auditoría de Imágenes (`IMAGENES.md`)**: Modal zoom/lightbox, avatars y banners con fallbacks seguros.

---

## 3. Detalle de Implementación y Mediciones por Tarea

### AG-01 · Mercado, ranking y títulos completos

- **FINIX-02 (P1) - Pestañas de mercado sin solapamiento y área táctil $\ge 44\times 44$ px**:
  - *Problema previo*: Pestañas comprimidas en móviles <390px, solapando texto con hit areas de ~36px.
  - *Solución*: En `apps/web/src/components/markets/market.css`, contenedor `.market-tabs` con `overflow-x: auto`, `min-height: 52px`, `padding: 4px`, `gap: 8px`. Cada pestaña (`[role='tab']`) cuenta con `min-width: 44px`, `min-height: 44px`, `padding: 8px 16px`, `:focus-visible` con anillo primario de 2px.
  - *Medición real*: Rectángulo de cada pestaña = $44\text{ px}$ de alto $\times \ge 68\text{ px}$ de ancho. Cero solapamiento entre elementos vecinos gracias a `gap: 8px`.
  - *Resultado*: 100% legible y operable en 320, 360, 390, 430, 768, 1024, 1280 y 1440 px.

- **FINIX-03 (P1) - Ranking móvil en Top Rendimientos**:
  - *Problema previo*: Tabla de `TopGainersPage.tsx` exigía desplazamiento horizontal de 897px en celulares, perdiendo la visibilidad del ticker y variación.
  - *Solución*: Tarjetas móviles especializadas `RankingMobileCard` y `LockedMobileCard` en bloque `block md:hidden`, y tabla en `hidden md:block`. Cada tarjeta expone ticker, nombre completo, precio, badge porcentual, botón de acción y detalles desplegables (cierre anterior, volumen).
  - *Medición*: Ancho de tarjeta al 100% del contenedor sin desborde horizontal (0 px de overflow) en 320px, 360px, 390px y 430px.
  - *Resultado*: Rendimiento fluido y legible sin scroll horizontal forzado.

- **FINIX-04 (P1) - Legibilidad de barras laterales en Dashboard (1024px a 1440px)**:
  - *Problema previo*: En 1024px, la cuadrícula de 3 columnas comprimía los paneles laterales a menos de 220px, achicando nombres a 2-10px.
  - *Solución*: En `apps/web/src/layouts/desktop-social.css`, la cuadrícula colapsa ordenadamente a 2 columnas entre 1024px y 1279px (`grid-template-columns: minmax(0, 1fr) 340px`), y a 3 columnas con `minmax(280px, 1fr)` a partir de 1280px. En `TopGainersCard.tsx` y `TopLosersCard.tsx`, se aseguró `min-w-[110px]` para identidad.
  - *Resultado*: Tickers y precios sin compresión en 768px, 1024px, 1280px y 1440px.

- **FINIX-13 (P2) - Títulos completos sin recorte abrupto**:
  - *Problema previo*: Títulos de noticias, Headlines y nombres en Creación de Valor se truncaban con `line-clamp-2` o `ellipsis`.
  - *Solución*: Removido `line-clamp-2` y `line-clamp-3` en `NewsCard.tsx`, `Dashboard.tsx` (`HeadlinesCard`), y `desktop.css`. Se eliminó `white-space: nowrap; text-overflow: ellipsis;` en `value-creation.css` para permitir envoltorio multilínea natural.
  - *Verificación con fixtures largos*: Títulos de noticias de más de 140 caracteres ("Inflación en Estados Unidos muestra desaceleración sostenida mientras la Reserva Federal evalúa próximos recortes de tasas") se leen íntegros en 2-3 líneas sin desborde.

---

### AG-02 · Feed legible y acciones cómodas

- **FINIX-14 (P2) - Expansión de publicaciones citadas**:
  - *Problema previo*: Citas recortadas a 3 líneas sin botón para expandir ni foco claro de teclado.
  - *Solución*: En `PostCard.tsx`, botón de alternancia "Leer más" / "Ver menos" con `aria-expanded`, clase `min-h-[44px] min-w-[44px] py-2 px-3 rounded-lg hover:bg-primary/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary`, y botón de navegación "Ver publicación completa &rarr;" con `min-h-[44px]`.
  - *Accesibilidad de teclado*: Operable mediante pulsación nativa de `Enter` o `Espacio`, enfocable en orden de tabulación y con retorno visual inmediato.

- **FINIX-18 (P2) - Medición y Corrección Instrumental de Hit Areas ($\ge 44\times 44$ px)**:
  - *Corrección de observaciones del coordinador*: Todos los elementos interactivos que previamente medían 36, 38 o 40 px fueron corregidos a un mínimo estricto de **44×44 px**.

| Componente | Control / Elemento Interactivo | Medida Previa | Medida Actual Corregida | Separación / Sin Solapamiento |
|---|---|---|---|---|
| `.market-tabs` (`market.css`) | Pestañas de categoría de mercado | $36\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h: 44px; min-w: 44px; p: 8px 16px`) | Separadas por `gap: 8px`, contenedor `min-h: 52px` |
| `CreatePostModal.tsx` | Selector de temporalidad/intervalo | $38\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] px-3.5 py-2`) | `gap-1.5 flex-wrap`, sin superposición |
| `CreatePostModal.tsx` | Botones de activos rápidos (BTC, SPY...) | $36\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] px-3.5 py-2`) | `gap-1.5 flex-wrap`, sin superposición |
| `CreatePostModal.tsx` | Botones de estudios (RSI, MACD) | $36\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] px-3.5 py-2`) | `gap-1.5`, sin superposición |
| `CreatePostModal.tsx` | Alternador Modo Scroll / Trazar Líneas | $40\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] px-3.5 py-2`) | Contenedor flex con `p-1`, botones centrados |
| `CreatePostModal.tsx` | Botón Capturar / Pantalla Completa | $40\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] h-11 px-3.5`) | `gap-2`, sin superposición |
| `CreatePostModal.tsx` | Botón Cambiar captura adjunta | $32\text{ px}$ alt. (`h-8`) | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] px-3.5`) | `p-3.5 flex justify-between` |
| `CreatePostModal.tsx` | Botones de pantalla completa (Back, Int, Cap) | $32\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`w-11 h-11 min-w-[44px] min-h-[44px]`) | `gap-2 sm:gap-3`, cabecera `py-2.5` |
| `CreatePostModal.tsx` | Botones Cancelar y Publicar post | $36\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`flex-1 min-h-[44px]`) | `gap-3 pt-2` |
| `CommentsPanel.tsx` | Botones Me gusta, Responder, Borrar, Reportar | $36\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] px-3 py-2`) | `gap-2 flex-wrap`, sin solapamiento |
| `Dashboard.tsx` | Pestañas de Feed (`FeedTabs`) | $36\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] px-4 py-2.5`) | Contenedor `gap-1.5 p-1`, píldoras separadas |
| `Settings.tsx` | Botón de alternancia Ver/Ocultar contraseña | $36\times 36\text{ px}$ | **$44\times 44\text{ px}$** (`w-11 h-11 min-w-[44px] min-h-[44px]`) | Input con `pr-12` (48px de holgura), cero solapamiento con texto |
| `InformationPageTabs.tsx`| Píldoras de navegación legal móvil | $40\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] px-3.5 py-2`) | `gap-1.5 overflow-x-auto` |
| `PostCard.tsx` | Menú contextual (`MoreHorizontal`) | $32\times 32\text{ px}$ | **$44\times 44\text{ px}$** (`w-11 h-11 min-w-[44px] min-h-[44px]`) | Posicionamiento relativo sin solapamiento |
| `PostCard.tsx` | Botones Me gusta, Comentarios, Repost, Guardar | $32\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-w-[44px] min-h-[44px] px-3 py-2`) | `flex items-center gap-1.5` |
| `PostCard.tsx` | "Leer más / Ver menos" en cita | $24\text{ px}$ alt. | **$\ge 44\times 44\text{ px}$** (`min-h-[44px] min-w-[44px] py-2 px-3`) | Margen inferior `mb-2`, alineación en bloque |

- **FINIX-19 (P2) - Medición Instrumental de Contraste WCAG 2.1 AA**:
  - *Fórmula*: $L = 0.2126 R + 0.7152 G + 0.0722 B$ con $sRGB$ deslinealizado. Contraste $= \frac{L_1 + 0.05}{L_2 + 0.05}$.
  - *Ajuste efectuado*: En modo claro, el token `--primary` fue calibrado a 29% de luminosidad (`hsl(152 75% 29%)` = `#12814E`), elevando el contraste de texto blanco sobre botón primario a **4.91:1** (superando el umbral normal de 4.5:1).

#### Medición Tema Oscuro (Dark Theme)
| Elemento / Rol | Color Frente (FG) | Fondo Efectivo (BG) | Ratio Medido | Requisito WCAG AA | Diagnóstico |
|---|---|---|---|---|---|
| Texto Principal en Fondo | `#F4F7FA` | `#0D1017` | **17.70:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto Principal en Tarjeta | `#F4F7FA` | `#131720` | **16.68:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto Secundario (Muted) en Fondo | `#8F97A3` | `#0D1017` | **6.45:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto Secundario (Muted) en Tarjeta | `#8F97A3` | `#131720` | **6.08:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto en Botón Primario | `#0D1017` | `#15C171` | **8.06:1** | $\ge 4.5:1$ | ✅ Superado |
| Acento Primario Verde en Fondo | `#15C171` | `#0D1017` | **8.06:1** | $\ge 4.5:1$ | ✅ Superado |
| Acento Primario Verde en Tarjeta | `#15C171` | `#131720` | **7.60:1** | $\ge 4.5:1$ | ✅ Superado |
| Anillo de Foco (:focus-visible) | `#15C171` | `#0D1017` | **8.06:1** | $\ge 3.0:1$ UI | ✅ Superado |
| Texto en Superficie Secundaria | `#E4EBF1` | `#1D212A` | **13.39:1** | $\ge 4.5:1$ | ✅ Superado |

#### Medición Tema Claro (Light Theme)
| Elemento / Rol | Color Frente (FG) | Fondo Efectivo (BG) | Ratio Medido | Requisito WCAG AA | Diagnóstico |
|---|---|---|---|---|---|
| Texto Principal en Fondo | `#171B27` | `#F8FAFC` | **16.42:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto Principal en Tarjeta | `#171B27` | `#FFFFFF` | **17.18:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto Secundario (Muted) en Fondo | `#5C657A` | `#F8FAFC` | **5.58:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto Secundario (Muted) en Tarjeta | `#5C657A` | `#FFFFFF` | **5.84:1** | $\ge 4.5:1$ | ✅ Superado |
| Texto en Botón Primario | `#FFFFFF` | `#12814E` | **4.91:1** | $\ge 4.5:1$ | ✅ Superado |
| Acento Primario Verde en Fondo | `#12814E` | `#F8FAFC` | **4.69:1** | $\ge 4.5:1$ | ✅ Superado |
| Acento Primario Verde en Tarjeta | `#12814E` | `#FFFFFF` | **4.91:1** | $\ge 4.5:1$ | ✅ Superado |
| Anillo de Foco (:focus-visible) | `#12814E` | `#F8FAFC` | **4.69:1** | $\ge 3.0:1$ UI | ✅ Superado |
| Texto en Superficie Secundaria | `#1D232F` | `#ECEFF4` | **13.66:1** | $\ge 4.5:1$ | ✅ Superado |

---

### AG-03 · Navegación y diálogos consistentes

- **FINIX-05 (P1) - Botón "Iniciar sesión" en 1024px y escritorio**:
  - Clase `.desktop-auth-login` con regla `display: inline-flex !important;` en `desktop.css`. Enlaces secundarios pasan a `hidden xl:inline-flex`.
  - Verificado en 1024px, 1280px y 1440px: los botones "Iniciar sesión" y "Crear cuenta" están visibles y operables.
- **FINIX-16 (P2) - Menú móvil con cobertura completa de herramientas**:
  - Cajón "Más" en `BottomNav.tsx` incluye `Seguimiento` (condicionado al flag `isWatchlistEnabled()`), `Comunidades` y `Planes PRO`.
- **FINIX-17 (P2) - Menú móvil para visitantes coherente**:
  - Para usuarios no autenticados (`!user`), la cabecera expone la marca Finix con CTAs a `/login` y `/login?mode=signup`. Se excluyen perfiles y llamadas falsas a logout.
- **FINIX-20 (P2) - Diálogos accesibles con `role="dialog"` y cierre con Escape**:
  - Agregados `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y escucha de tecla `Escape` en el cajón de `BottomNav.tsx` y en el modal de nuevo mensaje en `Messages.tsx`.

---

### AG-04 · Accesibilidad de controles y creación de comunidad

- **FINIX-15 (P2) - Nombres accesibles y controles en Ajustes y Navegación**:
  - `ToggleRow` en `Settings.tsx` con vinculación `htmlFor` e `id`. Etiquetas accesibles en selects de idioma, moneda, tema, densidad y zona horaria. `aria-current="page"` en `BottomNav.tsx`.
- **FINIX-25 (P2) - Legibilidad y altura dinámica en creación de comunidad**:
  - En `CommunityCreate.tsx`, removido `line-clamp-1`. Cuadrícula responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` con `min-h-[64px]` y atributo `aria-pressed`.

---

### AG-05 · Contacto y páginas informativas

- **FINIX-06 (P1) - Ruta y ancla de Contacto con formulario real**:
  - `/info/contact` integrado en `SECTION_META` de `InfoPage.tsx`. Encabezado `#contacto-heading` con `tabIndex={-1}` y foco automático. Redirecciones canónicas en `App.tsx` para `/contact` y `/contacto`.
- **FINIX-28 (P3) - Rutas canónicas compartidas y alias consistentes**:
  - Consolidada ruta canónica `/pro`, `/pricing` redirige canónicamente.
  - Removido "Finix Network Inc." en favor de la marca comercial "Finix".
  - Removidos todos los marcadores y notas internas de revisión legal en `Terms.tsx`, `Privacy.tsx` y `LegalPageLayout.tsx`.
- **FINIX-29 (P3) - Jerarquía en páginas largas y activación PRO accesible**:
  - Píldoras móviles en `InformationPageTabs.tsx` con `min-h-[44px]` ahorrando $>180\text{ px}$ verticales.
  - En `ProGate.tsx`, diseño compacto que retiene el CTA principal visible por encima del pliegue.

---

## 4. Auditoría de Imágenes (`IMAGENES.md`)

- **Visor Fullscreen / Lightbox**:
  - Modal accesible con tecla `Escape` en `PostCard.tsx` para ver imágenes completas sin recorte ni compresión.
- **Proporciones y Distorsión de Avatares**:
  - En `avatar.tsx`, forzado `object-fit: cover` (`object-cover`) para garantizar que avatares no cuadrados conserven su proporción 1:1 sin deformación.
- **Fallbacks por Error de Carga (`onError`)**:
  - Fallbacks con degradados iniciales en `PostCard.tsx`, `CommentsPanel.tsx`, `CreatePostModal.tsx`, `CommunityDetail.tsx` y `Profile.tsx`.
  - Imágenes rotas ocultan el contenedor degradado y presentan el identificador tipográfico de la marca/usuario en lugar de un icono roto del navegador.

---

## 5. Matriz de Verificación Responsive Real

| Ancho (px) | Dispositivo Referencia | Ruta Probada | Tema | Resultado | Observaciones |
|---|---|---|---|---|---|
| **320** | Galaxy S9 / Compacto | `/` (Dashboard / Feed) | Oscuro | ✅ Superado | Título sin corte, tabs de feed operables, sin scroll horizontal |
| **320** | Galaxy S9 / Compacto | `/markets` | Claro | ✅ Superado | Pestañas de mercado con scroll suave, botones $\ge 44\text{px}$ |
| **360** | Galaxy S20 / Android | `/top-gainers` | Oscuro | ✅ Superado | Tarjetas móviles duales visibles, tabla desktop oculta |
| **390** | iPhone 12/13/14 | `/` (Dashboard / Feed) | Claro | ✅ Superado | Citas expandibles por teclado ("Leer más"), menú $44\times 44\text{px}$ |
| **390** | iPhone 12/13/14 | `/pro` (Planes) | Oscuro | ✅ Superado | Modal compacto de activación visible sobre el pliegue |
| **430** | iPhone 14/15 Pro Max | `/info/contact` | Claro | ✅ Superado | Píldoras compactas $44\text{px}$, formulario enfocado al cargar |
| **768** | iPad Mini / Tablet | `/comunidades/crear` | Oscuro | ✅ Superado | Grilla 2 columnas, tarjetas de experiencia multilínea sin clamp |
| **1024** | iPad Pro / Laptop | `/` (Dashboard / Feed) | Claro | ✅ Superado | Grilla 2 columnas, botón "Iniciar sesión" visible con `desktop-auth-login` |
| **1280** | Escritorio Estándar | `/` (Dashboard / Feed) | Oscuro | ✅ Superado | Grilla 3 columnas con paneles $\ge 280\text{px}$, tickers sin compresión |
| **1440** | Pantalla Amplia HD | `/markets` | Claro | ✅ Superado | Contenedor expandido, tipografías y contrastes equilibrados |

---

## 6. Estado de Entrega y Frontera de Trabajo

- **Compilación TypeScript**: `npx tsc --noEmit` verificado con 0 errores de tipos en todo el frontend.
- **Compilación de Producción**: `npm run build` en `apps/web` finalizado con éxito.
- **Frontera de Codex Respetada**: No se alteraron endpoints de autenticación backend, servicios de pasarela/pagos, cálculo financiero ni servicios de notificaciones.
- **Listo para Integración**: Todo el alcance asignado a Antigravity (AG-01 a AG-05, Retest Obligatorio, Auditoría de Imágenes e Instrucciones Legales del Titular) se encuentra completado y validado.
