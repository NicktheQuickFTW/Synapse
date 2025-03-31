import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import { format } from 'date-fns';

const TennisTiebreaker = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch('/api/tennis/analysis');
        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <Container>
        <Typography>Loading analysis...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">Error: {error}</Typography>
      </Container>
    );
  }

  if (!analysis) {
    return (
      <Container>
        <Typography>No analysis available</Typography>
      </Container>
    );
  }

  const getSignificanceColor = (significance) => {
    switch (significance) {
      case 'Very High':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Big 12 Women's Tennis Tiebreaker Analysis
        </Typography>

        {/* Current Standings */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Standings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Record</TableCell>
                  <TableCell align="right">Win %</TableCell>
                  <TableCell align="right">ITA Rank</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analysis.currentStandings.map((team) => (
                  <TableRow key={team.name}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell align="right">{`${team.wins}-${team.losses}`}</TableCell>
                    <TableCell align="right">{(team.winPct * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{team.itaRank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Key Matches */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Matches to Watch
          </Typography>
          <Grid container spacing={2}>
            {analysis.keyMatches.map((match) => (
              <Grid item xs={12} md={6} key={`${match.matchup}-${match.date}`}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">{match.matchup}</Typography>
                      <Chip 
                        label={match.significance} 
                        color={getSignificanceColor(match.significance)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(match.date), 'MMM d, yyyy')} • {match.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {match.team1Record} vs {match.team2Record}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.reason}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Team Scenarios */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Team Scenarios
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(analysis.teamScenarios).map(([team, scenario]) => (
              <Grid item xs={12} key={team}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {team}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Current Status</Typography>
                        <Typography>Record: {scenario.currentRecord}</Typography>
                        <Typography>Win %: {(scenario.currentWinPct * 100).toFixed(1)}%</Typography>
                        <Typography>ITA Rank: #{scenario.itaRank}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Best Case</Typography>
                        <Typography>Record: {scenario.bestPossibleRecord}</Typography>
                        <Typography>Win %: {(scenario.bestPossibleWinPct * 100).toFixed(1)}%</Typography>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2">Remaining Matches</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Opponent</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Location</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {scenario.remainingMatches.map((match) => (
                            <TableRow key={`${match.opponent}-${match.date}`}>
                              <TableCell>{match.opponent}</TableCell>
                              <TableCell>{format(new Date(match.date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{match.location}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Seeding Ranges */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Potential Seeding Ranges
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Current Record</TableCell>
                  <TableCell align="right">Best Case</TableCell>
                  <TableCell align="right">Worst Case</TableCell>
                  <TableCell align="right">Potential Seed Range</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(analysis.seedingRanges).map(([team, range]) => (
                  <TableRow key={team}>
                    <TableCell>{team}</TableCell>
                    <TableCell align="right">{range.currentRecord}</TableCell>
                    <TableCell align="right">{range.bestCase.record}</TableCell>
                    <TableCell align="right">{range.worstCase.record}</TableCell>
                    <TableCell align="right">
                      {range.bestCase.potentialSeed === range.worstCase.potentialSeed
                        ? `#${range.bestCase.potentialSeed}`
                        : `#${range.bestCase.potentialSeed}-#${range.worstCase.potentialSeed}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default TennisTiebreaker; 