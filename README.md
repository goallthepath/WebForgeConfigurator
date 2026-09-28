<div align="center">

# ⚒️ WebForge Configurator

**A web configurator for the art-metalwork trade:
railings, window grilles, garden gates and stairs, designed in the browser and previewed in 3D.**

![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black?logo=three.js)
![WordPress](https://img.shields.io/badge/WordPress-backend-21759B?logo=wordpress&logoColor=white)

</div>

---

## 👋 About the project

**Michl and I** are building a solution for the customers of a traditional
**art-metalwork and metal-fabrication workshop** (*Kunst- und Metallschlosserei*).

Customers usually arrive with a rough idea like *"a railing for my balcony"* or
*"a gate for the garden"*. They often don't have dimensions, and they rarely know
which options exist. **WebForge** lets them work out that idea in a guided web tool:

- choose the product and the style,
- enter the dimensions,
- watch the design update live in **3D**,
- and send a clean, complete **quote request** to the workshop.

The workshop still checks every configuration by hand and writes the final
quote. The tool does not replace the craftsperson. It just gives the first
conversation a much better starting point.

## ✨ Features

| Module | What customers can configure |
| --- | --- |
| 🏛️ **Railings** (*Geländer*) | Layout (straight, L, U), mounting type, posts, top rail, infill (bars, sheet, mesh, ornaments), materials and finishes |
| 🪟 **Window grilles** (*Fenstergitter*) | Window dimensions, grille pattern, ornaments, mounting |
| 🚪 **Garden gates** (*Gartentore*) | Single or double leaf, opening direction with simulation, infill style, hardware |
| 🪜 **Stairs** (*Treppen*) | Stair geometry (step-rule check), stringers, risers, combined stair railing with handrail |

**Across all modules:**

- 🧊 **Parametric 3D preview** built with React Three Fiber, plus a 2D elevation drawing
- 📐 **Rule engine** with traffic-light feedback (green / yellow / red), based on common Swiss safety guidelines (BFU/SIA) for railings
- 💬 **Honest pricing.** The tool never invents prices. Until a price model is approved, it shows *"individual review"* instead of a fake number.
- 🧾 **Versioned configurations.** Every request stores the product, rule and price version.
- 📱 **Mobile-first.** The whole flow works on a phone.

## 🏗️ Architecture

```
┌──────────────────────┐     REST (JSON)     ┌───────────────────────────────┐
│  Configurator (SPA)  │ ──────────────────▶ │  WordPress + webforge-core    │
│  React · TS · R3F    │                     │  post types · REST · requests │
└──────────┬───────────┘                     └───────────────┬───────────────┘
           │ reads                                           │ renders
┌──────────▼───────────┐                     ┌───────────────▼───────────────┐
│  product-data/       │                     │  Block theme `webforge`       │
│  JSON catalogs +     │                     │  website & content            │
│  schemas             │                     └───────────────────────────────┘
└──────────────────────┘
```

| Part | Tech | Location |
| --- | --- | --- |
| Configurator | React 19, TypeScript, React Three Fiber, Vite, Vitest | [`configurator/`](configurator/) |
| Backend & API | WordPress plugin `webforge-core` | [`wordpress/wp-content/plugins/webforge-core/`](wordpress/wp-content/plugins/webforge-core/) |
| Website theme | WordPress block theme `webforge` | [`wordpress/wp-content/themes/webforge/`](wordpress/wp-content/themes/webforge/) |
| Product data | Versioned JSON catalogs + JSON Schemas | [`product-data/`](product-data/) |
| Design tokens | Shared colors & typography | [`design-tokens/`](design-tokens/) |
| Docs & ADRs | Vision, architecture, decisions (German) | [`docs/`](docs/) |

## 🚀 Getting started

**Requirements:** Node.js ≥ 20. Docker Desktop is only needed for the WordPress backend.

```bash
# Configurator only
cd configurator
npm install
npm run dev          # → http://localhost:5173/konfigurator/
```

```bash
# Full stack: WordPress + database + Mailpit
cp .env.example .env
docker compose up -d # → WordPress http://localhost:8080 · Mailpit http://localhost:8025
```

The detailed setup guide (in German) is in [`docs/development.md`](docs/development.md).

### Checks

```bash
cd configurator
npm test             # unit tests (Vitest)
npm run typecheck    # TypeScript
npm run build        # production build
```

## 🧭 Principles

- **No invented numbers.** Missing prices, profile dimensions or technical limits are flagged as *"professional approval required"*.
- **Server-side validation.** Price and rule checks run again on the server when a request is submitted.
- **Test data is always labelled** as `TESTDATEN`.

## 🗺️ Roadmap

- [x] Configurator core + railing module with parametric 3D
- [x] Window grille and garden gate modules
- [x] Stair module with combined stair railing
- [ ] Approved profile catalog and price model
- [ ] Quote request flow end-to-end (WordPress REST + e-mail)
- [ ] Staging deployment and workshop acceptance

See [`CHANGELOG.md`](CHANGELOG.md) for details.

## 🤝 Team

Built with care by **[@goallthepath](https://github.com/goallthepath)** and **Michl**.

## 📄 License

Released under the [MIT License](LICENSE).
