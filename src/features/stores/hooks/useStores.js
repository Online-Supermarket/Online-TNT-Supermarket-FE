import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {storesApi} from '../api/stores';
import {normalizeStore, normalizeStoreList} from '../utils/storeData';

export const storeKeys = {
  all: ['stores'],
  lists: () => [...storeKeys.all, 'list'],
  list: (params) => [...storeKeys.lists(), params],
  detail: (id) => [...storeKeys.all, 'detail', id],
};

export const useStores = (params) => useQuery({
  queryKey: storeKeys.list(params),
  queryFn: () => storesApi.getStores(params).then(normalizeStoreList),
  keepPreviousData: true,
});

export const useStore = (id) => useQuery({
  queryKey: storeKeys.detail(id),
  queryFn: () => storesApi.getStore(id).then(normalizeStore),
  enabled: Boolean(id),
});

export const useCreateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storesApi.createStore,
    onSuccess: () => queryClient.invalidateQueries({queryKey: storeKeys.lists()}),
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}) => storesApi.updateStore(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: storeKeys.lists()});
      queryClient.invalidateQueries({queryKey: storeKeys.detail(variables.id)});
    },
  });
};

export const useActivateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storesApi.activateStore,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({queryKey: storeKeys.lists()});
      queryClient.invalidateQueries({queryKey: storeKeys.detail(id)});
    },
  });
};

export const useDeactivateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storesApi.deactivateStore,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({queryKey: storeKeys.lists()});
      queryClient.invalidateQueries({queryKey: storeKeys.detail(id)});
    },
  });
};
