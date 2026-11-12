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
        var ps = getComputedStyle(a.parentNode);   // right-aligned button column (wide screens): align the badge right too
        if (ps.flexDirection === 'column' && /end/.test(ps.alignItems)) box.classList.add('end');
      });
    });
  }
  var css = document.createElement('style');
  css.textContent = '.dealtag{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%}.dealtag.end{align-items:flex-end}' +
    '.dealtag b{width:fit-content;display:inline-block;font-size:13px;font-weight:700;letter-spacing:.02em;padding:4px 10px;border-radius:999px;background:#F4C542;color:#1E1F21}' +
    '.dealtag small{font-size:12px;color:var(--fg-2,#666)}';
  document.head.appendChild(css);
  fetch('deals.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : [] })
    .then(function (j) { deals = Array.isArray(j) ? j : (j.deals || []); drawDeals(); setInterval(drawDeals, 60000) })
    .catch(function () {});

  /* ---- sign-up ----
     Every form[data-kit-signup] on the page works the same way. data-place on the form ("mid", "bottom", "back")
     says where it sits; it goes to MailerLite as signup_source "<source>-<place>" (e.g. "instagram-mid", or
     "picks-mid" with no ?src=) and to GoatCounter as "signup-<place>", so we can see which spot gets sign-ups.

     Welcome-back bar (data-bar on the <script> tag holds its line, data-bar-btn its button text):
     a slim bar at the bottom of the screen, shown only when someone clicked an Amazon button and then came back
     to this tab. It shows at most once per browser, never before a click, and never again after a close or a
     sign-up. Nothing is stored except two on/off flags in this browser (no personal data). */
  var LS = { get: function (k) { try { return localStorage.getItem(k) } catch (e) { return null } },
             set: function (k) { try { localStorage.setItem(k, '1') } catch (e) {} } };
  function wire(f) {
    var place = f.getAttribute('data-place') || 'bottom';
    var srcField = f.querySelector('input[name="fields[signup_source]"]');
    if (srcField) srcField.value = (src || 'picks') + '-' + place;
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
          LS.set('kit-signed');
          count('signup-' + place, 'Email sign-up (' + place + ')');
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'That didn’t go through. Please try again in a minute.' });
    });
  }
  var forms = document.querySelectorAll('form[data-kit-signup]');
  forms.forEach(wire);

  var barLine = cfg.bar, first = forms[0], left = false, shown = false;
  if (barLine && first) {
    var bcss = document.createElement('style');
    bcss.textContent =
      '.kbar{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--kbar-bg,#24272B);color:var(--kbar-fg,#EEE9E1);' +
      'padding:8px 16px calc(8px + env(safe-area-inset-bottom));box-shadow:0 -6px 24px rgba(0,0,0,.18);transform:translateY(110%);transition:transform .35s ease}' +
      '.kbar.on{transform:none}@media (prefers-reduced-motion:reduce){.kbar{transition:none}}' +
      '.kbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 12px}' +
      '.kbar .kl{flex:0 1 auto;font-weight:600;font-size:15px;line-height:1.25;margin:0}' +
      '@media (max-width:640px){.kbar:not(.open){flex-wrap:nowrap;justify-content:space-between}.kbar .kl{font-size:14px;flex:1 1 auto}.kbar .ko button{padding:0 10px}.kbar .kx{padding:0 4px}}' +
      '.kbar .ko,.kbar .kr{display:flex;gap:6px;align-items:center}.kbar .kr{display:none;flex:1 1 100%;max-width:560px}' +
      '.kbar.open .ko{display:none}.kbar.open .kr{display:flex}' +
      '.kbar input[type=email]{flex:1;min-width:0;min-height:44px;border:0;border-radius:6px;padding:0 12px;font:inherit;font-size:16px;background:#fff;color:#1E1F21}' +
      '.kbar button{min-height:44px;border:1.5px solid currentColor;border-radius:6px;padding:0 14px;font:600 15px/1 inherit;font-family:inherit;cursor:pointer;background:transparent;color:inherit;white-space:nowrap}' +
      '.kbar .kgo,.kbar button[type=submit]{background:var(--kbar-btn,#EEE9E1);color:var(--kbar-btn-fg,#24272B);border-color:transparent}' +
      '.kbar .kx{border-color:transparent;text-decoration:underline;padding:0 8px;font-weight:500}' +
      '.kbar button:focus-visible,.kbar input:focus-visible{outline:3px solid var(--kbar-btn,#EEE9E1);outline-offset:2px}' +
      '.kbar .su-msg{flex-basis:100%;text-align:center;margin:0;font-size:14px}.kbar .su-msg:empty{display:none}' +
      '.kbar .su-small{display:none;flex-basis:100%;text-align:center;margin:0;font-size:12px;opacity:.85}.kbar.open .su-small{display:block}' +
      '.kbar .su-small a{color:inherit}.kbar.su-done .kr{display:none}' +
      '.kbar .vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
      'body.kbar-pad{padding-bottom:var(--kbar-h,0px)}';
    document.head.appendChild(bcss);
    var showBar = function () {
      if (shown || LS.get('kit-bar') || LS.get('kit-signed')) return;
      shown = true; LS.set('kit-bar');
      var priv = (first.querySelector('.su-small a') || {}).href || '';
      var bar = document.createElement('form');
      bar.className = 'kbar'; bar.action = first.action; bar.method = 'post'; bar.setAttribute('data-place', 'back');
      bar.setAttribute('aria-label', 'Email sign-up'); bar.noValidate = true;
      // Starts slim (one line + two buttons, under 64 px on phones); "Email me" opens the email box.
      bar.innerHTML = '<p class="kl"></p><div class="ko"><button type="button" class="kgo"></button><button type="button" class="kx">No thanks</button></div>' +
        '<div class="kr"><label class="vh" for="kbar-email">Your email</label>' +
        '<input id="kbar-email" type="email" name="fields[email]" autocomplete="email" required placeholder="name@example.com">' +
        '<button type="submit">Sign up</button><button type="button" class="kx">No thanks</button></div>' +
        '<input type="hidden" name="fields[signup_source]" value=""><input type="hidden" name="ml-submit" value="1"><input type="hidden" name="anticsrf" value="true">' +
        '<p class="su-msg" role="status" aria-live="polite"></p>' +
        '<p class="su-small">We send one email first so you can confirm. Unsubscribe any time.' + (priv ? ' <a>Privacy notice</a>.' : '') + '</p>';
      bar.querySelector('.kl').textContent = barLine;
      bar.querySelector('.kgo').textContent = cfg.barBtn || 'Email me';
      if (priv) bar.querySelector('.su-small a').href = priv;
      document.body.appendChild(bar);
      wire(bar);
      var pad = function () { document.body.style.setProperty('--kbar-h', bar.offsetHeight + 'px') };
      bar.querySelector('.kgo').addEventListener('click', function () {
        bar.classList.add('open'); pad(); bar.querySelector('input[type=email]').focus();
      });
      bar.querySelectorAll('.kx').forEach(function (x) { x.addEventListener('click', function () {
        bar.classList.remove('on'); document.body.classList.remove('kbar-pad');
        setTimeout(function () { bar.remove() }, 400);
      }) });
      requestAnimationFrame(function () { bar.classList.add('on'); pad(); document.body.classList.add('kbar-pad') });
      count('signup-bar-shown', 'Welcome-back bar shown');
    };
    var markOut = function (e) { if (e.target.closest && e.target.closest('a[href*="amazon.com"]')) left = true };
    document.addEventListener('click', markOut);
    document.addEventListener('auxclick', markOut);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && left) setTimeout(showBar, 800);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted && left) setTimeout(showBar, 800) });
  }
})();
