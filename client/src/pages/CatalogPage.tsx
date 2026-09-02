import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import LtrRegion from '../theme/LtrRegion';
import { useGetCategoriesQuery } from '../api/catalogApi';
import ProductCard from '../components/ProductCard';
import { useAppSelector } from '../app/hooks';
import { selectCartTotalQuantity } from '../features/cart/cartSlice';

const ALL = 'all' as const;

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: categories, isLoading, isError, refetch } = useGetCategoriesQuery();
  const [selected, setSelected] = useState<number | typeof ALL>(ALL);
  const totalQuantity = useAppSelector((state) => selectCartTotalQuantity(state.cart));

  const visibleCategories = useMemo(() => {
    if (!categories) return [];
    if (selected === ALL) return categories;
    return categories.filter((category) => category.id === selected);
  }, [categories, selected]);

  return (
    <Box data-testid="catalog-page" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3, pb: 12 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label={t('common.loading')} />
          </Box>
        )}

        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
            }
          >
            {t('common.errorLoadingCatalog')}
          </Alert>
        )}

        {categories && (
          <>
            {/* Wrapped in LtrRegion so the category order stays physically fixed across
                languages instead of the tab strip mirroring on every switch to Hebrew (see
                LtrRegion.tsx for why a plain CSS override isn't enough for Tabs specifically).
                Font bumped up from MUI's small, all-caps default -- easy to miss as a row of
                actual navigation instead of a caption. */}
            <LtrRegion>
              <Tabs
                value={selected}
                onChange={(_event, value: number | typeof ALL) => setSelected(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                  },
                }}
              >
                <Tab label={t('catalog.allCategories')} value={ALL} />
                {categories.map((category) => (
                  <Tab
                    key={category.id}
                    label={i18n.language === 'he' ? category.nameHe : category.nameEn}
                    value={category.id}
                  />
                ))}
              </Tabs>
            </LtrRegion>

            {visibleCategories.map((category) => {
              const categoryName = i18n.language === 'he' ? category.nameHe : category.nameEn;
              return (
                <Box key={category.id} sx={{ mb: 4 }}>
                  {selected === ALL && (
                    <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
                      {categoryName}
                    </Typography>
                  )}
                  {category.products.length === 0 ? (
                    <Typography color="text.secondary">{t('catalog.noProducts')}</Typography>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(2, 1fr)',
                          sm: 'repeat(3, 1fr)',
                          md: 'repeat(4, 1fr)',
                        },
                        gap: 2,
                      }}
                    >
                      {category.products.map((product) => (
                        <ProductCard key={product.id} product={product} categoryName={categoryName} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Container>

      <Paper
        elevation={3}
        square
        sx={{ position: 'sticky', bottom: 0, py: 2, borderTop: 1, borderColor: 'divider' }}
      >
        <Container
          maxWidth="lg"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          <Typography>{t('catalog.itemsInCart', { count: totalQuantity })}</Typography>
          <Button
            variant="contained"
            disabled={totalQuantity === 0}
            onClick={() => navigate('/checkout')}
          >
            {t('common.continueToOrder')}
          </Button>
        </Container>
      </Paper>
    </Box>
  );
}
