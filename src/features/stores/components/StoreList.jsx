import {useMemo, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {Edit, Eye, Plus, Power, Search} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../../context/AuthContext';
import {getErrorMessage} from '../utils/storeApiErrors';
import {useStores} from '../hooks/useStores';

export default function StoreList({onStatusClick}) {
  const {role} = useAuth();
  const isAdmin = String(role || '').toUpperCase() === 'ADMIN';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => ({
    page,
    pageSize,
    search: search.trim() || undefined,
    isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
  }), [activeFilter, page, search]);

  const {data, isLoading, isFetching, error} = useStores(params);
  const stores = data?.stores || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleFilter = (event) => {
    setActiveFilter(event.target.value);
    setPage(1);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Store Management</span>
          <h1>Stores</h1>
          <p>Manage TNT Supermarket branches, contacts, and operational status.</p>
        </div>
        {isAdmin && (
          <Button component={Link} to="/admin/stores/new" variant="contained" startIcon={<Plus size={17}/>}>
            Create Store
          </Button>
        )}
      </div>

      <section className="panel store-panel">
        <Box className="store-toolbar">
          <TextField
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or code"
            size="small"
            InputProps={{startAdornment: <Search size={17} className="store-input-icon"/>}}
            sx={{minWidth: {xs: '100%', md: 320}}}
          />
          <FormControl size="small" sx={{minWidth: {xs: '100%', sm: 170}}}>
            <InputLabel id="store-status-filter">Status</InputLabel>
            <Select labelId="store-status-filter" value={activeFilter} label="Status" onChange={handleFilter}>
              <MenuItem value="all">All stores</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{mb: 2}}>{getErrorMessage(error, 'Unable to load stores.')}</Alert>}

        {isMobile ? (
          <div className="store-card-grid">
            {isLoading && Array.from({length: 4}).map((_, index) => <Skeleton key={index} variant="rounded" height={180}/>)}
            {!isLoading && stores.map((store) => (
              <Card key={store.id} variant="outlined" className="store-card">
                <CardContent>
                  <div className="store-card-head">
                    <div>
                      <small>{store.storeCode}</small>
                      <h3>{store.storeName}</h3>
                    </div>
                    <Chip size="small" label={store.isActive ? 'Active' : 'Inactive'} color={store.isActive ? 'success' : 'default'}/>
                  </div>
                  <p>{store.address.city || 'No city listed'}</p>
                  <p>{store.contactNumber || '-'} · {store.email || '-'}</p>
                </CardContent>
                <CardActions>
                  <Button component={Link} to={`/admin/stores/${store.id}`} size="small">View</Button>
                  <Button component={Link} to={`/admin/stores/${store.id}/edit`} size="small">Edit</Button>
                  <Button color={store.isActive ? 'error' : 'success'} size="small" onClick={() => onStatusClick(store)}>
                    {store.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </div>
        ) : (
          <TableContainer className="store-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>StoreCode</TableCell>
                  <TableCell>StoreName</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>ContactNumber</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && Array.from({length: 5}).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({length: 7}).map((__, cellIndex) => <TableCell key={cellIndex}><Skeleton/></TableCell>)}
                  </TableRow>
                ))}
                {!isLoading && stores.map((store) => (
                  <TableRow key={store.id} hover>
                    <TableCell><strong>{store.storeCode}</strong></TableCell>
                    <TableCell>{store.storeName}</TableCell>
                    <TableCell>{store.address.city || '-'}</TableCell>
                    <TableCell>{store.contactNumber || '-'}</TableCell>
                    <TableCell>{store.email || '-'}</TableCell>
                    <TableCell><Chip size="small" label={store.isActive ? 'Active' : 'Inactive'} color={store.isActive ? 'success' : 'default'}/></TableCell>
                    <TableCell align="right">
                      <Tooltip title="View details"><IconButton component={Link} to={`/admin/stores/${store.id}`}><Eye size={17}/></IconButton></Tooltip>
                      <Tooltip title="Edit store"><IconButton component={Link} to={`/admin/stores/${store.id}/edit`}><Edit size={17}/></IconButton></Tooltip>
                      <Tooltip title={store.isActive ? 'Deactivate store' : 'Activate store'}>
                        <IconButton color={store.isActive ? 'error' : 'success'} onClick={() => onStatusClick(store)}><Power size={17}/></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && stores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No stores found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box className="store-pagination">
          {isFetching && !isLoading && <CircularProgress size={18}/>}
          <Pagination count={totalPages} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary"/>
        </Box>
      </section>
    </>
  );
}
