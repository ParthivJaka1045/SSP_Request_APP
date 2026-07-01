import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Smooth entrance animations
export const animateElementIn = (element, delay = 0) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      delay,
      ease: 'cubic.out',
    }
  );
};

// Staggered entrance for multiple elements
export const animateStagger = (elements, staggerDelay = 0.08) => {
  if (!elements || elements.length === 0) return;
  
  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 40,
      scale: 0.9,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: staggerDelay,
      ease: 'back.out',
    }
  );
};

// Hover lift effect with GSAP
export const animateHoverLift = (element) => {
  if (!element) return;

  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      y: -8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      y: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      duration: 0.3,
      ease: 'power2.out',
    });
  });
};

// Scroll-triggered animations
export const setupScrollAnimations = () => {
  const cards = document.querySelectorAll('[data-scroll-animate]');
  
  cards.forEach((card) => {
    gsap.fromTo(
      card,
      {
        opacity: 0,
        y: 50,
        scale: 0.9,
      },
      {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
          markers: false,
        },
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
      }
    );
  });
};

// Floating animation (for decorative elements)
export const setupFloatingAnimation = (element, distance = 20, duration = 3) => {
  if (!element) return;

  gsap.to(element, {
    y: -distance,
    duration: duration / 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

// Pulse animation
export const setupPulseAnimation = (element, scale = 1.05) => {
  if (!element) return;

  gsap.to(element, {
    scale: scale,
    duration: 0.6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

// Text reveal animation
export const animateTextReveal = (element, stagger = 0.05) => {
  if (!element) return;

  const text = element.textContent;
  element.innerHTML = text
    .split('')
    .map((char) => `<span class="text-char">${char}</span>`)
    .join('');

  const chars = element.querySelectorAll('.text-char');

  gsap.fromTo(
    chars,
    {
      opacity: 0,
      y: 20,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: stagger,
      ease: 'back.out',
    }
  );
};

// Counter animation (for numbers)
export const animateCounter = (element, target, duration = 2) => {
  if (!element) return;

  const obj = { value: 0 };

  gsap.to(obj, {
    value: target,
    duration,
    ease: 'power1.inOut',
    onUpdate: function () {
      element.textContent = Math.round(obj.value).toLocaleString();
    },
  });
};

// Rotate animation (for spinners, icons)
export const setupRotateAnimation = (element, duration = 2) => {
  if (!element) return;

  gsap.to(element, {
    rotation: 360,
    duration,
    repeat: -1,
    ease: 'linear',
  });
};

// Flip card animation
export const flipCard = (element) => {
  if (!element) return;

  gsap.to(element, {
    rotationY: 180,
    duration: 0.6,
    ease: 'back.out',
  });
};

// Bounce animation
export const animateBounce = (element, times = 1) => {
  if (!element) return;

  gsap.fromTo(
    element,
    { y: 0 },
    {
      y: -30,
      duration: 0.3,
      repeat: times * 2 - 1,
      yoyo: true,
      ease: 'power1.inOut',
    }
  );
};

// Setup page entrance animation
export const setupPageEntrance = () => {
  gsap.from('.page-shell', {
    opacity: 0,
    y: 50,
    duration: 0.8,
    ease: 'power3.out',
  });
};

// Kill all animations
export const killAnimations = () => {
  gsap.killTweensOf('*');
};
