# Wallflower: bike storage picks site

Static site for GitHub Pages (Settings > Pages > Deploy from branch `main`, folder `/`).

- `index.html` forwards to `picks/` and keeps `?src=`. The old waitlist page is in git history.
- `picks/index.html` is the picks page (paid links, budget / mid-range / premium, no prices).
- `picks/kit.js` (same file on all three picks sites) runs the email sign-up and the cookie-free counting:
  - Sign-up posts straight to MailerLite account 2783388 (Wallflower's own account), form 203724961674691697 ("Wallflower site"), double opt-in, with `signup_source` = the `?src=` value.
  - GoatCounter code `wallflowerbikes` counts visits (source = `?src=`), clicks on "See it on Amazon" (`out/<ASIN>`) and sign-ups (`signup`). Nothing is fetched from Amazon.

## Tracking ID swap (waiting on Sam)
Until Sam creates `wallflower-20` in Associates Central, the Amazon links use the main store ID `goodgearpicks-20`, so a sale still counts toward the 3 qualifying sales (it just isn't split by brand). Once `wallflower-20` exists, change every `tag=goodgearpicks-20` in `picks/index.html` to `tag=wallflower-20` (one find-and-replace) and merge.
