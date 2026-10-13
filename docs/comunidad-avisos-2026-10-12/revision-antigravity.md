# Informe de Revisión Independiente: Comunidades, Avisos y Flujos de Creadores

**Fecha:** 12 de octubre de 2026  
**Revisor:** Antigravity (Modo Solo Lectura)  
**Alcance:** Validación funcional de cambios recientes en backend y frontend para solicitudes, invitaciones, privacidad, comentarios, guardados, correo oficial y temas claro/oscuro.  
**Destino de implementación:** Codex (mismo repositorio, sin cambios directos de código por Antigravity).

---

## 1. Resumen Ejecutivo

Se realizó una auditoría funcional estricta y exhaustiva de la implementación en curso de la plataforma FINIX, enfocada en:
- `apps/api/src/communities/*`
- `apps/api/src/posts/*` (en particular `official-post-email.ts` y control de acceso en `posts.service.ts`)
- `apps/api/src/admin/email-marketing.service.ts`
- `apps/web/src/pages/CommunityDetail.tsx`
- `apps/web/src/pages/CommunityAdmin.tsx`
- `apps/web/src/pages/CommunityInvite.tsx`
- `apps/web/src/components/CommunityStudioTools.tsx`

La arquitectura general y el modelo de datos resuelven adecuadamente la separación de responsabilidades y la idempotencia de campañas. No obstante, se detectaron **6 fallos críticos funcionales** que impactan directamente en usuarios y creadores, junto a **7 inconsistencias de UX y soporte de temas (claro/oscuro)**.

---

## 2. Hallazgos Críticos Funcionales

### H-01: Las invitaciones a comunidades sin planes gratuitos fallan al ser aceptadas (Bloqueo Total)
- **Severidad:** Crítica (Funcional)
- **Archivos:** 
  - `apps/api/src/communities/communities.service.ts` (líneas 773–776 y 983–996)
  - `apps/web/src/pages/CommunityInvite.tsx`
- **Descripción:**  
  En `CommunitiesService.acceptInvite(code, userId)`, la membresía se procesa mediante `this.activateMembership(tx, invite.communityId, userId)`.  
  Dentro de `activateMembership`:
  ```ts
  const plan = planId ? community.plans.find(p => p.id === planId) :
      community.plans.find(p => Number(p.price) === 0) || (isFreeAccessEnabled() ? community.plans[0] : null);
  if (!plan) throw new BadRequestException('Esta comunidad requiere una membresía paga. Elegí un plan y usá el checkout.');
  if (!isFreeAccessEnabled() && Number(plan.price) > 0) throw new BadRequestException('Este plan requiere pago mediante checkout.');
  ```
- **Impacto:**  
  Si un creador genera un enlace de invitación para una comunidad paga (o cuando `FINIX_FREE_ACCESS_ENABLED` pase a `false`), el invitado autenticado hace clic en *"Aceptar invitación"* y recibe un error 400 (`BadRequestException`). La invitación es inutilizable en comunidades pagas.
- **Recomendación para Codex:**  
  Permitir que una invitación válida active una membresía otorgada por el creador (rol `MEMBER`, `paymentStatus: 'SUCCEEDED'`), o permitir asociar un `planId` a la invitación en `CommunityInvite` para asignar el nivel acordado sin exigir checkout adicional.

---

### H-02: Bypass de solicitud de ingreso en comunidades privadas mediante pago directo
- **Severidad:** Alta (Seguridad / Privacidad del Creador)
- **Archivos:**
  - `apps/api/src/communities/communities.service.ts` (líneas 820–844)
  - `apps/web/src/components/CommunityPaymentModal.tsx`
- **Descripción:**  
  En comunidades con `privacyType === 'PRIVATE'`, `joinFree` valida correctamente que exista una solicitud aprobada:
  ```ts
  if (community.privacyType === 'PRIVATE' && community.creatorId !== userId) {
      const approved = await tx.communityJoinRequest.findUnique({ where: { communityId_userId: { communityId, userId } } });
      if (approved?.status !== 'APPROVED') throw new ForbiddenException('Esta comunidad es privada. Enviá una solicitud de ingreso.');
  }
  ```
  Sin embargo, en `createCheckoutSession` (usado por Mercado Pago y Stripe):
  ```ts
  if (provider === 'mercadopago') {
      return this.mercadoPagoService.createCommunityPreference(userId, communityId, planId);
  }
  if (provider === 'stripe') {
      return this.stripeService.createCommunityPayment(userId, communityId, planId);
  }
  ```
