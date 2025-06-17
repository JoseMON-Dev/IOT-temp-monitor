import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { DashboardLayout } from './components/DashboardLayout';
import Grid from '@mui/material/Grid'
import { CurrentTemperature } from './components/CurrentTemperature';
import { TemperatureChart } from './components/TemperatureChart';
import { StatsCard } from './components/StatsCard';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#e65100',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 2,
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardLayout title="IoT Temperature Monitor">
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            {/* Current Temperature Card */}
            <Grid size={6}>
              <CurrentTemperature />
            </Grid>
            {/* Temperature Chart */}
            <Grid size={6} >
              <TemperatureChart />
            </Grid>
            {/* Statistics Card */}
            <Grid size={12}>
              <StatsCard days={7} />
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </ThemeProvider>
  )
}

export default App
