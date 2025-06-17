import { useState, useEffect, useCallback } from 'react';
import { Paper, Typography, Box, FormControl, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, subHours, isValid } from 'date-fns';
import type { TemperatureReading, AggregatedTemperature } from '../types/metrics';
import { metricsService } from '../services/metricsService';

type DataType = 'raw' | 'hourly' | 'daily';
type TimeRange = '24h' | '7d' | '30d';

interface ChartDataPoint {
  timestamp: number;
  temperature?: number;
  humidity?: number;
  avgTemperature?: number;
  minTemperature?: number;
  maxTemperature?: number;
  avgHumidity?: number;
}

export const TemperatureChart = () => {
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [dataType, setDataType] = useState<DataType>('raw');
  
  const getDateRange = useCallback(() => {
    const end = new Date();
    let start;
    
    switch (timeRange) {
      case '24h':
        start = subHours(end, 24);
        break;
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      default:
        start = subHours(end, 24);
    }
    
    return { start, end };
  }, [timeRange]);
  
  const fetchData = useCallback(async () => {
    try {
      const { start, end } = getDateRange();
      
      let result;
      let formattedData: ChartDataPoint[] = [];
      
      if (dataType === 'raw') {
        result = await metricsService.getTemperatureRange(start, end);
        if (result.readings) {
          formattedData = result.readings.map((item: TemperatureReading) => ({
            timestamp: new Date(item.timestamp).getTime(),
            temperature: item.temperature,
            humidity: item.humidity
          }));
        }
      } else if (dataType === 'hourly') {
        result = await metricsService.getHourlyAggregates(start, end);
        if (result.aggregates) {
          formattedData = result.aggregates.map((item: AggregatedTemperature) => ({
            timestamp: new Date(`${item.date}T${item.hour?.toString().padStart(2, '0') || '00'}:00:00`).getTime(),
            avgTemperature: item.avgTemperature,
            minTemperature: item.minTemperature,
            maxTemperature: item.maxTemperature,
            avgHumidity: item.avgHumidity
          }));
        }
      } else if (dataType === 'daily') {
        result = await metricsService.getDailyAggregates(start, end);
        if (result.aggregates) {
          formattedData = result.aggregates.map((item: AggregatedTemperature) => ({
            timestamp: new Date(item.date).getTime(),
            avgTemperature: item.avgTemperature,
            minTemperature: item.minTemperature,
            maxTemperature: item.maxTemperature,
            avgHumidity: item.avgHumidity
          }));
        }
      }
      
      setChartData(formattedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch temperature data');
      console.error(err);
    }
  }, [dataType, getDateRange]);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchData, timeRange, dataType]);
  
  const formatXAxis = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      if (!isValid(date)) return '';
      
      if (dataType === 'daily') {
        return format(date, 'MMM dd');
      } else if (dataType === 'hourly') {
        return format(date, 'HH:mm');
      }
      return format(date, 'HH:mm');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return '';
    }
  };
  
  const formatTooltipDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      if (!isValid(date)) return 'Invalid date';
      
      if (dataType === 'daily') {
        return format(date, 'MMM dd, yyyy');
      }
      return format(date, 'MMM dd, HH:mm');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return 'Invalid date';
    }
  };
  
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as TimeRange;
    setTimeRange(value);
    
    // If we have a large time range, switch to aggregated data
    if (value === '7d' && dataType === 'raw') {
      setDataType('hourly');
    } else if (value === '30d') {
      setDataType('daily');
    }
  };
  
  const handleDataTypeChange = (event: SelectChangeEvent) => {
    setDataType(event.target.value as DataType);
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%', 
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Temperature History
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              displayEmpty
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small">
            <Select
              value={dataType}
              onChange={handleDataTypeChange}
              displayEmpty
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="raw" disabled={timeRange === '30d'}>Raw Data</MenuItem>
              <MenuItem value="hourly" disabled={timeRange === '30d'}>Hourly Avg</MenuItem>
              <MenuItem value="daily">Daily Avg</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {error ? (
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
            />
            <YAxis yAxisId="temp" name="Temperature" unit="°C" />
            {dataType !== 'raw' && (
              <YAxis yAxisId="humidity" name="Humidity" unit="%" orientation="right" />
            )}
            <Tooltip 
              labelFormatter={(value) => formatTooltipDate(value)}
              formatter={(value: number) => [value.toFixed(1), '']}
            />
            <Legend />
            
            {dataType === 'raw' ? (
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                stroke="#ff9800"
                activeDot={{ r: 8 }}
                name="Temperature (°C)"
                isAnimationActive={false}
              />
            ) : (
              <>
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="avgTemperature"
                  stroke="#ff9800"
                  activeDot={{ r: 6 }}
                  name="Avg Temp (°C)"
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="minTemperature"
                  stroke="#2196f3"
                  dot={false}
                  name="Min Temp (°C)"
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="maxTemperature"
                  stroke="#f44336"
                  dot={false}
                  name="Max Temp (°C)"
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="avgHumidity"
                  stroke="#4caf50"
                  name="Avg Humidity (%)"
                  isAnimationActive={false}
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
          <Typography>No data available</Typography>
        </Box>
      )}
    </Paper>
  );
};
