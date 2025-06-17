import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { ThermostatOutlined } from '@mui/icons-material';
import { formatDistanceToNow, isValid } from 'date-fns';
import type { TemperatureReading } from '../types/metrics';

export const CurrentTemperature = () => {
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TemperatureReading>({
    temperature: 0,
    humidity: undefined,
    timestamp: new Date().toISOString()
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
   useEffect(() => {
    const socket = new WebSocket('ws://localhost:7000/ws');

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'temp_update' && msg.data) {
          setData(msg.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket error');
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setError('Connection closed');
    };

    // Limpieza al desmontar el componente
    return () => {
      socket.close();
    };
  }, []);
  
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
