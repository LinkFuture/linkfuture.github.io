/* ===== UniBucket Landing Page Scripts ===== */

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Navbar scroll effect ----------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  // ---------- Screenshot carousel ----------
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  let currentSlide = 0;
  let autoplayTimer;

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
  }

  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.index, 10));
      resetAutoplay();
    });
  });

  if (slides.length > 1) {
    startAutoplay();
  }

  // ---------- Scroll-triggered reveal animations ----------
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Auto-resolve latest release download URLs ----------
  initDownloadButtons();
});

/**
 * Automatically fetch the latest release assets from GitHub and bind direct download
 * links to Windows, macOS, and Linux download buttons.
 */
function initDownloadButtons() {
  const winBtn = document.getElementById('download-win');
  const macBtn = document.getElementById('download-mac');
  const linuxBtn = document.getElementById('download-linux');

  // If download buttons are not present on this page, exit early
  if (!winBtn && !macBtn && !linuxBtn) return;

  const RELEASES_API = 'https://api.github.com/repos/LinkFuture/UniBucket-Releases/releases/latest';

  fetch(RELEASES_API)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(release => {
      const assets = release.assets || [];
      if (!assets.length) return;

      // Helper to find asset by pattern
      const findAssetUrl = (predicate) => {
        const item = assets.find(predicate);
        return item ? item.browser_download_url : null;
      };

      // Windows: prefer x64 install.exe
      const winUrl =
        findAssetUrl(a => a.name.includes('win-x64') && a.name.endsWith('-install.exe')) ||
        findAssetUrl(a => a.name.includes('win') && a.name.endsWith('-install.exe')) ||
        findAssetUrl(a => a.name.includes('win') && a.name.endsWith('.exe') && !a.name.endsWith('.blockmap'));

      // macOS: detect user's client platform if possible, default to arm64 or x64 dmg
      const isIntelMac = navigator.userAgent && navigator.userAgent.includes('Intel Mac');
      const macArmUrl = findAssetUrl(a => a.name.includes('mac-arm64') && a.name.endsWith('.dmg'));
      const macX64Url = findAssetUrl(a => a.name.includes('mac-x64') && a.name.endsWith('.dmg'));
      const macUrl = isIntelMac ? (macX64Url || macArmUrl) : (macArmUrl || macX64Url);

      // Linux: prefer AppImage, fallback to deb
      const linuxUrl =
        findAssetUrl(a => a.name.endsWith('.AppImage')) ||
        findAssetUrl(a => a.name.endsWith('.deb'));

      if (winBtn && winUrl) winBtn.href = winUrl;
      if (macBtn && macUrl) macBtn.href = macUrl;
      if (linuxBtn && linuxUrl) linuxBtn.href = linuxUrl;
    })
    .catch(err => {
      // Gracefully fall back to the release page link already in href
      console.warn('Could not auto-resolve direct download links from latest release:', err);
    });
}