- **Impacto:**  
  Cualquier usuario que invoque directamente el endpoint de checkout o elija un plan pago puede saltearse el filtro de solicitud y unirse a una comunidad privada sin la aprobación del creador.
- **Recomendación para Codex:**  
  Incorporar en `createCheckoutSession` la misma comprobación de `privacyType === 'PRIVATE'` verificando que exista `CommunityJoinRequest` con estado `APPROVED` antes de generar la sesión de pago.

---

### H-03: Campaña de correo oficial ignora imágenes de publicaciones
- **Severidad:** Media-Alta (Funcional / Comunicación)
- **Archivos:**
  - `apps/api/src/posts/official-post-email.ts` (líneas 20–25)
  - `apps/api/src/posts/posts.service.ts` (líneas 255–285)
- **Descripción:**  
  Al publicarse un post oficial, `queueOfficialPost` extrae el texto del post:
  ```ts
  const message = post.content || 'FINIX compartió una nueva imagen o análisis. Entrá para verlo.';
  const data = { sourceKey: `official-post:${post.id}`, subject: title, title, message,
      ctaUrl, ctaLabel: 'Ver publicación', audience: 'OFFICIAL',
      contentHtml: renderCampaign({ title, message, ctaUrl, ctaLabel: 'Ver publicación', audience: 'OFFICIAL' }),
      createdById: author.id, status: 'SENDING' };
  ```
- **Impacto:**  
  Las imágenes adjuntas (`post.media` o `mediaData`) no se extraen ni se envían a `renderCampaign({ imageUrl: ... })`. Cuando FINIX publica un gráfico o infografía oficial sin mucho texto, los suscriptores reciben un correo con el placeholder textual y sin la imagen compartida.
- **Recomendación para Codex:**  
  Extraer la primera imagen de `post.media` (o consultar `tx.postMedia.findFirst({ where: { postId: post.id } })`) y pasar su URL absoluta normalizada al campo `imageUrl` de `renderCampaign` y `ProEmailCampaign`.

---

### H-04: Posts guardados bloqueados rompen la vista de guardados en el perfil y explorar
- **Severidad:** Alta (Estabilidad UI)
- **Archivos:**
  - `apps/api/src/posts/posts.service.ts` (líneas 804–807)
  - `apps/web/src/pages/Profile.tsx` (líneas 1755–1776)
  - `apps/web/src/pages/Explore.tsx` (líneas 130–145)
  - `apps/web/src/components/posts/PostCard.tsx`
- **Descripción:**  
  En `PostsService.getSavedPosts`:
  ```ts
  posts: await Promise.all(items.map(async s => {
      try { await this.assertPostAccess(s.postId, userId); return enrichPost(s.post, userId); }
      catch { return { id: s.postId, content: null, media: [], isLocked: true }; }
  }))
  ```
  El objeto devuelto en el bloque `catch` carece de propiedades fundamentales requeridas por `PostCard` (`author`, `createdAt`, `_count`, `likesCount`, `type`).
- **Impacto:**  
  En `/profile` (pestaña "Guardados") y en `/explore` (filtro de guardados), el componente `PostCard` renderiza tarjetas con autor *"Usuario"*, fecha vacía y contadores rotos, o lanza advertencias de renderizado por propiedades faltantes.
- **Recomendación para Codex:**  
  Incluir los datos mínimos del post con autor y contexto de comunidad pero con indicador `isLocked: true`, o bien descartar los posts bloqueados si el usuario ya no tiene acceso a la comunidad.

---

