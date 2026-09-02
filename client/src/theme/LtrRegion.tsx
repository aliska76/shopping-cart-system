import { useMemo, type ReactNode } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { prefixer } from 'stylis';

/**
 * Pins one subtree to a physical LTR layout regardless of the app's current language/theme
 * direction (see ThemeDirectionProvider). A plain CSS `direction: 'ltr'` override on a Box is
 * enough for a plain flex container (that's what App.tsx's header Toolbar uses), but it is
 * NOT enough for MUI's `Tabs`: reading Tabs' own source confirms its indicator position,
 * scroll-button direction and scroll-amount math all come from `useRtl()` (MUI's internal RTL
 * context, populated from the nearest `ThemeProvider`'s `direction`) rather than from the
 * DOM's actual computed `direction` property — so a `sx={{ direction: 'ltr' }}` override on
 * Tabs itself would leave that internal logic still thinking it's RTL while the CSS around it
 * changed, misaligning the indicator. This wraps a subtree in both a nested MUI theme
 * (`direction: 'ltr'`, which is what `useRtl()` actually reads) and a nested Emotion cache
 * with only the `prefixer` plugin — not the RTL one from `ThemeDirectionProvider` — so any
 * logical CSS properties authored inside via `sx` resolve as LTR too, instead of being
 * flipped by the app-wide RTL cache. Text content (e.g. Hebrew tab labels) is unaffected
 * either way — the Unicode bidi algorithm orders characters within a run on its own,
 * independently of the container's layout direction.
 */
export default function LtrRegion({ children }: { children: ReactNode }) {
  const cache = useMemo(() => createCache({ key: 'muiltr-region', stylisPlugins: [prefixer] }), []);
  const theme = useMemo(() => createTheme({ direction: 'ltr' }), []);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <Box dir="ltr">{children}</Box>
      </ThemeProvider>
    </CacheProvider>
  );
}
