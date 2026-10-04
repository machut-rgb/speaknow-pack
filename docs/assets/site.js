// Fills the download buttons from beta.json (written when a beta is published) and
// hides screenshots that have not been added yet. The page still works without it.
(function () {
  'use strict';

  function hideMissingScreenshots() {
    var gallery = document.querySelector('.js-gallery');
    var shown = 0;
    document.querySelectorAll('.js-shot').forEach(function (img) {
      function missing() {
        if (img.dataset.fallback === 'hero') {
          img.closest('.phone').classList.add('no-shot');
        } else {
          img.remove();
        }
      }
      function found() {
        if (img.dataset.fallback !== 'hero') {
          shown++;
          if (gallery) gallery.hidden = false;
        }
      }
      if (img.complete) {
        if (img.naturalWidth > 0) found(); else missing();
      } else {
        img.addEventListener('load', found);
        img.addEventListener('error', missing);
      }
    });
  }

  function formatDate(iso) {
    try {
      return new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function applyBeta(beta) {
    var buttons = document.querySelectorAll('.js-download');
    var labels = document.querySelectorAll('.js-download-label');
    if (!beta || !beta.available || !beta.url) {
      labels.forEach(function (l) { l.textContent = 'Beta coming soon'; });
      buttons.forEach(function (b) {
        if (b.id === 'download-main' || b.closest('.download-box')) b.setAttribute('aria-disabled', 'true');
      });
      return;
    }
    buttons.forEach(function (b) {
      b.href = beta.url;
      b.removeAttribute('aria-disabled');
    });
    var parts = ['Version ' + beta.version];
    if (beta.date) parts.push(formatDate(beta.date));
    if (beta.sizeMb) parts.push(beta.sizeMb + ' MB');
    parts.push('Android 12 or newer');
    document.querySelectorAll('.js-meta').forEach(function (m) { m.textContent = parts.join(' · '); });
    if (beta.notes && beta.notes.length) {
      var list = document.querySelector('.js-notes-list');
      beta.notes.forEach(function (n) {
        var li = document.createElement('li');
        li.textContent = n;
        list.appendChild(li);
      });
      document.querySelector('.js-notes').hidden = false;
    }
  }

  hideMissingScreenshots();
  fetch('beta.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(applyBeta)
    .catch(function () { applyBeta(null); });
})();
