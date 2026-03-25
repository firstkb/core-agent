// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const colorPalette = {
  light: '#F9F9F9',
  primary: '#22324B',
  secondary: '#E1E3EA',
  success: '#18bc9c',
  info: '#3498db',
  warning: '#E78B2F',
  danger: '#F1416C',
  dark: '#181C32',
  primaryActive: '#1C2A40',
  secondaryActive: '#B5B5C3',
  lightActive: '#F4F4F4',
  successActive: '#128f76',
  infoActive: '#217dbb',
  warningActive: '#CE7317',
  dangerActive: '#D9214E',
  darkActive: '#131628',
  primaryLight: '#F1F4FF',
  secondaryLight: '#F9F9F9',
  successLight: '#EEFBEC',
  infoLight: '#F8F5FF',
  warningLight: '#FCF2E8',
  dangerLight: '#FFF2F1',
  darkLight: '#F4F4F4',
  primaryInverse: '#FFFFFF',
  secondaryInverse: '#3F4254',
  lightInverse: '#7E8299',
  successInverse: '#FFFFFF',
  infoInverse: '#FFFFFF',
  warningInverse: '#FFFFFF',
  dangerInverse: '#FFFFFF',
  darkInverse: '#ffffff',
};

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      /*primary: {
        main: colorPalette.primary,
        contrastText: colorPalette.primaryInverse,
        light: colorPalette.primaryLight,
        dark: colorPalette.primaryActive,
      },*/
      secondary: {
        main: colorPalette.secondary,
        contrastText: colorPalette.secondaryInverse,
        light: colorPalette.secondaryLight,
        dark: colorPalette.secondaryActive,
      },
      success: {
        main: colorPalette.success,
        contrastText: colorPalette.successInverse,
        light: colorPalette.successLight,
        dark: colorPalette.successActive,
      },
      info: {
        main: colorPalette.info,
        contrastText: colorPalette.infoInverse,
        light: colorPalette.infoLight,
        dark: colorPalette.infoActive,
      },
      warning: {
        main: colorPalette.warning,
        contrastText: colorPalette.warningInverse,
        light: colorPalette.warningLight,
        dark: colorPalette.warningActive,
      },
      error: {
        main: colorPalette.danger,
        contrastText: colorPalette.dangerInverse,
        light: colorPalette.dangerLight,
        dark: colorPalette.dangerActive,
      },
      background: {
        default: mode === 'light' ? colorPalette.light : '#121212',
        paper: mode === 'light' ? colorPalette.secondaryLight : '#1E1E1E',
      },
      /*background: {
        default: colorPalette.light,
        paper: colorPalette.secondaryLight,
      },
      text: {
        primary: colorPalette.dark,
        secondary: colorPalette.lightInverse,
        disabled: colorPalette.secondaryActive,
      },*/
    },
    components: {
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '7px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: '7px',
            boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.03)',
            backgroundColor: '#111',
            ...(theme.palette.mode === 'light' && {
              backgroundColor: '#FFFFFF',
              border: '1px solid #F1F1F4',
            }),
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '7px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
    },
    /*transitions: {
      create: () => 'none',
      duration: {
        shortest: 0,
        shorter: 0,
        short: 0,
        standard: 0,
        complex: 0,
        enteringScreen: 0,
        leavingScreen: 0,
      },
      easing: {
        easeInOut: 'linear',
        easeOut: 'linear',
        easeIn: 'linear',
        sharp: 'linear',
      },
    },*/
  });
