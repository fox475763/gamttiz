/* Animate clear glass only while its surface intersects the viewport.
   The floating menu is intentionally not included. */
(()=>{
  'use strict';
  const selector=".play-page .play-hub .hub-grid>a,.play-page .hub-grid .hub-action-icon,.dex-page .dex-glass,.dex-page .dex-search,.dex-page .dex-sort,.dex-page .dex-filters button,.dex-page .dex-dial-controls button,.dex-page .dex-modal-head .dex-arrow,.dex-page .dex-modal-head .dex-close,.dex-page #dex-profile .profile-face-inset,.dex-page #dex-profile .profile-type,.dex-page #dex-profile .profile-secret,.dex-page #dex-profile .profile-episode,.dex-page #dex-profile .profile-traits span,.daily-page .draw-machine,.daily-page .draw-machine-top span:last-child,.daily-page .draw-control .draw-replay,.member-page .member-main .member-id-chip,.member-page .member-main .member-tile,.member-page .member-main .member-note,.member-page .member-main .member-back span,.member-page .member-main .member-surface,.member-page .member-main .member-lock-mark,.member-page .member-main .member-tile-link,.member-page .member-main .member-btn:not(.primary),.member-page .member-main .member-locked,.member-page .radar-tool .radar-glass-field,.member-page .radar-tool .radar-view-tabs button,.member-page .radar-tool .radar-action,.member-page .radar-tool .radar-deal-panel,.license-page.has-license:not(.license-wallet-view) .license-member-link,.license-page:not(.has-license):not(.license-wallet-view) .license-profile-picker .license-friend,.license-page:not(.has-license):not(.license-wallet-view) .license-profile-picker .license-friend:has(input:checked),.license-page:not(.has-license):not(.license-wallet-view) .license-profile-picker .license-friend.is-profile-current:has(input:checked),.license-page .license-profile-controls .license-profile-arrow";
  const marked=new WeakSet();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('gtz-liquid-visible',entry.isIntersecting));
  },{threshold:0.01}):null;
  function add(el){
    if(marked.has(el))return;
    marked.add(el);
    if(observer)observer.observe(el);else if(!reduced.matches)el.classList.add('gtz-liquid-visible');
  }
  function scan(root){
    if(root.nodeType===1&&root.matches(selector))add(root);
    root.querySelectorAll?.(selector).forEach(add);
  }
  function remove(el){
    if(!marked.has(el))return;
    marked.delete(el);observer?.unobserve(el);el.classList.remove('gtz-liquid-visible');
  }
  function unscan(root){
    if(root.nodeType===1&&marked.has(root))remove(root);
    root.querySelectorAll?.(selector).forEach(remove);
  }
  scan(document);
  if('MutationObserver' in window)new MutationObserver(changes=>{
    for(const change of changes)for(const node of change.removedNodes||[])if(!node.isConnected)unscan(node);
    for(const change of changes)for(const node of change.addedNodes)scan(node);
  }).observe(document.body,{childList:true,subtree:true});
})();
