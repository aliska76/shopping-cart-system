import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Box from '@mui/material/Box';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { toolbarSx, titleBoxSx } from './AppHeader.styles';

/**
 * The app-wide top bar: cart icon + title on one side, LanguageSwitcher on the other. Pulled
 * out of App.tsx (which otherwise mixes routing/layout concerns with header markup) since
 * this piece has no dependency on either — it only needs the current translation.
 */
export default function AppHeader({ className }: { className?: string } = {}) {
  const { t } = useTranslation();

  return (
    <AppBar position="static" color="primary" className={className} data-testid="app-header">
      {/* Pinned to a physical LTR layout regardless of the current language -- logo/title
          stay on the physical left, LanguageSwitcher on the physical right in both en and
          he, rather than the header itself mirroring on every language switch. Hebrew text
          inside still renders correctly (the Unicode bidi algorithm orders characters
          within a run on its own; `direction` here only pins the *flex layout*, not glyph
          order), so this doesn't affect how the Hebrew title itself reads. */}
      <Toolbar sx={toolbarSx}>
        <Box sx={titleBoxSx}>
          <ShoppingCartIcon />
          <Typography variant="h6" component="h1">
            {t('common.appTitle')}
          </Typography>
        </Box>
        <LanguageSwitcher />
      </Toolbar>
    </AppBar>
  );
}
