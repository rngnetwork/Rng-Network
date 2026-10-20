import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../feedback/Modal';
import { Toast } from '../feedback/Toast';
import { ToastProvider, useToast } from '../feedback/ToastProvider';
import { ProgressBar } from '../feedback/ProgressBar';
import { Tooltip } from '../feedback/Tooltip';
import { Badge } from '../feedback/Badge';
import { Avatar } from '../feedback/Avatar';
import { Alert } from '../feedback/Alert';
import { RngLoadingSpinner } from '../feedback/RngLoadingSpinner';

describe('Common Feedback Controls', () => {
  describe('Modal', () => {
    it('renders title, children, footer and handles close', () => {
      const onClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Confirm Action"
          description="Are you sure you want to promote this operator?"
          footer={<button onClick={onClose}>Done</button>}
        >
          <div>Modal Body Content</div>
        </Modal>
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();

      const closeBtn = screen.getByLabelText('Close dialog');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()}>
          <div>Hidden Content</div>
        </Modal>
      );
      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });
  });

  describe('Toast & ToastProvider', () => {
    it('renders toast message and triggers dismissal', () => {
      const onDismiss = vi.fn();
      render(
        <Toast
          id="t1"
          type="success"
          title="Dispatch Scheduled"
          description="Embed queued for 18:00 UTC"
          duration={0}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('Dispatch Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Embed queued for 18:00 UTC')).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText('Dismiss toast');
      fireEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalledWith('t1');
    });

    it('dispatches toast via ToastProvider context hook', () => {
      const TestConsumer = () => {
        const { toast } = useToast();
        return (
          <button
            onClick={() =>
              toast({
                type: 'info',
                title: 'Gateway Reconnected',
              })
            }
          >
            Trigger Toast
          </button>
        );
      };

      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      const triggerBtn = screen.getByRole('button', { name: 'Trigger Toast' });
      fireEvent.click(triggerBtn);

      expect(screen.getByText('Gateway Reconnected')).toBeInTheDocument();
    });
  });

  describe('ProgressBar', () => {
    it('renders progress percentage and accessible attributes', () => {
      render(<ProgressBar value={75} max={100} label="Transfer Status" showValueLabel={true} />);

      expect(screen.getByText('Transfer Status')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();

      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Tooltip', () => {
    it('shows tooltip content on mouse enter and hides on mouse leave', () => {
      render(
        <Tooltip content="Discord Snowflake ID" delay={0}>
          <button>Hover Me</button>
        </Tooltip>
      );

      const target = screen.getByRole('button', { name: 'Hover Me' });
      fireEvent.mouseEnter(target);

      expect(screen.getByRole('tooltip')).toHaveTextContent('Discord Snowflake ID');

      fireEvent.mouseLeave(target);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge variant and status dot', () => {
      render(
        <Badge variant="brand" dot={true}>
          CHIEF HIGH COMMAND
        </Badge>
      );

      expect(screen.getByText('CHIEF HIGH COMMAND')).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('renders user fallback initials and status ring', () => {
      render(<Avatar fallback="Rachit SWE" status="online" size="lg" />);

      expect(screen.getByText('RS')).toBeInTheDocument();
      expect(screen.getByLabelText('Status: online')).toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('renders warning alert with title and dismiss button', () => {
      const onDismiss = vi.fn();
      render(
        <Alert variant="warning" title="Rate Limit Alert" onDismiss={onDismiss}>
          Approaching 5 dispatches per 5 seconds.
        </Alert>
      );

      expect(screen.getByText('Rate Limit Alert')).toBeInTheDocument();
      expect(screen.getByText('Approaching 5 dispatches per 5 seconds.')).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('RngLoadingSpinner', () => {
    it('renders with central RNG RAC logo and status label', () => {
      render(<RngLoadingSpinner size="lg" label="Loading Control Center..." />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading Control Center...')).toBeInTheDocument();
      const logo = screen.getByAltText('RNG RAC Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/assets/LOGO_FOR_STAFFS.png');
    });

    it('renders in fullScreen mode with ambient backdrop elements', () => {
      render(<RngLoadingSpinner fullScreen size="xl" label="Booting..." />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Booting...')).toBeInTheDocument();
      const logo = screen.getByAltText('RNG RAC Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/assets/LOGO_FOR_STAFFS.png');
    });
  });
});
