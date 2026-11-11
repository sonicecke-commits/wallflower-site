# Wallflower: bike storage picks site

Static site for GitHub Pages (Settings > Pages > Deploy from branch `main`, folder `/`).

- `index.html` forwards to `picks/` and keeps `?src=`. The old waitlist page is in git history.
- `picks/index.html` is the picks page (paid links, budget / mid-range / premium, no prices).
- `picks/kit.js` (same file on all three picks sites) runs the email sign-up and the cookie-free counting:
  - Sign-up posts straight to MailerLite account 2783388 (Wallflower's own account), form 203724961674691697 ("Wallflower site"), double opt-in, with `signup_source` = the `?src=` value.
  - GoatCounter code `wallflowerbikes` counts visits (source = `?src=`), clicks on "See it on Amazon" (`out/<ASIN>`) and sign-ups (`signup`). Nothing is fetched from Amazon.

## Tracking ID
Amazon links use `wallflower.-20` (with the dot). Sam created it in Associates Central on 2026-11-11 because `wallflower-20` was already taken by another account. Never use `wallflower-20`: it belongs to someone else.
