import type { SxProps, Theme } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

export const mainSx: SxProps<Theme> = {
  flexGrow: 1,
};
