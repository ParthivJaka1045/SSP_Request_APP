let lockedScrollY = 0;
let lockCount = 0;

export function lockBodyScroll() {
  if (lockCount === 0) {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('body-scroll-locked');
    document.body.classList.add('body-scroll-locked');
    document.body.style.top = `-${lockedScrollY}px`;
  }
  lockCount += 1;
}

export function unlockBodyScroll() {
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.documentElement.classList.remove('body-scroll-locked');
    document.body.classList.remove('body-scroll-locked');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }
}
