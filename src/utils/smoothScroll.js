import Lenis from 'lenis';

let lenisInstance = null;

export const initializeLenisScroll = () => {
  if (lenisInstance) {
    lenisInstance.destroy();
  }

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  let requestId;

  const raf = (time) => {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  };

  requestId = requestAnimationFrame(raf);

  return () => {
    cancelAnimationFrame(requestId);
    if (lenisInstance) {
      lenisInstance.destroy();
      lenisInstance = null;
    }
  };
};

export const scrollToElement = (element, offset = 0) => {
  if (!lenisInstance || !element) return;

  lenisInstance.scrollTo(element, {
    offset: offset,
    duration: 1.5,
  });
};

export const scrollToTop = () => {
  if (!lenisInstance) return;
  lenisInstance.scrollTo(0, { duration: 1.5 });
};

export const getLenisInstance = () => lenisInstance;

export const destroyLenisScroll = () => {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
};
