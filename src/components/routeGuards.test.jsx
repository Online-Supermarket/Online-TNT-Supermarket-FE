import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('auth route guards', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  it('redirects unauthenticated users to login', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route
            path="/checkout"
            element={<ProtectedRoute><div>Checkout</div></ProtectedRoute>}
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
  });

  it('redirects users away from dashboards for other roles', () => {
    vi.mocked(useAuth).mockReturnValue({ role: 'CUSTOMER', loading: false });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={<RoleRoute roles={['ADMIN']}><div>Admin dashboard</div></RoleRoute>}
          />
          <Route path="/" element={<div>Customer home</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Customer home')).toBeInTheDocument();
    expect(screen.queryByText('Admin dashboard')).not.toBeInTheDocument();
  });
});
