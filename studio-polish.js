/* Small, optional enhancements. All content remains usable without JavaScript. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  let scrollQueued = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll(
    '.story-row, .section-heading, .guide-grid article, .project-top, ' +
    '.project-facts, .project-ideas article, .project-system, .project-subhead, ' +
    '.hub-grid a, .experience-intro h1, .experience-links a, ' +
    '.catalog-hero-copy, .catalog-hero-image, .catalog-section-heading, ' +
    '.studio-photo-grid figure, .package-photo-grid figure, .catalog-card, ' +
    '.catalog-holder-image, .catalog-holder-copy, .news-hero h1, ' +
    '.news-list-head, .news-card, .news-empty, .news-detail'
  );
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      entry.target.animate([
        { opacity: .66, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 620, easing: 'cubic-bezier(.2,.75,.25,1)' });
    }
  }, { threshold: .09 });
  targets.forEach((target) => observer.observe(target));
})();

