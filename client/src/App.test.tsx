import React from 'react';
import { render, act } from '@testing-library/react';
import App from './App';

// eslint-disable-next-line jest/expect-expect
test('Smoke test for app', async () => {
  await act(async () => {
    render(<App />);
  });
});
