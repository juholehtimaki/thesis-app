import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('Render note header', () => {
  render(<App />);
  const linkElement = screen.getByText(/Submit a new note:sss/i);
  expect(linkElement).toBeInTheDocument();
});
