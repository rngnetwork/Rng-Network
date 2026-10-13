import './testHelper';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ColorPicker, hexToInt, intToHex } from '@/components/common/input/ColorPicker';

describe('ColorPicker', () => {
  it('converts hex to 24-bit bounded integer and back accurately', () => {
    expect(hexToInt('#E11D2E')).toBe(14753070);
    expect(intToHex(14753070)).toBe('#E11D2E');
    expect(hexToInt('#000000')).toBe(0);
    expect(hexToInt('#FFFFFF')).toBe(16777215);

    // Bounded between 0 and 16777215
    expect(hexToInt('invalid')).toBe(14753070); // default
  });

  it('renders current color button and opens preset dialog', () => {
    const onChange = vi.fn();
    render(<ColorPicker color="#E11D2E" onChange={onChange} label="Accent Color" />);

    expect(screen.getByText('Accent Color')).toBeInTheDocument();
    const pickerBtn = screen.getByRole('button', { name: /open color picker/i });
    expect(pickerBtn).toBeInTheDocument();

    fireEvent.click(pickerBtn);
    expect(screen.getByText('Presets')).toBeInTheDocument();
    expect(screen.getByText('Custom Hex')).toBeInTheDocument();
  });

  it('selects preset color and invokes onChange with hex and int', () => {
    const onChange = vi.fn();
    render(<ColorPicker color="#E11D2E" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /open color picker/i }));
    const blurplePreset = screen.getByRole('button', { name: /preset #5865F2/i });
    fireEvent.click(blurplePreset);

    expect(onChange).toHaveBeenCalledWith('#5865F2', hexToInt('#5865F2'));
  });

  it('handles custom hex input and validates upon blur', () => {
    const onChange = vi.fn();
    render(<ColorPicker color="#E11D2E" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /open color picker/i }));
    const hexInput = screen.getByPlaceholderText('#E11D2E');

    fireEvent.change(hexInput, { target: { value: '57F287' } });
    fireEvent.blur(hexInput);
    expect(onChange).toHaveBeenCalledWith('#57F287', hexToInt('#57F287'));

    // Invalid hex blur resets to #E11D2E
    fireEvent.change(hexInput, { target: { value: 'invalid-hex' } });
    fireEvent.blur(hexInput);
    expect(onChange).toHaveBeenCalledWith('#E11D2E', 14753070);
  });
});
