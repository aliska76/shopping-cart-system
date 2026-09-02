import type { SxProps, Theme } from '@mui/material/styles';

export const centeredContainerSx: SxProps<Theme> = {
  py: 6,
};

export const formContainerSx: SxProps<Theme> = {
  py: 4,
};

export const alertSx: SxProps<Theme> = {
  mb: 2,
};

export const bodyTextSx: SxProps<Theme> = {
  mb: 3,
};

export const emptyTitleSx: SxProps<Theme> = {
  mb: 1,
};

export const formTitleSx: SxProps<Theme> = {
  mb: 2,
};

export const itemsListPaperSx: SxProps<Theme> = {
  mb: 3,
};

export const boldTextSx: SxProps<Theme> = {
  fontWeight: 'bold',
};

export const itemRowSx: SxProps<Theme> = {
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 0.5,
};

export const itemLineSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
};

export const lineTotalSx: SxProps<Theme> = {
  fontWeight: 500,
};

export const totalRowSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
};

export const formSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export const formActionsSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mt: 1,
};
