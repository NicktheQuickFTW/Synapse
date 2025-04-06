import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Sample data for charts
const performanceData = [
  { time: '00:00', value: 12 },
  { time: '03:00', value: 8 },
  { time: '06:00', value: 10 },
  { time: '09:00', value: 32 },
  { time: '12:00', value: 42 },
  { time: '15:00', value: 38 },
  { time: '18:00', value: 25 },
  { time: '21:00', value: 15 },
];

// Sample modules data
const modulesData = [
  { id: 1, name: 'Transfer Portal', status: 'Active', version: '1.2.3' },
  { id: 2, name: 'Flextime', status: 'Active', version: '2.0.1' },
  { id: 3, name: 'Weather Intelligence', status: 'Inactive', version: '0.9.5' },
  { id: 4, name: 'Content Management', status: 'Active', version: '1.5.0' },
];

// Sample events data
const recentEvents = [
  { id: 1, type: 'Module Update', module: 'Transfer Portal', time: '2 hours ago' },
  { id: 2, type: 'User Login', user: 'admin', time: '4 hours ago' },
  { id: 3, type: 'API Request', endpoint: '/api/data', time: '5 hours ago' },
  { id: 4, type: 'System Notification', message: 'Backup completed', time: '1 day ago' },
];

function Dashboard() {
  const [systemStats, setSystemStats] = useState({
    activeModules: 0,
    totalUsers: 0,
    apiCalls: 0,
    uptime: '0d 0h',
  });

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setSystemStats({
      activeModules: 3,
      totalUsers: 15,
      apiCalls: 1243,
      uptime: '24d 5h',
    });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Active Modules
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {systemStats.activeModules}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Total Users
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {systemStats.totalUsers}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              API Calls Today
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {systemStats.apiCalls}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              System Uptime
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              {systemStats.uptime}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
            }}
          >
            <Typography variant="h6" gutterBottom>
              System Performance
            </Typography>
            <ResponsiveContainer>
              <LineChart
                data={performanceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Recent Events */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
              overflow: 'auto',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Events
            </Typography>
            <List>
              {recentEvents.map((event) => (
                <div key={event.id}>
                  <ListItem>
                    <ListItemText
                      primary={event.type}
                      secondary={
                        <>
                          {event.module || event.user || event.endpoint || event.message}
                          <Typography component="span" sx={{ ml: 1 }} color="text.secondary">
                            {event.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </div>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Module Status */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Module Status" />
            <CardContent>
              <Grid container spacing={2}>
                {modulesData.map((module) => (
                  <Grid item xs={12} sm={6} md={3} key={module.id}>
                    <Paper
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        borderLeft: 6,
                        borderColor: module.status === 'Active' ? 'success.main' : 'warning.main',
                      }}
                    >
                      <Typography variant="h6">{module.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {module.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Version: {module.version}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 