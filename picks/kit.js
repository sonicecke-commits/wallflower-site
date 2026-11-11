/* Picks page kit: email sign-up + cookie-free counting. The same file runs on all three picks sites.
   Settings come from the <script> tag:
     data-gc       GoatCounter code (counts at https://<code>.goatcounter.com)
   The sign-up form is plain HTML in the page (form[data-kit-signup]); its action is the brand's MailerLite form.

   What is counted (GoatCounter, no cookies, no personal data kept):
     - a visit to this page, with ?src= (or utm_source) as the source, e.g. ?src=instagram
     - "out/<ASIN>"  : a click on a "Check today's price" (Amazon) button (same source attached)
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

  /* ---- deal badges ----
     deals.json (next to this file) lists deals Sam saw on Amazon in his weekly check. We never fetch from Amazon.
     Each entry: { "asin": "B0CJR3QCL5", "type": "deal" | "prime", "checked": "2026-11-15T16:00:00-07:00", "ends": "2026-11-16T23:59:00-08:00" }
     Amazon rules: no price or % here, and the mention must disappear when the deal ends. So each badge hides itself at
     "ends"; with no "ends" it hides 3 days after "checked"; and never lasts more than 8 days after "checked". */
  var DAY = 864e5, deals = [];
  function fmt(d, wd) { return d.toLocaleDateString('en-US', wd ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' }) }
  function drawDeals() {
    var now = Date.now();
    document.querySelectorAll('.dealtag').forEach(function (el) { el.remove() });
    deals.forEach(function (d) {
      var checked = new Date(d.checked), ends = d.ends ? new Date(d.ends) : null;
      if (!d.asin || isNaN(checked)) return;
      var stop = Math.min(ends && !isNaN(ends) ? ends.getTime() : checked.getTime() + 3 * DAY, checked.getTime() + 8 * DAY);
      if (now < checked.getTime() || now >= stop) return;
      document.querySelectorAll('a[href*="/dp/' + d.asin + '"]').forEach(function (a) {
        var box = document.createElement('span');
        box.className = 'dealtag';
        var head = (d.type === 'prime' ? 'On sale at Amazon for Prime members' : 'On sale at Amazon');
        // No end date on the badge: no Amazon clause covers hand-copied promotion dates, so it only drives the auto-hide.
        box.innerHTML = '<b></b><small></small>';
        box.firstChild.textContent = head;
        box.lastChild.textContent = 'Checked ' + fmt(checked) + '. Sales can end early.';
        a.parentNode.insertBefore(box, a);
      });
    });
  }
  var css = document.createElement('style');
  css.textContent = '.dealtag{display:flex;flex-direction:column;gap:2px;max-width:260px;text-align:inherit}' +
    '.dealtag b{align-self:inherit;display:inline-block;font-size:13px;font-weight:700;letter-spacing:.02em;padding:4px 10px;border-radius:999px;background:#F4C542;color:#1E1F21}' +
    '.dealtag small{font-size:12px;color:var(--fg-2,#666)}';
  document.head.appendChild(css);
  fetch('deals.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : [] })
    .then(function (j) { deals = Array.isArray(j) ? j : (j.deals || []); drawDeals(); setInterval(drawDeals, 60000) })
    .catch(function () {});

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
