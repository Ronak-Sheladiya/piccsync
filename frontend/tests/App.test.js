import { render, screen } from '@testing-library/react';
import App from '../src/App';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  })
}));

test('renders loading initially', () => {
  render(<App />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});