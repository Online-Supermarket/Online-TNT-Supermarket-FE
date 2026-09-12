import {useNavigate, useParams} from 'react-router-dom';
import StoreForm from '../components/StoreForm';
import {useStore, useUpdateStore} from '../hooks/useStores';
import {toStorePayload} from '../utils/storeData';
import {getErrorMessage} from '../utils/storeApiErrors';
import {useToast} from '../../../components/ToastProvider';

export default function StoreEditPage() {
  const {id} = useParams();
  const navigate = useNavigate();
  const {data: store, isLoading, error} = useStore(id);
  const updateStore = useUpdateStore();
  const {showToast} = useToast();

  const handleSubmit = async (values) => {
    try {
      await updateStore.mutateAsync({id, data: toStorePayload(values)});
      showToast('Store updated successfully.');
      navigate('/admin/stores');
    } catch (mutationError) {
      showToast(getErrorMessage(mutationError, 'Unable to update store.'), 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Store Management</span>
          <h1>Edit Store</h1>
          <p>Update store profile, address, contact details, and status.</p>
        </div>
      </div>
      {error ? (
        <section className="panel error">{getErrorMessage(error, 'Unable to load store.')}</section>
      ) : (
        <StoreForm
          mode="edit"
          initialStore={store}
          loadingInitial={isLoading}
          submitting={updateStore.isPending}
          serverError={updateStore.error}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/stores')}
        />
      )}
    </>
  );
}
