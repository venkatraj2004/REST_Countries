# REST Countries Explorer

A small single-page site that fetches country data from the REST Countries API and lets you search by name, country code, continent (region), or capital.

Files:
- `index.html` — main page
- `styles.css` — UI styles
- `script.js` — fetch + render + filter logic

Run:
1. Open `d:\Countries\rest-countries\index.html` directly in your browser.

Or run a simple local server from PowerShell (recommended):

```powershell
cd d:\Countries\rest-countries
python -m http.server 8000
# then open http://localhost:8000
```

Notes:
- Uses `https://restcountries.com/v3.1/all` with a small fields filter for lighter payloads.
- Search is client-side and case-insensitive.
- If you want pagination, a details modal, or caching, tell me and I'll add it.
