import {useNavigate} from 'react-router-dom';
import StoreForm from '../components/StoreForm';
import {useCreateStore} from '../hooks/useStores';
import {toStorePayload} from '../utils/storeData';
import {getErrorMessage} from '../utils/storeApiErrors';
import {useToast} from '../../../components/ToastProvider';

export default function StoreCreatePage() {
  const navigate = useNavigate();
  const createStore = useCreateStore();
  const {showToast} = useToast();

  const handleSubmit = async (values) => {
    try {
      await createStore.mutateAsync(toStorePayload(values));
      showToast('Store created successfully.');
      navigate('/admin/stores');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to create store.'), 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Store Management</span>
          <h1>Create Store</h1>
          <p>Add a new TNT Supermarket branch to the Store service.</p>
        </div>
      </div>
      <StoreForm
        mode="create"
        submitting={createStore.isPending}
        serverError={createStore.error}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/stores')}
      />
    </>
  );
}
