import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, TablePagination, Toolbar
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { getUser } from '../utils/auth';

function ModuleMaster() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [form, setForm] = useState({ Name: '', GroupName: '', is_active: true });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const user = getUser();

  const fetchModules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(`/api/module-master?page=${page + 1}&limit=${rowsPerPage}&search=${encodeURIComponent(search)}`);
      setModules(res.data.data);
      console.log(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, [page, rowsPerPage, search]);

  const handleOpenDialog = (moduleObj = null) => {
    setEditModule(moduleObj);
    setForm(moduleObj ? { Name: moduleObj.Name, GroupName: moduleObj.GroupName, status: moduleObj.is_active } : { Name: '', GroupName: '', is_active: true });
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let res, data;
      if (editModule) {
        res = await apiPut(`/api/module-master/${editModule._id}`, form);
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Update failed');
        setSuccess('Module updated');
      } else {
        res = await apiPost('/api/module-master', form);
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Create failed');
        setSuccess('Module created');
      }
      handleCloseDialog();
      fetchModules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this module?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/api/module-master/${id}`);
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Delete failed');
      setSuccess('Module deleted');
      fetchModules();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. Only administrators can manage modules.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>Module Master</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by name or GroupName"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          size="small"
        />
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Module
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>GroupName</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map(moduleObj => (
              <TableRow key={moduleObj._id} hover>
                <TableCell>{moduleObj.Name}</TableCell>
                <TableCell>{moduleObj.GroupName}</TableCell>
                <TableCell>{moduleObj.is_active.toString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(moduleObj)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(moduleObj._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Name"
              name="Name"
              value={form.Name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="GroupName"
              name="GroupName"
              value={form.GroupName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Status"
              name="is_active"
              select
              value={form.is_active}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editModule ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default ModuleMaster; 