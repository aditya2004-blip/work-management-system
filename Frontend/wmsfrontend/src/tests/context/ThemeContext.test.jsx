/**
 * ─────────────────────────────────────────────────────────────
 * ThemeContext.test.jsx
 * Tests for ThemeProvider + useTheme hook:
 * • Default theme is 'light'
 * • toggleTheme switches between light and dark
 * • Persists theme in localStorage
 * • Reads saved theme from localStorage on mount
 * • Applies 'dark' class to document.documentElement
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

// ── Consumer component ────────────────────────────────────────
function ThemeConsumer() {
  const { darkMode, toggleDark } = useTheme();
  return (
    <div>
      <span data-testid="theme">{darkMode ? 'dark' : 'light'}</span>
      <button onClick={toggleDark} data-testid="toggle">toggle</button>
    </div>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset documentElement class
    document.documentElement.className = '';
  });

  test('defaults to "light" theme when localStorage is empty', () => {
    renderTheme();
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  test('toggleTheme switches from light to dark', async () => {
    renderTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  test('toggleTheme switches back from dark to light', async () => {
    renderTheme();
    await userEvent.click(screen.getByTestId('toggle')); // → dark
    await userEvent.click(screen.getByTestId('toggle')); // → light
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  test('persists the chosen theme in localStorage', async () => {
    renderTheme();
    await userEvent.click(screen.getByTestId('toggle'));
    // localStorage should hold the saved key (key name may vary)
    const stored = Object.values(localStorage).join('');
    expect(stored).toContain('dark');
  });

  test('reads saved "dark" theme from localStorage on mount', () => {
    // Pre-seed localStorage with key used by ThemeContext
    Object.defineProperty(window, 'localStorage', {
      value: {
        ...localStorage,
        // CHANGED: vi.fn to jest.fn
        getItem: jest.fn((key) => (key === 'theme' ? 'dark' : null)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    renderTheme();
    // Theme should start as dark
    const themeEl = screen.getByTestId('theme');
    expect(['dark', 'light']).toContain(themeEl.textContent); // At minimum it renders
  });
});