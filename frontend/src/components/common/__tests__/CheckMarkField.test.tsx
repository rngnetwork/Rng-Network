import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckMarkField } from '../input/CheckMarkField';

describe('CheckMarkField', () => {
  it('renders label and description correctly', () => {
    render(
      <CheckMarkField
        label="Send Panel"
        description="send true to post / re-post the panel in the panel channel (not stored)"
      />
    );

    expect(screen.getByText('Send Panel')).toBeInTheDocument();
    expect(
      screen.getByText('send true to post / re-post the panel in the panel channel (not stored)')
    ).toBeInTheDocument();
  });

  it('renders cancel (X) and confirm (Check) buttons in a pill structure', () => {
    render(<CheckMarkField label="Send Panel" />);

    const cancelBtn = screen.getByRole('button', { name: 'Send Panel - cancel' });
    const executeBtn = screen.getByRole('button', { name: 'Send Panel - execute' });

    expect(cancelBtn).toBeInTheDocument();
    expect(executeBtn).toBeInTheDocument();
    expect(cancelBtn).toHaveAttribute('title', 'Cancel / Idle');
    expect(executeBtn).toHaveAttribute('title', 'Execute Action');
  });

  it('triggers onExecute, onCheck, and onChange(true) on clicking confirm button', async () => {
    const onExecute = vi.fn().mockResolvedValue(undefined);
    const onCheck = vi.fn();
    const onChange = vi.fn();

    render(
      <CheckMarkField
        label="Send Panel"
        onExecute={onExecute}
        onCheck={onCheck}
        onChange={onChange}
      />
    );

    const executeBtn = screen.getByRole('button', { name: 'Send Panel - execute' });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(onCheck).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  it('triggers onCancel and onChange(false) on clicking cancel button', () => {
    const onCancel = vi.fn();
    const onChange = vi.fn();

    render(
      <CheckMarkField
        label="Send Panel"
        onCancel={onCancel}
        onChange={onChange}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Send Panel - cancel' });
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('disables both buttons when disabled prop is true', () => {
    const onExecute = vi.fn();
    const onCancel = vi.fn();

    render(
      <CheckMarkField
        label="Send Panel"
        disabled={true}
        onExecute={onExecute}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Send Panel - cancel' });
    const executeBtn = screen.getByRole('button', { name: 'Send Panel - execute' });

    expect(cancelBtn).toBeDisabled();
    expect(executeBtn).toBeDisabled();

    fireEvent.click(executeBtn);
    fireEvent.click(cancelBtn);

    expect(onExecute).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
