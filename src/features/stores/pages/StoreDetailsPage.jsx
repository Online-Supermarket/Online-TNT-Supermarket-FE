import {useState} from 'react';
import {Button} from '@mui/material';
import {ArrowLeft} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import ActivateDeactivateConfirmDialog from '../components/ActivateDeactivateConfirmDialog';
import StoreDetails from '../components/StoreDetails';
import {useActivateStore, useDeactivateStore, useStore} from '../hooks/useStores';
import {getErrorMessage} from '../utils/storeApiErrors';
import {useToast} from '../../../components/ToastProvider';

export default function StoreDetailsPage() {
  const {id} = useParams();
  const {data: store, isLoading, error} = useStore(id);
  const [selectedStore, setSelectedStore] = useState(null);
  const {showToast} = useToast();
  const activateStore = useActivateStore();
  const deactivateStore = useDeactivateStore();
  const statusMutation = selectedStore?.isActive ? deactivateStore : activateStore;

  const handleConfirm = async () => {
    try {
      await statusMutation.mutateAsync(selectedStore.id);
      showToast(`${selectedStore.storeName} ${selectedStore.isActive ? 'deactivated' : 'activated'} successfully.`);
      setSelectedStore(null);
    } catch (mutationError) {
      showToast(getErrorMessage(mutationError, 'Unable to change store status.'), 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Store Management</span>
          <h1>Store Details</h1>
          <p>Review branch information from the Store Management service.</p>
        </div>
        <Button component={Link} to="/admin/stores" variant="outlined" startIcon={<ArrowLeft size={16}/>}>Back</Button>
      </div>
      <StoreDetails store={store} loading={isLoading} error={error} onStatusClick={setSelectedStore}/>
      <ActivateDeactivateConfirmDialog
        open={Boolean(selectedStore)}
        store={selectedStore}
        loading={statusMutation.isPending}
        onClose={() => setSelectedStore(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
