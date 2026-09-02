import { useMemo, type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { prefixer } from 'stylis';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { useTranslation } from 'react-i18next';

/**
 * RTL/LTR switching, isolated in one place: an Emotion cache with the RTL
 * stylis plugin (only) when the current language is Hebrew, plus a matching
 * MUI theme `direction`. MUI's `sx`/style props already emit logical CSS
 * properties (margin-inline-start, not margin-left), so this cache is what
 * turns that into the correct physical direction — the same idea as the
 * plain CSS "logical properties" approach from the original plan, just
 * routed through MUI's own mechanism instead of hand-written CSS.
 */
export default function ThemeDirectionProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'he' ? 'rtl' : 'ltr';

  const cache = useMemo(
    () =>
      createCache({
        key: direction === 'rtl' ? 'muirtl' : 'muiltr',
        stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
      }),
    [direction],
  );

  const theme = useMemo(() => createTheme({ direction }), [direction]);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
