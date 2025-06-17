import { useState, useEffect, useCallback } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Stack, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  NotificationsNone, 
  AcUnit, 
  Timer
} from '@mui/icons-material';
import { format, isValid } from 'date-fns';
import type { TemperatureStatistics, TemperatureAlert, CoolingEvent } from '../types/metrics';
import { metricsService } from '../services/metricsService';

interface StatsCardProps {
  days?: number;
}

/**
 * Safely format a date, handling invalid values
 */
const safeFormatDate = (dateString: string | undefined, formatStr: string): string => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    if (isValid(date)) {
      return format(date, formatStr);
    }
    return 'Invalid date';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return 'Invalid date';
  }
};

export const StatsCard = ({ days = 7 }: StatsCardProps) => {
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TemperatureStatistics | null>(null);
  const [alerts, setAlerts] = useState<TemperatureAlert[]>([]);
  const [coolingEvents, setCoolingEvents] = useState<CoolingEvent[]>([]);
  
  const fetchData = useCallback(async () => {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      
      // Fetch statistics
      const statsResult = await metricsService.getStatistics(start, end);
      setStats(statsResult);
      
      // Fetch alerts
      const alertsResult = await metricsService.getAlerts(start, end);
      if (alertsResult.alerts) {
        console.log('Temperature alerts:', alertsResult.alerts);
        setAlerts(alertsResult.alerts.reverse().slice(0, 5)); // Show only the 5 most recent alerts
      }
      
      // Fetch cooling events
      const coolingResult = await metricsService.getCoolingEvents(start, end);
      if (coolingResult.events) {
        console.log('Cooling events:', coolingResult.events);
        setCoolingEvents(coolingResult.events.reverse().slice(0, 5)); // Show only the 5 most recent cooling events
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error(err);
    }
  }, [days]);
  
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchData]);
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%', 
        borderRadius: 2 
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        System Statistics ({days} days)
      </Typography>
      
      {error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : stats ? (
        <Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box flex={1}>
              <Box mb={2}>
                <Typography variant="subtitle1">Temperature</Typography>
                <Typography variant="h4" component="div">
                  {stats.temperature.average?.toFixed(1)}°C
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average temperature
                </Typography>
                
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="body1">
                      Min: {stats.temperature.minimum}°C
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1">
                      Max: {stats.temperature.maximum}°C
                    </Typography>
                  </Box>
                </Box>
                
                {stats.humidity.average !== undefined && (
                  <Box mt={2}>
                    <Typography variant="body1">
                      Avg Humidity: {stats.humidity.average?.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Divider />
              
              <Box mt={2}>
                <Typography variant="subtitle1">System Activity</Typography>
                <Typography variant="body1">
                  {stats.temperature.readingCount} sensor readings
                </Typography>
                <Typography variant="body1">
                  {stats.alerts.total} temperature alerts
                </Typography>
                <Typography variant="body1">
                  {stats.cooling.total} cooling activations
                </Typography>
              </Box>
            </Box>
            
            <Box flex={1}>
              <Box mb={2}>
                <Typography variant="subtitle1">Recent Alerts</Typography>
                {alerts.length > 0 ? (
                  <List dense>
                    {alerts.map((alert) => (
                      <ListItem key={alert.id || alert.timestamp}>
                        <ListItemIcon>
                          <NotificationsNone color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${alert.temperature?.toFixed(1)}°C`}
                          secondary={`${safeFormatDate(alert.timestamp, 'MMM dd, HH:mm')} - ${
                            alert.duration ? `${(alert.duration / 60).toFixed(1)} min` : 'Ongoing'
                          }`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2">No recent alerts</Typography>
                )}
              </Box>
              
              <Divider />
              
              <Box mt={2}>
                <Typography variant="subtitle1">Recent Cooling Events</Typography>
                {coolingEvents.length > 0 ? (
                  <List dense>
                    {coolingEvents.map((event) => (
                      <ListItem key={event.id || event.timestamp}>
                        <ListItemIcon>
                          {event.triggerType === 'auto' ? <AcUnit color="primary" /> : <Timer color="secondary" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${event.triggerType === 'auto' ? 'Automatic' : 'Manual'} activation`}
                          secondary={`${safeFormatDate(event.activated_at, 'MMM dd, HH:mm')} - ${
                            event.duration 
                              ? `${(event.duration / 60).toFixed(1)} min` 
                              : 'Ongoing'
                          }`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2">No recent cooling events</Typography>
                )}
              </Box>
            </Box>
          </Stack>
        </Box>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography>No data available</Typography>
        </Box>
      )}
    </Paper>
  );
};
