<p align="center">
  <img src="./public/favicon.svg" alt="Client Favicon" width="64" height="64" />
</p>

# client — Shopping Cart UI

**A note on scope.** This is the two screens the assignment actually asks for (shopping list, order summary) plus a few things beyond the literal wireframe: i18n (en/he) with RTL/LTR, MUI as the component library, and a per-product-card quantity stepper instead of a single category-dropdown → product-dropdown → quantity-field → "add" flow — the stepper *is* the "add to cart" action, so the same requirement (pick a category, pick a product in it, set a quantity, add it) is satisfied with fewer clicks once every product for the selected category is already on screen.

### How the two screens work

#### Screen one — shopping list (`/`)

One request on page load, `GET /api/v1/categories`, brings back every category with its products already nested — no follow-up round trip once the page has loaded. Tabs across the top filter which categories are shown; picking one filters from data already in the store, not a second request. Each product is a card with its own quantity stepper (`−` / count / `+`) instead of a separate dropdown-and-"add"-button flow — clicking `+` both picks that product and adds a unit to the cart at once, and clicking it again on a product already in the cart tops up its quantity instead of creating a duplicate line; clicking `−` steps it back down, removing the line entirely once it reaches 0. A bar sticky to the bottom of the screen shows the total item count and a "Continue to order" button, disabled until the cart has at least one item in it.

#### Screen two — order summary (`/checkout`)

The cart is shown read-only first, then the three required fields (full name, email, address). Validation runs on submit — client-side (`checkoutValidation.ts`) and, independently, server-side too once the request actually reaches `server-orders` (`CreateOrderDto` enforces the same three checks with `class-validator`, regardless of what the client already caught). "Confirm order" posts to the Orders API; on success the screen shows the confirmation with the new order's id and empties the cart. Landing on `/checkout` with nothing in the cart (a refresh, or the URL typed directly) doesn't silently redirect — it shows an explicit empty-cart message with a button back to the catalog instead, since a silent redirect could read as the page failing to load rather than telling you why there's nothing to check out.

### 1. Configure environment variables — from `client/`

```bash
cp .env.example .env

```

Defaults already point at both APIs' default local ports (`server-catalog` on `5080`, `server-orders` on `3001`) — only edit `.env` if you're running either API somewhere else.

### 2. Install dependencies — from `client/`

```bash
npm install

```

### 3. Run — from `client/`

```bash
npm run dev

```

Opens on `http://localhost:5173` (Vite's default). Both `server-catalog` and `server-orders` need to already be running for the catalog to load and orders to submit — see their own READMEs.

### Tests

```bash
npm test

```

Vitest + React Testing Library. Two pure-logic suites (`cartSlice.test.ts`, `checkoutValidation.test.ts` — reducer/selector behavior and form validation, no DOM involved) plus two component tests: `ProductCard.test.tsx` (renders against a real Redux store, clicks through the increment/decrement stepper) and `CheckoutPage.test.tsx` (renders the order summary and checks the per-line unit price/total and the grand total).

33 tests total. Verified by `tsc --noEmit` (clean) after this round's changes — `vitest run` itself couldn't be confirmed from here (`Cannot find native binding` for `@rolldown/binding-wasm32-wasi`, a known npm optional-dependency bug, [npm/cli#4828](https://github.com/npm/cli/issues/4828); a full `node_modules`/`package-lock.json` reinstall was attempted but the missing platform binary isn't reachable from this environment either) — run `npm test` locally to confirm.

*(Note on test output: One cosmetic warning regarding `ButtonBase` from MUI may appear in stderr during `ProductCard.test.tsx` due to a known upstream React Testing Library interaction, which does not affect test assertions.)*

---

### Design notes / trade-offs

* **MUI as the component library, with `@mui/stylis-plugin-rtl` for RTL.** Uses an Emotion cache with the RTL stylis plugin swapped in dynamically based on the active language (`ThemeDirectionProvider.tsx`). We use the official MUI-scoped package (`@mui/stylis-plugin-rtl`) for long-term maintenance compatibility.
* **React Router with two routes (`/`, `/checkout`).** Provides proper browser history, native back-button support, and distinct URLs for each screen without manual state management for view switching.
* **The quantity stepper on each product card acts as the "add to cart" action.** By displaying all products per category simultaneously, clicking `+` immediately initializes and increments the item in the cart, compressing the traditional multi-step flow into a single, intuitive interaction.
* **Normalized Redux cart state (`cartSlice`).** State is structured by `productId` (`{ items: { [productId]: { ... } } }`), mirroring the exact payload shape expected by `POST /api/v1/orders` for seamless request mapping.
* **RTK Query for API integration (`catalogApi`, `ordersApi`).** Leverages two distinct `createApi` instances configured with respective `VITE_CATALOG_API_URL` and `VITE_ORDERS_API_URL` environment variables.
* **Lightweight i18n via `i18next`/`react-i18next`.** Language persistence relies on `localStorage` with `navigator.language` as a fallback, avoiding heavy localization detector dependencies.
* **Robust product image fallback chain.** Implements `imagePath`/`imageUrl`/local-placeholder resolution paired with native browser lazy loading (`loading="lazy"`).
* **Type-safe unit mapping.** Uses a shared `ProductUnit` union type (`'Kilogram' | 'Piece' | 'Liter'`) mapped directly to localized translation keys (`catalog.unit.*`), ensuring UI units remain consistent with backend enums.
* **Multi-stage Docker support.** Includes a `Dockerfile` utilizing a Node build stage transitioning to a lightweight `nginx:alpine` runtime serving static assets, complete with SPA fallback routing rules.
* **Order summary shows unit price, a per-line total, and a grand total.** Cart lines snapshot `unitPrice`/`unit` from the product at the moment they're added (`cartSlice.ts`), not re-read live from the catalog — so `/checkout` reflects the price the shopper actually saw. Each line reuses the same `catalog.pricePerUnit` translation key `ProductCard` already shows; a new `selectCartTotalPrice` selector sums `unitPrice × quantity` across every line for the grand total. Display-only — `POST /api/v1/orders` still sends just `productId`/`productName`/`categoryName`/`quantity`, since `server-orders` doesn't store prices at all.
* **Cart persists across a page reload (`localStorage`), same mechanism as the language preference.** `cartSlice.ts` reads the cart back from a single `shopping-cart-system.cart` key once at store-creation time and `store.ts` writes it back via `store.subscribe`, on any real change to the `cart` slice (a reference-equality check, so unrelated actions like catalog/orders fetches or checkout-form typing don't trigger a write). The read side is defensive rather than trusting stored data outright: malformed JSON, or a stored shape from an older version of the app, falls back to an empty cart; a single malformed line inside an otherwise-valid cart is dropped without discarding the rest.

---

### Possible improvements

Scoped out for a take-home assignment — framed as what I'd add next to take this from a demo to something production-ready:

* **Add an OpenAPI-generated client** for both APIs instead of hand-written types, once the contracts stabilize or scale.
* **Add end-to-end tests (Playwright)** against real running instances of both APIs to cover the complete checkout lifecycle.
* **Add a dedicated Hebrew-friendly web font** (e.g., Assistant or Rubik) to replace the default MUI typography for Hebrew views.