/**
 * `stylis@4.4.0` ships no TypeScript declarations of its own (confirmed by
 * inspecting its published package.json: no "types"/"typings" field, and no
 * "types" condition in its "exports" map). `@mui/stylis-plugin-rtl`'s own
 * .d.mts hits the same gap for its internal use of `stylis`, which
 * `skipLibCheck` papers over — but our own direct `import { prefixer } from
 * 'stylis'` in `ThemeDirectionProvider.tsx` is source code we do type-check,
 * so it still needs a declaration. `@types/stylis` exists on npm but is
 * pinned to an older stylis line (4.2.x) than the one we depend on (4.4.0),
 * so a local ambient module is the more reliable fix here: it's guaranteed
 * to match whatever `stylis` actually exports at runtime, at the cost of
 * `prefixer` (and anything else imported from 'stylis') being typed `any`.
 */
declare module 'stylis';
