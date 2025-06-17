import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { ThermostatOutlined } from '@mui/icons-material';
import { formatDistanceToNow, isValid } from 'date-fns';
import type { TemperatureReading } from '../types/metrics';
import { metricsService } from '../services/metricsService';

export const CurrentTemperature = () => {
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TemperatureReading>({
    temperature: 0,
    humidity: undefined,
    timestamp: new Date().toISOString()
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      const result = await metricsService.getLatestTemperature();
      setData(result || {
        temperature: 0,
        humidity: undefined,
        timestamp: new Date().toISOString()
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch latest temperature data');
      console.error(err);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [fetchData]);
  
  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return '#2196f3'; // Cold - blue
    if (temp < 20) return '#4caf50'; // Cool - green
    if (temp < 30) return '#ff9800'; // Warm - orange
    return '#f44336'; // Hot - red
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%', 
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Current Temperature
      </Typography>
      
      {error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="150px">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : data ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Box flex={1} display="flex" alignItems="center" justifyContent="center">
            <ThermostatOutlined 
              sx={{ 
                fontSize: '4rem', 
                color: getTemperatureColor(data.temperature)
              }} 
            />
            <Typography 
              variant="h2" 
              component="span" 
              sx={{ 
                ml: 1,
                color: getTemperatureColor(data.temperature)
              }}
            >
              {data.temperature.toFixed(1)}°C
            </Typography>
          </Box>
          <Box flex={1}>
            {data.humidity !== undefined && (
              <Typography variant="body1">
                Humidity: {data.humidity.toFixed(1)}%
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Timestamp: {(() => {
                try {
                  const date = new Date(data.timestamp);
                  return isValid(date) ? date.toLocaleString() : 'Invalid date';
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_) {
                  return 'Invalid date';
                }
              })()}
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" display="block" color="text.secondary">
                Updated {formatDistanceToNow(lastUpdated)} ago
              </Typography>
            )}
          </Box>
        </Stack>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="150px">
          <Typography>No data available</Typography>
        </Box>
      )}
    </Paper>
  );
};
