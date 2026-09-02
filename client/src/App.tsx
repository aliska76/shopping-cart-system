import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import AppHeader from './components/AppHeader';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';

export default function App() {
  const { i18n } = useTranslation();

  // The one place direction/lang gets applied to the document — every other
  // RTL/LTR-aware piece (ThemeDirectionProvider's emotion cache + MUI theme)
  // reacts to i18n.language itself, so nothing else needs to touch the DOM directly.
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <Box data-testid="app" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppHeader />

        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}
