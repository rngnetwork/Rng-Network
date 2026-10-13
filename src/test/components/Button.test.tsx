import './testHelper';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/common/input/Button';

describe('Button', () => {
  it('renders primary variant with crimson background', () => {
    render(<Button variant="primary">Dispatch</Button>);
    const btn = screen.getByRole('button', { name: /dispatch/i });
    expect(btn).toHaveClass('bg-brand-red');
  });

  it('displays loading spinner and disables click when loading is true', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Dispatch</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders secondary, ghost, and danger variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-surface-elevated');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent-danger');
  });
});
