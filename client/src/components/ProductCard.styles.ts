import type { SxProps, Theme } from '@mui/material/styles';

export const cardSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

export const cardContentSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  flexGrow: 1,
};

export const titleSx: SxProps<Theme> = {
  flexGrow: 1,
};

export const stepperRowSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
};

export const quantitySx: SxProps<Theme> = {
  minWidth: 24,
  textAlign: 'center',
};
