# The Naughty Chip Case — North Pole-ice Department

A point-and-click holiday mystery for GitHub Pages. Static front end + a Google Sheet backend (via Google Apps Script) that records one guess per person.

## Files
| File | What it is |
|---|---|
| `index.html` / `style.css` / `app.js` | The game (office → suspect board → submit guess → computer case files) |
| `config.js` | **Edit this.** Backend URL, Chip names, puzzle titles + unlock dates |
| `assets/` | Office + computer backgrounds, 24 Chip suspect images |
| `backend/Code.gs` | Google Apps Script for the submissions sheet |

## 1. Set up the backend (≈5 min)
1. Create a Google Sheet, e.g. **Naughty Chip Submissions**.
2. **Extensions → Apps Script**. Paste in `backend/Code.gs`, save.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorize, then copy the **Web app URL** (ends in `/exec`).
5. Paste it into `SUBMIT_URL` in `config.js`.

The sheet gets a **Submissions** tab: `Timestamp | Name | Email | Chip # | Chip Name`.
Duplicate names (case/spacing-insensitive) or emails are rejected server-side, with a lock so simultaneous submissions can't sneak through.

> If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
> If "Anyone" isn't available, your Workspace admin has restricted public web apps — deploy from a personal Google account instead.

### Admin page
`admin.html` (e.g. `https://<user>.github.io/<repo>/admin.html`) shows every guess, a tally per Chip, and search/filter.
The password (`hohohost2026`) is checked by the Apps Script, not the website, so it never appears in the public files.
To change it, edit `ADMIN_PASSWORD` in `Code.gs`, then **Deploy → Manage deployments → Edit → New version**.

## 2. Publish on GitHub Pages
1. Create a repo and upload everything in this folder (keep the folder structure; `index.html` at the root).
2. **Settings → Pages → Deploy from a branch → `main` / root**.
3. Your game will be at `https://<user>.github.io/<repo>/`.

## 3. Puzzles (later)
In `config.js` → `PUZZLES`, each case file has an `unlock` date (player's local midnight) and a `url`.
Drop a puzzle page in e.g. `puzzles/puzzle-1.html`, set `url: "puzzles/puzzle-1.html"`, and it opens in a viewer on the computer screen.
Set `DEV_UNLOCK_ALL: true` while testing — set it back to `false` before launch.

## Notes
- "NICE" marks on the board are saved in the player's browser so they persist between visits.
- After a successful guess the player's browser also remembers it and shows a "Case submitted" screen; the sheet is the real enforcement.
- To test locally: `python3 -m http.server` in this folder, then open `http://localhost:8000`.

## Testing builds
`tools/` holds a preview-only test harness (fake submissions sheet + test panel). `index.html` never loads it, so it's safe to leave in the repo or delete.
