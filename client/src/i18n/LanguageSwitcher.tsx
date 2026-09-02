import Button from '@mui/material/Button';
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslation } from 'react-i18next';
import i18n, { persistLanguage, type SupportedLanguage } from './i18n';

export default function LanguageSwitcher({ className }: { className?: string } = {}) {
  const { t } = useTranslation();

  const handleClick = () => {
    const next: SupportedLanguage = i18n.language === 'he' ? 'en' : 'he';
    void i18n.changeLanguage(next);
    persistLanguage(next);
  };

  return (
    <Button
      color="inherit"
      onClick={handleClick}
      startIcon={<TranslateIcon />}
      aria-label={t('common.switchLanguage')}
      className={className}
      data-testid="language-switcher"
    >
      {t('common.switchLanguage')}
    </Button>
  );
}
