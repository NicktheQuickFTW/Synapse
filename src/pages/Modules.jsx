import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

// Sample data for modules
const initialModules = [
  {
    id: 1,
    name: 'Transfer Portal Tracker',
    description: 'Manages athlete transfer portal data and analytics',
    status: 'active',
    version: '1.2.3',
    repo_url: 'https://github.com/xii-os/transfer-portal-tracker',
  },
  {
    id: 2,
    name: 'Flextime',
    description: 'Flextime management system for scheduling and calendar optimization',
    status: 'active',
    version: '2.0.1',
    repo_url: 'https://github.com/xii-os/flextime',
  },
  {
    id: 3,
    name: 'Weather Intelligence',
    description: 'Weather forecasting and environmental data analysis',
    status: 'inactive',
    version: '0.9.5',
    repo_url: 'https://github.com/xii-os/weather-intelligence',
  },
  {
    id: 4,
    name: 'Content Management',
    description: 'Website and social media content management system',
    status: 'active',
    version: '1.5.0',
    repo_url: 'https://github.com/xii-os/content-management',
  },
];

function ModulesPage() {
  const [modules, setModules] = useState(initialModules);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newModule, setNewModule] = useState({
    name: '',
    description: '',
    repo_url: '',
    version: '1.0.0',
    status: 'inactive'
  });

  const filteredModules = modules.filter((module) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewModule({
      name: '',
      description: '',
      repo_url: '',
      version: '1.0.0',
      status: 'inactive'
    });
  };

  const handleInputChange = (e) => {
    setNewModule({
      ...newModule,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddModule = () => {
    const moduleToAdd = {
      ...newModule,
      id: modules.length + 1,
    };
    
    setModules([...modules, moduleToAdd]);
    handleCloseDialog();
  };

  const toggleModuleStatus = (id) => {
    setModules(modules.map(module => {
      if (module.id === id) {
        return {
          ...module,
          status: module.status === 'active' ? 'inactive' : 'active'
        };
      }
      return module;
    }));
  };

  const deleteModule = (id) => {
    setModules(modules.filter(module => module.id !== id));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Modules Management</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Module
          </Button>
        </Box>
      </Box>
      
      <TextField
        fullWidth
        label="Search Modules"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
      />
      
      <Grid container spacing={3}>
        {filteredModules.map((module) => (
          <Grid item xs={12} md={6} key={module.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h5">{module.name}</Typography>
                  <Chip
                    label={module.status === 'active' ? 'Active' : 'Inactive'}
                    color={module.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Version:</strong> {module.version}
                </Typography>
                <Typography variant="body2">
                  <strong>Repository:</strong> {module.repo_url}
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title="Configure">
                  <IconButton color="primary">
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={module.status === 'active' ? 'Stop' : 'Start'}>
                  <IconButton 
                    color={module.status === 'active' ? 'error' : 'success'}
                    onClick={() => toggleModuleStatus(module.id)}
                  >
                    {module.status === 'active' ? <StopIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete">
                  <IconButton 
                    color="error"
                    onClick={() => deleteModule(module.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Add Module Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Module</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label="Module Name"
              fullWidth
              value={newModule.name}
              onChange={handleInputChange}
            />
            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newModule.description}
              onChange={handleInputChange}
            />
            <TextField
              name="repo_url"
              label="Repository URL"
              fullWidth
              value={newModule.repo_url}
              onChange={handleInputChange}
            />
            <TextField
              name="version"
              label="Version"
              fullWidth
              value={newModule.version}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={newModule.status}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddModule} 
            variant="contained"
            disabled={!newModule.name || !newModule.description || !newModule.repo_url}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ModulesPage; 