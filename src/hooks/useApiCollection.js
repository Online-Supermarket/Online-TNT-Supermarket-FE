import {useEffect, useState} from 'react';
import api from '../services/api';

export default function useApiCollection(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(path);
        const payload = response.data;
        const rows = Array.isArray(payload) ? payload : payload?.items || payload?.data || [];
        if (active) setData(rows);
      } catch (requestError) {
        if (active) {
          setData([]);
          setError(requestError);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [path]);

  return {data, loading, error};
}
