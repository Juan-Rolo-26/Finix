import{c as s}from"./index-DuYoMYW6.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=s("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]),o=new Set(["localhost","127.0.0.1","0.0.0.0"]);function i(){return typeof window<"u"?window.location.origin:""}function d(n){if(typeof n!="string")return"";const t=n.trim();if(!t)return"";if(/^(blob:|data:)/i.test(t))return t;const r=i();if(/^https?:\/\//i.test(t)){try{const e=new URL(t);if(e.pathname.startsWith("/uploads/")&&o.has(e.hostname.toLowerCase()))return`${r.replace(/\/$/,"")}${e.pathname}${e.search}${e.hash}`}catch{return t}return t}const a=t.startsWith("/")?t:`/${t}`;return a.startsWith("/uploads/")?r?`${r.replace(/\/$/,"")}${a}`:a:t}export{h as I,d as r};
