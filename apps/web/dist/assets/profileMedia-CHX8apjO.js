import{d as i,c as t}from"./index-DtuiUFLv.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=i("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=i("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]),c=["image/jpeg","image/png","image/webp","image/gif"],s=5*1024*1024;function p(e){if(!c.includes(e.type))throw new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF");if(e.size>s)throw new Error("La imagen no puede superar 5 MB")}async function l(e,r){p(r);const n=new FormData;n.append(e,r);const a=await t(`/me/${e}`,{method:"POST",body:n});if(!a.ok){const o=await a.json().catch(()=>({}));throw new Error((o==null?void 0:o.message)||"No se pudo subir la imagen")}return a.json()}export{g as G,u as M,l as u};
