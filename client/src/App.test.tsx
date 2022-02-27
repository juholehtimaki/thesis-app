import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

<<<<<<< HEAD
test('Render note header', () => {
=======
test("Render note header", () => {
>>>>>>> origin/main
  render(<App />);
  const linkElement = screen.getByText(/Submit a new note:/i);
  expect(linkElement).toBeInTheDocument();
});
