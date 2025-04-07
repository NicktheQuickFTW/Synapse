import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
  Alert,
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

  useEffect(() => {
    console.log('TransferPortal component mounted - calling fetchStats()');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('⚡ Fetching stats from API endpoint: /api/transfer-portal/stats');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/transfer-portal/stats');
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully fetched data:', data);
      
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      setError(`Failed to fetch transfer portal statistics: ${err.message}`);
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
    <Box className="transfer-portal" sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transfer Portal
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track and analyze player transfers in real-time
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
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

      {/* Debug Information */}
      <Box sx={{ mt: 4, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
        <Typography variant="h6">Debug Information</Typography>
        <pre style={{ overflowX: 'auto' }}>
          {JSON.stringify(stats, null, 2)}
        </pre>
      </Box>
    </Box>
  );
};

export default TransferPortal; 