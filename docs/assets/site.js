// SpeakNow website: language, theme, navigation, screenshots and the beta download.
// Everything degrades gracefully: without JavaScript the page is complete, in English.
(function () {
  'use strict';

  var I18N = window.SPEAKNOW_I18N || {};
  var LANGS = ['en', 'fr', 'mg'];
  var root = document.documentElement;
  var beta = null;

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch (e) { /* private mode or blocked storage: the choice just isn't remembered */ }
  }

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  // --- Language ------------------------------------------------------------------------

  function pickLanguage() {
    var fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(fromUrl) >= 0) return fromUrl;
    var saved = read('speaknow-lang');
    if (LANGS.indexOf(saved) >= 0) return saved;
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase().slice(0, 2);
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  var lang = pickLanguage();

  function t(key) {
    var dict = I18N[lang] || {};
    return dict[key] !== undefined ? dict[key] : (I18N.en || {})[key];
  }

  function applyLanguage() {
    root.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = t(key);
      if (value === undefined) return;
      if (/_html$/.test(key)) el.innerHTML = value; else el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var value = t(el.getAttribute('data-i18n-aria'));
      if (value) el.setAttribute('aria-label', value);
    });
    var isPolicy = document.body.classList.contains('page-doc');
    var title = t(isPolicy ? 'pp.doc.title' : 'doc.title');
    if (title) document.title = title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && !isPolicy && t('doc.description')) desc.setAttribute('content', t('doc.description'));
    document.querySelectorAll('.js-lang').forEach(function (s) { s.value = lang; });
    updateThemeButton();
    applyBeta();
  }

  document.querySelectorAll('.js-lang').forEach(function (select) {
    select.addEventListener('change', function () {
      lang = select.value;
      store('speaknow-lang', lang);
      applyLanguage();
    });
  });

  // --- Theme: auto (follows the phone) -> light -> dark -----------------------------------

  var THEMES = ['auto', 'light', 'dark'];

  function currentTheme() {
    var v = root.dataset.theme;
    return v === 'light' || v === 'dark' ? v : 'auto';
  }

  function updateThemeButton() {
    var theme = currentTheme();
    document.querySelectorAll('.js-theme').forEach(function (b) {
      b.dataset.mode = theme;
      b.setAttribute('aria-label', (t('theme.label') || 'Theme') + ': ' + (t('theme.' + theme) || theme));
      b.title = b.getAttribute('aria-label');
    });
  }

  document.querySelectorAll('.js-theme').forEach(function (button) {
    button.addEventListener('click', function () {
      var next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
      if (next === 'auto') {
        delete root.dataset.theme;
        store('speaknow-theme', null);
      } else {
        root.dataset.theme = next;
        store('speaknow-theme', next);
      }
      updateThemeButton();
    });
  });

  // --- Navigation: mobile menu, focus on the section reached, current section highlighted ---

  var menuButton = document.querySelector('.js-menu');
  var nav = document.getElementById('site-nav');

  function closeMenu() {
    if (!menuButton) return;
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  // In-page links: scroll there and move keyboard/screen-reader focus to the section title.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
      var heading = target.querySelector('h1[tabindex], h2[tabindex]');
      if (heading) heading.focus({ preventScroll: true });
    });
  });

  // Highlight the menu entry of the section on screen.
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var active = null;
      sections.forEach(function (s) { if (!active && visible[s.id]) active = s.id; });
      navLinks.forEach(function (a) {
        var on = active && a.getAttribute('href') === '#' + active;
        a.classList.toggle('active', !!on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }

  // --- Screenshot carousel ---------------------------------------------------------------

  var gallery = document.querySelector('.js-gallery');
  function slide(direction) {
    if (!gallery) return;
    var img = gallery.querySelector('img');
    var step = img ? img.getBoundingClientRect().width + 18 : 300;
    gallery.scrollBy({ left: direction * step * 2, behavior: 'smooth' });
  }
  var prev = document.querySelector('.js-prev');
  var next = document.querySelector('.js-next');
  if (prev) prev.addEventListener('click', function () { slide(-1); });
  if (next) next.addEventListener('click', function () { slide(1); });
  if (gallery) {
    gallery.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); slide(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); slide(-1); }
    });
  }

  // --- Beta download (beta.json is written each time a beta is published) ------------------

  function formatDate(iso) {
    try {
      var locale = lang === 'mg' ? 'fr' : lang;
      return new Date(iso + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function applyBeta() {
    var buttons = document.querySelectorAll('.js-download');
    var labels = document.querySelectorAll('.js-download-label');
    if (!document.querySelector('.js-download-label')) return;
    if (!beta || !beta.available || !beta.url) {
      labels.forEach(function (l) { l.textContent = t('dl.soon'); });
      buttons.forEach(function (b) {
        if (!b.classList.contains('nav-download')) b.setAttribute('aria-disabled', 'true');
      });
      return;
    }
    labels.forEach(function (l) { l.textContent = t('hero.download'); });
    buttons.forEach(function (b) {
      b.href = beta.url;
      b.removeAttribute('aria-disabled');
    });
    var parts = [t('meta.version') + ' ' + beta.version];
    if (beta.date) parts.push(formatDate(beta.date));
    if (beta.sizeMb) parts.push(beta.sizeMb + ' MB');
    parts.push(t('meta.android'));
    document.querySelectorAll('.js-meta').forEach(function (m) { m.textContent = parts.join(' · '); });
    var notes = document.querySelector('.js-notes');
    var list = document.querySelector('.js-notes-list');
    if (notes && list && beta.notes && beta.notes.length) {
      list.textContent = '';
      beta.notes.forEach(function (n) {
        var li = document.createElement('li');
        li.textContent = n;
        list.appendChild(li);
      });
      notes.hidden = false;
    }
  }

  applyLanguage();
  if (document.querySelector('.js-download-label')) {
    fetch('beta.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { beta = data; applyBeta(); })
      .catch(function () { beta = null; applyBeta(); });
  }
})();
