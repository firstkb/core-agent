import { alpha, createTheme } from '@mui/material/styles';

export const maestroTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f6f7f9',
      paper: '#ffffff'
    },
    primary: {
      main: '#2454a6',
      dark: '#18396f'
    },
    secondary: {
      main: '#19736b'
    },
    warning: {
      main: '#b76e00'
    },
    error: {
      main: '#b3261e'
    },
    success: {
      main: '#2f7d46'
    },
    divider: '#dfe3ea'
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700
    },
    h1: {
      fontSize: '1.6rem',
      fontWeight: 760
    },
    h2: {
      fontSize: '1.15rem',
      fontWeight: 740
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 740
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e4e8ef'
        },
        head: {
          backgroundColor: '#f8fafc',
          color: '#4b5565',
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase'
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08)
          }
        })
      }
    }
  }
});
