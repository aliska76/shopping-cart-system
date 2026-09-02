import type { SxProps, Theme } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
};

export const mainContainerSx: SxProps<Theme> = {
  flexGrow: 1,
  py: 3,
  pb: 12,
};

export const loadingBoxSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  py: 6,
};

export const tabsSx: SxProps<Theme> = {
  mb: 3,
  '& .MuiTab-root': {
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
  },
};

export const categorySectionSx: SxProps<Theme> = {
  mb: 4,
};

export const categoryTitleSx: SxProps<Theme> = {
  mb: 1.5,
};

export const productsGridSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, 1fr)',
    sm: 'repeat(3, 1fr)',
    md: 'repeat(4, 1fr)',
  },
  gap: 2,
};

export const bottomBarSx: SxProps<Theme> = {
  position: 'sticky',
  bottom: 0,
  py: 2,
  borderTop: 1,
  borderColor: 'divider',
};

export const bottomBarContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
};
