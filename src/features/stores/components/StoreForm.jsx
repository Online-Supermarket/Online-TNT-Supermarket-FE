import {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
} from '@mui/material';
import {Save} from 'lucide-react';
import {getErrorMessage, getValidationErrors} from '../utils/storeApiErrors';

const emptyValues = {
  storeCode: '',
  storeName: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'Sri Lanka',
  },
  contactNumber: '',
  email: '',
  isActive: true,
};

const fromStore = (store) => ({
  storeCode: store?.storeCode || '',
  storeName: store?.storeName || '',
  address: {
    line1: store?.address?.line1 || '',
    line2: store?.address?.line2 || '',
    city: store?.address?.city || '',
    postalCode: store?.address?.postalCode || '',
    country: store?.address?.country || 'Sri Lanka',
  },
  contactNumber: store?.contactNumber || '',
  email: store?.email || '',
  isActive: store?.isActive ?? true,
});

const validate = (values) => {
  const errors = {};
  if (!values.storeCode.trim()) errors.storeCode = 'Store code is required.';
  if (!values.storeName.trim()) errors.storeName = 'Store name is required.';
  if (!values.address.line1.trim()) errors['address.line1'] = 'Address line 1 is required.';
  if (!values.address.city.trim()) errors['address.city'] = 'City is required.';
  if (!values.address.postalCode.trim()) errors['address.postalCode'] = 'Postal code is required.';
  if (!values.address.country.trim()) errors['address.country'] = 'Country is required.';
  if (!values.contactNumber.trim()) errors.contactNumber = 'Contact number is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.';
  return errors;
};

export default function StoreForm({mode = 'create', initialStore, loadingInitial, submitting, serverError, onSubmit, onCancel}) {
  const initialValues = useMemo(() => initialStore ? fromStore(initialStore) : emptyValues, [initialStore]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (serverError?.response?.status === 400) {
      setErrors((current) => ({...current, ...getValidationErrors(serverError)}));
    }
  }, [serverError]);

  const setField = (field, value) => {
    setValues((current) => ({...current, [field]: value}));
    setErrors((current) => ({...current, [field]: ''}));
  };

  const setAddressField = (field, value) => {
    setValues((current) => ({...current, address: {...current.address, [field]: value}}));
    setErrors((current) => ({...current, [`address.${field}`]: ''}));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(values);
  };

  if (loadingInitial) {
    return (
      <section className="panel store-form-loading">
        <CircularProgress size={30}/>
      </section>
    );
  }

  return (
    <Paper component="form" className="store-form" onSubmit={handleSubmit} elevation={0}>
      {serverError && (
        <Alert severity="error" sx={{mb: 3}}>
          {getErrorMessage(serverError, `Unable to ${mode === 'edit' ? 'update' : 'create'} store.`)}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <TextField fullWidth required label="StoreCode" value={values.storeCode} onChange={(e) => setField('storeCode', e.target.value)} error={Boolean(errors.storeCode)} helperText={errors.storeCode}/>
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField fullWidth required label="StoreName" value={values.storeName} onChange={(e) => setField('storeName', e.target.value)} error={Boolean(errors.storeName)} helperText={errors.storeName}/>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth required label="Address line 1" value={values.address.line1} onChange={(e) => setAddressField('line1', e.target.value)} error={Boolean(errors['address.line1'])} helperText={errors['address.line1']}/>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address line 2" value={values.address.line2} onChange={(e) => setAddressField('line2', e.target.value)}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth required label="City" value={values.address.city} onChange={(e) => setAddressField('city', e.target.value)} error={Boolean(errors['address.city'])} helperText={errors['address.city']}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth required label="PostalCode" value={values.address.postalCode} onChange={(e) => setAddressField('postalCode', e.target.value)} error={Boolean(errors['address.postalCode'])} helperText={errors['address.postalCode']}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth required label="Country" value={values.address.country} onChange={(e) => setAddressField('country', e.target.value)} error={Boolean(errors['address.country'])} helperText={errors['address.country']}/>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth required label="ContactNumber" value={values.contactNumber} onChange={(e) => setField('contactNumber', e.target.value)} error={Boolean(errors.contactNumber)} helperText={errors.contactNumber}/>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth required label="Email" type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} error={Boolean(errors.email)} helperText={errors.email}/>
        </Grid>
      </Grid>

      <Box className="store-form-actions">
        <FormControlLabel control={<Switch checked={values.isActive} onChange={(e) => setField('isActive', e.target.checked)}/>} label="Active"/>
        <Box sx={{display: 'flex', gap: 1}}>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress color="inherit" size={16}/> : <Save size={16}/>}>
            {mode === 'edit' ? 'Update Store' : 'Create Store'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
