import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StatCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  minHeight: 120,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}));

const TransferPortal = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    console.log('TransferPortal component mounted');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Fetching stats from API endpoint: /api/transfer-portal/stats');
      setLoading(true);
      
      const response = await fetch('/api/transfer-portal/stats');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched data:', data);
      
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(`Failed to fetch transfer portal statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', m: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Transfer Portal
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Track and analyze player transfers in real-time
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h6">Total Transfers</Typography>
            <Typography variant="h4">{stats?.summary?.total_transfers || 0}</Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h6">Available</Typography>
            <Typography variant="h4">{stats?.summary?.available_transfers || 0}</Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h6">Committed</Typography>
            <Typography variant="h4">{stats?.summary?.committed_transfers || 0}</Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h6">Withdrawn</Typography>
            <Typography variant="h4">{stats?.summary?.withdrawn_transfers || 0}</Typography>
          </StatCard>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'right' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </Button>
      </Box>

      {showDebug && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
          <Typography variant="h6">Debug Information</Typography>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default TransferPortal; 