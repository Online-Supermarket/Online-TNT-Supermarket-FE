import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('authentication forms', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  it('renders the login form', () => {
    vi.mocked(useAuth).mockReturnValue({ login: vi.fn() });

    render(<MemoryRouter><Login /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /sign in to tnt/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('renders the registration form', () => {
    vi.mocked(useAuth).mockReturnValue({ register: vi.fn() });

    render(<MemoryRouter><Register /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/john\.doe@example\.com/i)).toBeInTheDocument();
  });

  it('shows client-side validation for weak registration passwords', () => {
    vi.mocked(useAuth).mockReturnValue({ register: vi.fn() });

    render(<MemoryRouter><Register /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/john\.doe@example\.com/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+1 234 567 8900/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText(/at least 8 chars/i), {
      target: { value: 'weak' },
    });
    fireEvent.change(screen.getByPlaceholderText(/repeat password/i), {
      target: { value: 'weak' },
    });
    fireEvent.change(screen.getByPlaceholderText(/123 main st/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByPlaceholderText(/colombo/i), {
      target: { value: 'Colombo' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create customer account/i }));

    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
  });
});
