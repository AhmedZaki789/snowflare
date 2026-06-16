# SnowFlare — Built. Yours.

Brand website for **SnowFlare**, a digital group uniting **strategy, engineering and AI-powered creative** into one accountable system.

Static site — **HTML / CSS / vanilla JS**, no build step, no framework.

## Run locally

Serve the folder with any static server, e.g.:

```bash
npx http-server . -p 5291 -c-1
```

Then open <http://localhost:5291>.

## Pages

- **`index.html`** — homepage: animated "Logo as Hero" (Nexus convergence via GSAP), kinetic stacked type, services, the work showcases (rotating cylinder + draggable Dome Gallery), values and CTA — all over an animated brand background.
- **`library.html`** — the Work Library: every project, filterable by **category** and sortable **A → Z**, with search.

## Structure

```
assets/
  css/styles.css      brand tokens, components, animations
  js/                 main, gsap, gallery3d, dome, library, glass, logoloop
  fonts/              Roboto Slab + Almarai
  img/                logo, brand backgrounds
```

To add projects to the library, extend the `PROJECTS` array in `assets/js/library.js`.

---

**Built. Yours.** · صُنع خصيصًا لك
