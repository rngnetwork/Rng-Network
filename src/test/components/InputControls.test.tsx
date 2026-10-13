import './testHelper';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '@/components/common/input/Checkbox';
import { RadioButton } from '@/components/common/input/RadioButton';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown } from '@/components/common/input/Dropdown';
import { Slider } from '@/components/common/input/Slider';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { DateTimePicker } from '@/components/common/input/DateTimePicker';
import { Stepper } from '@/components/common/input/Stepper';

describe('Common Input Controls', () => {
  describe('Checkbox', () => {
    it('renders with label and toggles checked state', () => {
      const onChange = vi.fn();
      render(<Checkbox label="Ephemeral Message" checked={false} onChange={onChange} />);

      const cb = screen.getByLabelText('Ephemeral Message');
      expect(cb).not.toBeChecked();

      fireEvent.click(cb);
      expect(onChange).toHaveBeenCalled();
    });

    it('renders error message when provided', () => {
      render(<Checkbox label="Agree" error="You must agree" />);
      expect(screen.getByText('You must agree')).toBeInTheDocument();
    });
  });

  describe('RadioButton', () => {
    it('renders with label and handles selection', () => {
      const onChange = vi.fn();
      render(
        <RadioButton
          name="mode"
          value="text"
          label="Text Message"
          checked={false}
          onChange={onChange}
        />
      );

      const rb = screen.getByLabelText('Text Message');
      expect(rb).not.toBeChecked();

      fireEvent.click(rb);
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('TextInput', () => {
    it('renders label, handles typing and clear button', () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      render(
        <TextInput
          label="Bot Prefix"
          value="!"
          onChange={onChange}
          onClear={onClear}
        />
      );

      expect(screen.getByLabelText('Bot Prefix')).toHaveValue('!');
      const clearBtn = screen.getByLabelText('Clear input');
      fireEvent.click(clearBtn);
      expect(onClear).toHaveBeenCalled();
    });

    it('displays error text', () => {
      render(<TextInput label="Email" error="Invalid email address" />);
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  describe('Dropdown', () => {
    it('opens options list and selects item', () => {
      const onChange = vi.fn();
      const options = [
        { label: 'General', value: 'gen' },
        { label: 'Announcements', value: 'ann' },
      ];

      render(<Dropdown options={options} value="gen" onChange={onChange} label="Channel" />);

      expect(screen.getByText('General')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /channel/i }));

      expect(screen.getByText('Announcements')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Announcements'));
      expect(onChange).toHaveBeenCalledWith('ann');
    });
  });

  describe('Slider', () => {
    it('renders value and triggers onChange on slider slide', () => {
      const onChange = vi.fn();
      render(<Slider min={0} max={100} value={42} onChange={onChange} label="Volume" />);

      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();

      const sliderInput = screen.getByLabelText('Volume');
      fireEvent.change(sliderInput, { target: { value: '80' } });
      expect(onChange).toHaveBeenCalledWith(80);
    });
  });

  describe('ToggleSwitch', () => {
    it('renders and toggles state on click', () => {
      const onChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={onChange} label="Enable 2FA" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(toggle);
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('DateTimePicker', () => {
    it('renders date picker button and opens calendar dialog', () => {
      const testDate = new Date(2026, 9, 10, 14, 30);
      const onChange = vi.fn();
      render(<DateTimePicker value={testDate} onChange={onChange} label="Schedule Dispatch" />);

      expect(screen.getByText('Schedule Dispatch')).toBeInTheDocument();
      const triggerBtn = screen.getByRole('button', { name: /schedule dispatch/i });
      fireEvent.click(triggerBtn);

      expect(screen.getByText(/October 2026/i)).toBeInTheDocument();
    });
  });

  describe('Stepper', () => {
    it('increments and decrements within boundaries', () => {
      const onChange = vi.fn();
      render(<Stepper value={5} min={1} max={10} step={1} onChange={onChange} label="Count" />);

      const decBtn = screen.getByRole('button', { name: /decrement/i });
      const incBtn = screen.getByRole('button', { name: /increment/i });

      fireEvent.click(incBtn);
      expect(onChange).toHaveBeenCalledWith(6);

      fireEvent.click(decBtn);
      expect(onChange).toHaveBeenCalledWith(4);
    });
  });
});
