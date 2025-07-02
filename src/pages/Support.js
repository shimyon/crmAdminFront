import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, TablePagination, TableSortLabel, Checkbox, Toolbar
} from '@mui/material';
import { Add, Edit, Delete, Settings } from '@mui/icons-material';
import { getToken, getUser } from '../utils/auth';
import Menu from '@mui/material/Menu';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

const statusOptions = ['open', 'pending', 'closed'];

function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '', status: 'open' });
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('subject');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);

  const defaultColumns = [
    { id: 'subject', label: 'Subject', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'user', label: 'User', visible: true },
    { id: 'createdAt', label: 'Created', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ];
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('supportTableColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const handleColumnsClick = (e) => setAnchorEl(e.currentTarget);
  const handleColumnsClose = () => setAnchorEl(null);
  const handleColumnToggle = (id) => {
    const newCols = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    setColumns(newCols);
    localStorage.setItem('supportTableColumns', JSON.stringify(newCols));
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const url = isAdmin ? '/api/support' : '/api/support/me';
      const res = await apiGet(url);
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleOpenDialog = (ticket = null) => {
    setEditTicket(ticket);
    setForm(ticket ? {
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
    } : { subject: '', message: '', status: 'open' });
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
      if (editTicket && isAdmin) {
        res = await apiPut(`/api/support/${editTicket._id}`, { status: form.status });
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Update failed');
        setSuccess('Ticket updated');
      } else {
        res = await apiPost('/api/support', { subject: form.subject, message: form.message });
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Create failed');
        setSuccess('Ticket created');
      }
      handleCloseDialog();
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this ticket?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/api/support/${id}`);
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Delete failed');
      setSuccess('Ticket deleted');
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  // Sorting logic
  function sortComparator(a, b) {
    let valA = a[orderBy];
    let valB = b[orderBy];
    if (orderBy === 'createdAt') {
      valA = valA || '';
      valB = valB || '';
    } else {
      valA = valA?.toLowerCase?.() || '';
      valB = valB?.toLowerCase?.() || '';
    }
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  }

  // Filtered and sorted tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  }).sort(sortComparator);
  // Paginated tickets
  const paginatedTickets = filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  function exportToCSV(data, filename) {
    const csvRows = [];
    const headers = ['Subject', 'Message', 'Status', 'User', 'Created'];
    csvRows.push(headers.join(','));
    for (const ticket of data) {
      csvRows.push([
        '"' + ticket.subject.replace(/"/g, '""') + '"',
        '"' + ticket.message.replace(/"/g, '""') + '"',
        '"' + ticket.status.replace(/"/g, '""') + '"',
        '"' + (ticket.user?.name || ticket.user || '').replace(/"/g, '""') + '"',
        '"' + (ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '') + '"',
      ].join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected tickets?')) return;
    setError('');
    setSuccess('');
    try {
      for (const id of selected) {
        await apiDelete(`/api/support/${id}`);
      }
      setSuccess('Selected tickets deleted');
      setSelected([]);
      fetchTickets();
    } catch (err) {
      setError('Bulk delete failed');
    }
  };

  const isSelected = id => selected.indexOf(id) !== -1;
  const handleSelectAllClick = e => {
    if (e.target.checked) {
      const newSelected = paginatedTickets.map(t => t._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };
  const handleClick = (e, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Support</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by subject"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <TextField
          label="Status"
          select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={() => exportToCSV(filteredTickets, 'support_tickets.csv')}>
          Export CSV
        </Button>
        <IconButton onClick={handleColumnsClick} title="Customize columns"><Settings /></IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleColumnsClose}>
          {columns.map(col => (
            <MenuItem key={col.id} onClick={() => handleColumnToggle(col.id)}>
              <Checkbox checked={col.visible} />
              {col.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {!isAdmin && (
        <Button variant="contained" startIcon={<Add />} sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
          New Ticket
        </Button>
      )}
      {isAdmin && selected.length > 0 && (
        <Toolbar sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }}>
          <Typography sx={{ flex: 1 }}>{selected.length} selected</Typography>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>Delete Selected</Button>
        </Toolbar>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.find(c => c.id === 'subject' && c.visible) && <TableCell>Subject</TableCell>}
              {columns.find(c => c.id === 'status' && c.visible) && <TableCell>Status</TableCell>}
              {isAdmin && columns.find(c => c.id === 'user' && c.visible) && <TableCell>User</TableCell>}
              {columns.find(c => c.id === 'createdAt' && c.visible) && <TableCell>Created</TableCell>}
              {isAdmin && columns.find(c => c.id === 'actions' && c.visible) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTickets.map(ticket => {
              const isItemSelected = isSelected(ticket._id);
              return (
                <TableRow
                  key={ticket._id}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  onClick={e => handleClick(e, ticket._id)}
                  selected={isItemSelected}
                >
                  {columns.find(c => c.id === 'subject' && c.visible) && <TableCell>{ticket.subject}</TableCell>}
                  {columns.find(c => c.id === 'status' && c.visible) && <TableCell>{ticket.status}</TableCell>}
                  {isAdmin && columns.find(c => c.id === 'user' && c.visible) && <TableCell>{ticket.user?.name || ticket.user}</TableCell>}
                  {columns.find(c => c.id === 'createdAt' && c.visible) && <TableCell>{ticket.createdAt ? ticket.createdAt.slice(0, 10) : ''}</TableCell>}
                  {isAdmin && columns.find(c => c.id === 'actions' && c.visible) && (
                    <TableCell align="right">
                      <IconButton onClick={e => { e.stopPropagation(); handleOpenDialog(ticket); }}><Edit /></IconButton>
                      <IconButton onClick={e => { e.stopPropagation(); handleDelete(ticket._id); }}><Delete /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredTickets.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editTicket && isAdmin ? 'Update Ticket Status' : 'New Ticket'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {(!editTicket || !isAdmin) && (
              <TextField
                label="Subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                disabled={!!editTicket}
              />
            )}
            {(!editTicket || !isAdmin) && (
              <TextField
                label="Message"
                name="message"
                value={form.message}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                multiline
                minRows={2}
                disabled={!!editTicket}
              />
            )}
            {((editTicket && isAdmin) || isAdmin) && (
              <TextField
                label="Status"
                name="status"
                select
                value={form.status}
                onChange={handleChange}
                fullWidth
                margin="normal"
              >
                {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editTicket && isAdmin ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Support; 