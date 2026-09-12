import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {Alert, Snackbar} from '@mui/material';

const ToastContext = createContext(null);

export function ToastProvider({children}) {
  const [toast, setToast] = useState({open: false, message: '', severity: 'success'});

  const showToast = useCallback((message, severity = 'success') => {
    setToast({open: true, message, severity});
  }, []);

  const closeToast = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setToast((current) => ({...current, open: false}));
  }, []);

  const value = useMemo(() => ({showToast}), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar open={toast.open} autoHideDuration={4200} onClose={closeToast} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{width: '100%'}}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
