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
import {
  rootSx,
  mainContainerSx,
  loadingBoxSx,
  tabsSx,
  categorySectionSx,
  categoryTitleSx,
  productsGridSx,
  bottomBarSx,
  bottomBarContainerSx,
} from './CatalogPage.styles';

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
    <Box data-testid="catalog-page" sx={rootSx}>
      <Container maxWidth="lg" sx={mainContainerSx}>
        {isLoading && (
          <Box sx={loadingBoxSx}>
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
                sx={tabsSx}
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
                <Box key={category.id} sx={categorySectionSx}>
                  {selected === ALL && (
                    <Typography variant="h6" component="h2" sx={categoryTitleSx}>
                      {categoryName}
                    </Typography>
                  )}
                  {category.products.length === 0 ? (
                    <Typography color="text.secondary">{t('catalog.noProducts')}</Typography>
                  ) : (
                    <Box
                      sx={productsGridSx}
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
        sx={bottomBarSx}
      >
        <Container
          maxWidth="lg"
          sx={bottomBarContainerSx}
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
