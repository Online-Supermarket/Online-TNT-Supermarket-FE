import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@mui/material';

export default function ActivateDeactivateConfirmDialog({open, store, loading, onClose, onConfirm}) {
  const nextAction = store?.isActive ? 'deactivate' : 'activate';

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{store?.isActive ? 'Deactivate store' : 'Activate store'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to {nextAction} {store?.storeName || 'this store'}?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color={store?.isActive ? 'error' : 'success'} disabled={loading}>
          {loading ? 'Saving...' : store?.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
