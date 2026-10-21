const p = {
  house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1z"/>',
  message:'<path d="M21 11.4a8.6 8.6 0 0 1-8.9 8.4 10 10 0 0 1-4-.8L3 21l1.5-4.3A8.6 8.6 0 1 1 21 11.4Z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  heart:'<path d="M20.7 5.5c-1.8-2-4.9-2-6.8-.1L12 7.3l-1.9-1.9c-1.9-1.9-5-1.9-6.8.1a5.1 5.1 0 0 0 0 7.2L12 21l8.7-8.3a5.1 5.1 0 0 0 0-7.2Z"/>',
  heartfill:'<path d="M20.7 5.5c-1.8-2-4.9-2-6.8-.1L12 7.3l-1.9-1.9c-1.9-1.9-5-1.9-6.8.1a5.1 5.1 0 0 0 0 7.2L12 21l8.7-8.3a5.1 5.1 0 0 0 0-7.2Z" fill="currentColor"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  send:'<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
  arrow:'<path d="m15 18-6-6 6-6"/>',
  video:'<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  play:'<path d="m8 5 11 7-11 7z" fill="currentColor"/>',
  comment:'<path d="M21 11.4a8.6 8.6 0 0 1-8.9 8.4 10 10 0 0 1-4-.8L3 21l1.5-4.3A8.6 8.6 0 1 1 21 11.4Z"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  close:'<path d="M5 5 19 19M19 5 5 19"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2-.5 2.1-2.1.9-1.9-1.1-2.1 2.1 1.1 1.9-.9 2.1L2 10v4l2.1.5.9 2.1-1.1 1.9 2.1 2.1 1.9-1.1 2.1.9L10 22h4l.5-2.1 2.1-.9 1.9 1.1 2.1-2.1-1.1-1.9.9-2.1L22 14v-4l-2.1-.5-.9-2.1 1.1-1.9-2.1-2.1-1.9 1.1-2.1-.9L14 2z"/>',
  logout:'<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 7l5 5-5 5M19 12H9"/>',
  shield:'<path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 6-5 12 0 18M12 3c5 6 5 12 0 18"/>',
  edit:'<path d="m4 20 4-.8L20 7a2.1 2.1 0 0 0-3-3L5 16z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  spark:'<path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>',
  link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.6 1.6M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.6-1.6"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  volume:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9a5 5 0 0 1 0 6"/>'
};
export function icon(name, size=20){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name] || p.spark}</svg>`;}
export function escapeHTML(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function initials(v='瑞友'){return [...(v||'瑞友')].slice(0,2).join('');}
export function avatar(user,size='normal'){const name=user?.nickname || user?.name || '瑞友'; const safe=escapeHTML(name);const img=user?.avatar_url;const hue=([...name].reduce((a,c)=>a+c.codePointAt(0),0)%220)+130; return `<span class="avatar avatar-${size}" style="--h:${hue}" title="${safe}">${img ? `<img src="${escapeHTML(img)}" alt="${safe}" loading="lazy"/>` : escapeHTML(initials(name))}</span>`;}
export function age(iso){if(!iso)return '刚刚';const ms=Date.now()-new Date(iso).getTime();if(ms<60000)return '刚刚';if(ms<3600000)return `${Math.floor(ms/60000)}分钟前`;if(ms<86400000)return `${Math.floor(ms/3600000)}小时前`;if(ms<86400000*7)return `${Math.floor(ms/86400000)}天前`;return new Date(iso).toLocaleDateString('zh-CN',{month:'short',day:'numeric'});}
