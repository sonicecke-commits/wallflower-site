/* Picks page kit: email sign-up + cookie-free counting. The same file runs on all three picks sites.
   Settings come from the <script> tag:
     data-gc       GoatCounter code (counts at https://<code>.goatcounter.com)
   The sign-up form is plain HTML in the page (form[data-kit-signup]); its action is the brand's MailerLite form.

   What is counted (GoatCounter, no cookies, no personal data kept):
     - a visit to this page, with ?src= (or utm_source) as the source, e.g. ?src=instagram
     - "out/<ASIN>"  : a click on a "See it on Amazon" button (same source attached)
     - "signup"      : a sign-up sent to MailerLite (same source attached)
   We never load, fetch or read anything from Amazon; we only note that a button was clicked. */
(function () {
  var me = document.currentScript, cfg = (me && me.dataset) || {};
  var q = new URLSearchParams(location.search);
  var src = (q.get('src') || q.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);

  /* ---- counting ---- */
  window.goatcounter = {
    path: function () { return location.pathname },            // one row per page, not one per ?src=
    referrer: function (r) { return src || r }                  // the bio-link source wins over the browser referrer
  };
  if (cfg.gc) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.v4.js';
    s.integrity = 'sha384-nRw6qfbWyJha9LhsOtSb2YJDyZdKvvCFh0fJYlkquSFjUxp9FVNugbfy8q1jdxI+';
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-goatcounter', 'https://' + cfg.gc + '.goatcounter.com/count');
    document.head.appendChild(s);
  }
  function count(path, title) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title, event: true }) } catch (e) {}
  }

  function onOut(e) {
    var a = e.target.closest && e.target.closest('a[href*="amazon.com"]');
    if (!a) return;
    var m = a.href.match(/\/dp\/([A-Z0-9]{10})/i), card = a.closest('.pick, article, li');
    var h = card && card.querySelector('h3');
    count('out/' + (m ? m[1].toUpperCase() : 'other'), 'Amazon click: ' + (h ? h.textContent.trim() : (m ? m[1] : 'link')));
  }
  document.addEventListener('click', onOut);
  document.addEventListener('auxclick', function (e) { if (e.button === 1) onOut(e) });   // middle-click, new tab

  /* ---- sign-up ---- */
  document.querySelectorAll('form[data-kit-signup]').forEach(function (f) {
    var srcField = f.querySelector('input[name="fields[signup_source]"]');
    if (srcField) srcField.value = src || 'picks-page';
    var msg = f.querySelector('.su-msg'), btn = f.querySelector('button[type=submit]'), email = f.querySelector('input[type=email]');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!email.value || !email.checkValidity()) { msg.textContent = 'Please enter a full email address, like name@example.com.'; email.focus(); return }
      btn.disabled = true; msg.textContent = 'Sending…';
      fetch(f.action, { method: 'POST', body: new URLSearchParams(new FormData(f)) })
        .then(function (r) { return r.json() })
        .then(function (d) {
          if (!d || !d.success) throw new Error('not ok');
          f.classList.add('su-done');
          msg.textContent = 'Nearly done: check your inbox and tap the link in our email to confirm.';
          count('signup', 'Email sign-up');
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'That didn’t go through. Please try again in a minute.' });
    });
  });
})();