### H-05: Estado de guardado (`isSaved`) no se recupera en publicaciones de comunidades
- **Severidad:** Media (UX / Estado)
- **Archivos:**
  - `apps/api/src/communities/communities.service.ts` (líneas 555–568, `listPosts`)
  - `apps/web/src/pages/CommunityDetail.tsx` (líneas 138 y 289–295)
- **Descripción:**  
  En `CommunitiesService.listPosts`, la consulta a Prisma incluye `likes` pero no incluye la relación `saves` para el `userId` actual.  
  En el frontend (`CommunityDetail.tsx`), el estado local se inicializa en falso:
  ```tsx
  const [saved, setSaved] = useState(false);
  ```
- **Impacto:**  
  Si un miembro guarda una publicación dentro de una comunidad y recarga la página, el botón de bookmark aparece siempre desmarcado, impidiendo saber si ya está guardada.
- **Recomendación para Codex:**  
  Agregar `saves: userId ? { where: { userId }, select: { userId: true } } : false` en `listPosts` de `communities.service.ts`, mapear `isSaved: Boolean((p as any).saves?.length)` y en `PostCard` inicializar `useState(Boolean((post as any).isSaved))`.

---

### H-06: El backend no respeta el flag `isCommentsDisabled` al agregar comentarios
- **Severidad:** Media (Moderación / Integridad)
- **Archivos:**
  - `apps/api/src/posts/posts.service.ts` (líneas 563–593, `addComment`)
  - `apps/web/src/components/posts/CommentsPanel.tsx` (líneas 310–325)
- **Descripción:**  
  Aunque el esquema de Prisma y las opciones de publicación contemplan `isCommentsDisabled: boolean`, `PostsService.addComment` no consulta este campo en la base de datos antes de crear el comentario. Además, en `CommentsPanel.tsx`, si un usuario intenta comentar y la API responde con error, el bloque `catch { }` lo silencia sin mostrar feedback al usuario.
- **Impacto:**  
  Cualquier cliente API puede seguir enviando comentarios a publicaciones cerradas por el autor o moderador. En la interfaz web, el usuario no recibe ningún mensaje explicativo.
- **Recomendación para Codex:**  
  Validar `if (post.isCommentsDisabled) throw new ForbiddenException('Los comentarios están desactivados en esta publicación');` en `addComment`, e informar el error en `CommentsPanel.tsx`.

---

## 3. Hallazgos de Interfaz, Permisos y Temas (Claro / Oscuro)

### U-01: Moderadores ven pestaña de herramientas pero el contenido queda en blanco
- **Archivos:** `apps/web/src/pages/CommunityAdmin.tsx` (líneas 411 y 490)
- **Problema:**  
  La pestaña `"Acceso y contenido"` (`tools`) está en la lista general de navegación sin restricción de rol. Sin embargo, en el área principal se renderiza condicionalmente:
  ```tsx
  {activeTab === 'tools' && community.canManage && <CommunityStudioTools ... />}
  ```
  Para un usuario con rol `MODERATOR`, `canManage` es `false`. Al hacer clic en la pestaña, la pantalla principal queda completamente vacía.
- **Recomendación:**  
  Ocultar el botón `tools` si `!community.canManage`, o permitir a los moderadores ver las solicitudes e invitaciones según la política del rol.

---

### U-02: Botón "Rechazar" en `CommunityStudioTools` sin estilo de fondo ni contraste
- **Archivos:** `apps/web/src/components/CommunityStudioTools.tsx` (línea 70)
- **Problema:**  
  El botón de rechazo de solicitud utiliza:
  ```tsx
  className="min-h-11 rounded-xl border border-border px-4"
  ```
  No define `bg-` ni hover ni color de texto explícito. En tema oscuro, el botón se percibe plano y transparente sobre la tarjeta (`bg-card`), perdiendo jerarquía frente a *"Aprobar"* (`bg-primary`).
- **Recomendación:**  
  Usar clases consistentes con el sistema de diseño: `hover:bg-muted text-foreground transition-colors`.

---

### U-03: Eliminación de publicaciones en `CommunityDetail` sin confirmación previa
- **Archivos:** `apps/web/src/pages/CommunityDetail.tsx` (líneas 222–226)
- **Problema:**  
  El botón *"Eliminar"* ejecuta directamente `onDelete(post.id)` sin confirmación interactiva (`confirm()` o modal de confirmación), a diferencia del resto de la plataforma donde se solicita ratificación.
