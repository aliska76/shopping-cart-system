import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Box from '@mui/material/Box';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';

export default function App() {
  const { t, i18n } = useTranslation();

  // The one place direction/lang gets applied to the document — every other
  // RTL/LTR-aware piece (ThemeDirectionProvider's emotion cache + MUI theme)
  // reacts to i18n.language itself, so nothing else needs to touch the DOM directly.
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="primary">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartIcon />
              <Typography variant="h6" component="h1">
                {t('common.appTitle')}
              </Typography>
            </Box>
            <LanguageSwitcher />
          </Toolbar>
        </AppBar>

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
