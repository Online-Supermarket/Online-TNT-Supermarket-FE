import {useState} from 'react';
import ActivateDeactivateConfirmDialog from '../components/ActivateDeactivateConfirmDialog';
import StoreList from '../components/StoreList';
import {useActivateStore, useDeactivateStore} from '../hooks/useStores';
import {getErrorMessage} from '../utils/storeApiErrors';
import {useToast} from '../../../components/ToastProvider';

export default function StoreListPage() {
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
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to change store status.'), 'error');
    }
  };

  return (
    <>
      <StoreList onStatusClick={setSelectedStore}/>
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