- **Recomendación:**  
  Agregar un paso de confirmación (`if (confirm('¿Eliminar publicación?')) ...` o modal).

---

### U-04: Expiración obligatoria forzada a 7 días en creación de invitaciones
- **Archivos:** `apps/web/src/components/CommunityStudioTools.tsx` (línea 40)
- **Problema:**  
  `body = { expiresInDays: Number(form.days || 7), ... }`  
  El placeholder de días no indica que se aplicará 7 por defecto. Si el creador desea un enlace permanente (sin vencimiento), el formulario fuerza 7 días.
- **Recomendación:**  
  Permitir valor vacío o checkbox "Sin vencimiento" para enviar `expiresInDays: null`.

---

### U-05: Pestaña "Planes" en `CommunityStudioTools` no se refresca tras crear/borrar
- **Archivos:** `apps/web/src/components/CommunityStudioTools.tsx` (líneas 26 y 33)
- **Problema:**  
  `tab === 'planes' ? community.plans || [] : await request(...)`  
  `community.plans` se lee desde las propiedades del componente. Cuando `act()` llama a `await load(); onRefresh();`, `community.plans` todavía conserva el array previo hasta que el componente padre complete su re-render asíncrono.
- **Recomendación:**  
  Consultar los planes directamente desde la API en `load()` o reflejar los cambios en el estado local de filas.

---

### U-06: Publicaciones de comunidades públicas bloqueadas para visitantes no autenticados
- **Archivos:** `apps/api/src/communities/community-permissions.service.ts` (línea 234)
- **Problema:**  
  `canAccessCommunity` devuelve `canView: false` si `!userId`. En consecuencia, al compartir un enlace `/posts/:id` de una comunidad pública con `showContentBeforeJoin: true`, un visitante anónimo recibe un 403 Forbidden directo en lugar de visualizar el post público con botón de registro.
- **Recomendación:**  
  Permitir `canView: true` cuando `community.status === 'PUBLISHED' && community.privacyType === 'PUBLIC' && community.showContentBeforeJoin`.

---

## 4. Matriz de Priorización para Codex

| ID | Área | Problema Clave | Severidad | Acción Requerida |
|---|---|---|---|---|
| **H-01** | Invitaciones | Falla `acceptInvite` en comunidades pagas | **Crítica** | Permitir ingreso con plan asociado o membresía directa de invitación |
| **H-02** | Privacidad | Salteo de solicitud en comunidades privadas vía pago | **Alta** | Validar solicitud aprobada en `createCheckoutSession` |
| **H-03** | Correo Oficial | No se adjunta imagen en avisos por email | **Media-Alta** | Pasar `imageUrl` a `renderCampaign` y a `ProEmailCampaign` |
| **H-04** | Guardados | Tarjetas rotas en `/posts/saved` para posts bloqueados | **Alta** | Formatear post bloqueado con metadatos seguros |
| **H-05** | Guardados | Estado de bookmark no se persiste en vista de comunidad | **Media** | Incluir `saves` en `listPosts` y leer `isSaved` en UI |
| **H-06** | Comentarios | Backend ignora `isCommentsDisabled` | **Media** | Rechazar comentarios en API si están deshabilitados |
| **U-01** | UI Creator | Pantalla en blanco para moderadores en tab tools | **Media** | Condicionar pestaña en sidebar a `community.canManage` |
| **U-02** | Tema Oscuro | Botón rechazar con bajo contraste | **Baja** | Añadir clases de fondo y hover accesibles |
| **U-03** | Moderación UI | Eliminación instantánea sin confirmación | **Media** | Incorporar diálogo de confirmación |
| **U-04** | Invitaciones UI | Se fuerza expiración a 7 días sin opción indefinida | **Baja** | Permitir `expiresInDays: null` desde la interfaz |

---

*Fin del informe de revisión independiente. Preparado para la etapa de resolución y validación por Codex.*
