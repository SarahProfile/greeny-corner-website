import { useEffect } from 'react';

/**
 * Reveals [data-reveal] / [data-reveal-scale] elements as they scroll into view
 * (adds `.is-visible`, see globals.css) and counts up any [data-count] number
 * from 0 to its target once visible. Runs once per mount, scoped to containerRef.
 *
 * Content is visible by default in CSS — this hook only opts elements into the
 * hidden/animate-in state (via `.reveal-ready` on the container) once it's
 * actually running, and force-reveals everything after a timeout no matter
 * what. That way a failed/late observer degrades to "no animation", never to
 * a permanently blank page.
 */
export function useScrollReveal(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = root.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-scale]');
    const countEls = root.querySelectorAll<HTMLElement>('[data-count]');

    if (reduced) {
      countEls.forEach((el) => {
        const target = parseFloat(el.getAttribute('data-count') || '0');
        if (!Number.isNaN(target)) el.textContent = target.toFixed(1);
      });
      return;
    }

    root.classList.add('reveal-ready');

    const animateCount = (el: HTMLElement) => {
      const target = parseFloat(el.getAttribute('data-count') || '0');
      if (Number.isNaN(target)) return;
      const duration = 1100;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(1);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const reveal = (el: HTMLElement) => {
      if (el.classList.contains('is-visible')) return;
      el.classList.add('is-visible');
      if (el.hasAttribute('data-count')) animateCount(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el) => io.observe(el));
    countEls.forEach((el) => io.observe(el));

    // Safety net: never leave content stuck invisible if the observer misses
    // an element (or fails entirely) for any reason.
    const fallback = window.setTimeout(() => {
      revealEls.forEach((el) => reveal(el));
      countEls.forEach((el) => reveal(el));
    }, 2000);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [containerRef]);
}
