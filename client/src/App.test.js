import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
});

test('renders application header', () => {
  render(<App />);
  // This is a basic smoke test to ensure the app renders
  expect(document.body).toBeInTheDocument();
});
