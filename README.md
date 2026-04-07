# Stellarossa Recipe Costing Template

Offline single-page costing template for food and drink recipes.

## Files
- `index.html` - main app page
- `styles.css` - styling
- `script.js` - all costing logic and save/load logic
- `assets/stellarossa-logo.svg` - logo used on the home screen
- `recipes/` - folder for saved recipe files

## What it does
- Works offline
- Add and delete ingredient rows
- Handles food and drink costing
- Includes drink-friendly units like ml, L, shot and scoop
- Auto-calculates batch cost, per-serve cost, GST, profit, markup and food/drink cost %
- Print or save to PDF
- Save recipe as JSON
- Load recipe JSON back into the form
- Saves the current draft in browser local storage automatically

## Save into the recipes folder
Because a normal website cannot silently write files anywhere on a computer, the template uses this setup:

1. Click **Choose Recipe Folder**
2. Select the `recipes` folder
3. Click **Recipe Download**

In supported Chromium browsers, the file saves straight into that folder.
If folder access is not supported, the file downloads normally and you can move it into `recipes` manually.

## GitHub setup
Upload the whole folder to a GitHub repo.
If you want to use GitHub Pages, keep all files together exactly as they are.
