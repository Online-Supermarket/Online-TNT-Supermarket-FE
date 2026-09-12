import {Alert, Button, Chip, CircularProgress, Divider} from '@mui/material';
import {Edit, Power} from 'lucide-react';
import {Link} from 'react-router-dom';
import {getErrorMessage} from '../utils/storeApiErrors';

export default function StoreDetails({store, loading, error, onStatusClick}) {
  if (loading) {
    return <section className="panel store-details"><CircularProgress size={30}/></section>;
  }

  if (error) {
    return <Alert severity="error">{getErrorMessage(error, 'Unable to load store details.')}</Alert>;
  }

  if (!store) return null;

  return (
    <section className="panel store-details">
      <div className="store-details-head">
        <div>
          <span className="eyebrow">{store.storeCode}</span>
          <h2>{store.storeName}</h2>
          <Chip size="small" label={store.isActive ? 'Active' : 'Inactive'} color={store.isActive ? 'success' : 'default'}/>
        </div>
        <div className="button-row">
          <Button component={Link} to={`/admin/stores/${store.id}/edit`} variant="outlined" startIcon={<Edit size={16}/>}>Edit</Button>
          <Button variant={store.isActive ? 'outlined' : 'contained'} color={store.isActive ? 'error' : 'success'} onClick={() => onStatusClick(store)} startIcon={<Power size={16}/>}>
            {store.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>
      <Divider sx={{my: 3}}/>
      <div className="store-detail-grid">
        <div><small>City</small><strong>{store.address.city || '-'}</strong></div>
        <div><small>ContactNumber</small><strong>{store.contactNumber || '-'}</strong></div>
        <div><small>Email</small><strong>{store.email || '-'}</strong></div>
        <div><small>Address</small><strong>{[store.address.line1, store.address.line2, store.address.postalCode, store.address.country].filter(Boolean).join(', ') || '-'}</strong></div>
      </div>
    </section>
  );
}
