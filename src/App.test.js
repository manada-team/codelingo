import { render, screen } from '@testing-library/react';
import App from './App';

test('renders codelingo header', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading).toHaveTextContent('Codelingo');
});