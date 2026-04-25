/**
 * ─────────────────────────────────────────────────────────────
 * ModalContext.test.jsx
 * Tests for ModalProvider + useModal hook:
 * • Initial state: isOpen=false, modalType=null, modalProps={}
 * • openModal sets isOpen=true, modalType, and modalProps
 * • closeModal resets state to initial
 * • Multiple consecutive openModal calls – last one wins
 * • useModal throws when used outside ModalProvider
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalProvider, useModal } from '../../context/ModalContext';

// ── Consumer component ────────────────────────────────────────
function ModalConsumer() {
  const { isOpen, modalType, modalProps, openModal, closeModal } = useModal();
  return (
    <div>
      <span data-testid="isOpen">{String(isOpen)}</span>
      <span data-testid="type">{modalType ?? 'null'}</span>
      <span data-testid="props">{JSON.stringify(modalProps)}</span>
      <button onClick={() => openModal('taskForm', { task: null })} data-testid="open-task">open task</button>
      <button onClick={() => openModal('projectForm', { project: { id: 'p1' } })} data-testid="open-project">open project</button>
      <button onClick={closeModal} data-testid="close">close</button>
    </div>
  );
}

function renderModal() {
  return render(
    <ModalProvider>
      <ModalConsumer />
    </ModalProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────

describe('ModalContext – initial state', () => {
  test('isOpen is false by default', () => {
    renderModal();
    expect(screen.getByTestId('isOpen').textContent).toBe('false');
  });

  test('modalType is null by default', () => {
    renderModal();
    expect(screen.getByTestId('type').textContent).toBe('null');
  });
});

describe('ModalContext – openModal', () => {
  test('sets isOpen=true and modalType when called', async () => {
    renderModal();
    await userEvent.click(screen.getByTestId('open-task'));
    expect(screen.getByTestId('isOpen').textContent).toBe('true');
    expect(screen.getByTestId('type').textContent).toBe('taskForm');
  });

  test('stores modalProps correctly', async () => {
    renderModal();
    await userEvent.click(screen.getByTestId('open-task'));
    expect(JSON.parse(screen.getByTestId('props').textContent)).toEqual({ task: null });
  });

  test('updating modalType when openModal is called again', async () => {
    renderModal();
    await userEvent.click(screen.getByTestId('open-task'));
    await userEvent.click(screen.getByTestId('open-project'));
    expect(screen.getByTestId('type').textContent).toBe('projectForm');
    expect(JSON.parse(screen.getByTestId('props').textContent)).toEqual({ project: { id: 'p1' } });
  });
});

describe('ModalContext – closeModal', () => {
  test('resets isOpen to false', async () => {
    renderModal();
    await userEvent.click(screen.getByTestId('open-task'));
    expect(screen.getByTestId('isOpen').textContent).toBe('true');

    await userEvent.click(screen.getByTestId('close'));
    expect(screen.getByTestId('isOpen').textContent).toBe('false');
  });

  test('resets modalType to null after close', async () => {
    renderModal();
    await userEvent.click(screen.getByTestId('open-project'));
    await userEvent.click(screen.getByTestId('close'));
    expect(screen.getByTestId('type').textContent).toBe('null');
  });
});

describe('ModalContext – useModal outside provider', () => {
  test('throws when used outside ModalProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
    function Bad() { useModal(); return null; }

    expect(() => render(<Bad />)).toThrow();

    spy.mockRestore();
  });
});