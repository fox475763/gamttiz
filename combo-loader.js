const target = document.querySelector('#tray');
const status = document.querySelector('#holder-viewer-status');
if (status) status.textContent = '홀더에 가까이 가면 3D 화면을 준비해요.';

let started = false;
function start3d() {
  if (started) return;
  started = true;
  if (status) status.textContent = '3D 홀더를 불러오는 중이에요.';
  import('./combo-3d.js').catch(error => {
    console.error(error);
    if (status) status.textContent = '3D 화면을 불러오지 못했어요. 이미지 화면으로 조합을 볼 수 있어요.';
  });
}

if (!target || !('IntersectionObserver' in window)) start3d();
else {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      start3d();
    }
  }, {rootMargin: '600px 0px'});
  observer.observe(target);
}
