import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from '../containers/Card';
import { Carousel } from '../containers/Carousel';
import { Table, ColumnDef } from '../containers/Table';
import { List, ListItemProps } from '../containers/List';

describe('Common Containers Controls', () => {
  describe('Card', () => {
    it('renders children and handles click event', () => {
      const onClick = vi.fn();
      render(
        <Card hoverable onClick={onClick}>
          <div>Server Card Content</div>
        </Card>
      );

      expect(screen.getByText('Server Card Content')).toBeInTheDocument();
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Carousel', () => {
    it('renders slides and navigates with next/prev buttons', () => {
      const items = [
        <div key="1">Slide 1</div>,
        <div key="2">Slide 2</div>,
        <div key="3">Slide 3</div>,
      ];

      render(<Carousel items={items} />);

      expect(screen.getByText('Slide 1')).toBeInTheDocument();
      expect(screen.getByText('Slide 2')).toBeInTheDocument();

      const nextBtn = screen.getByLabelText('Next slide');
      fireEvent.click(nextBtn);

      const prevBtn = screen.getByLabelText('Previous slide');
      fireEvent.click(prevBtn);
    });
  });

  describe('Table', () => {
    interface ServerRow extends Record<string, unknown> {
      id: string;
      name: string;
      members: number;
    }

    const columns: ColumnDef<ServerRow>[] = [
      { header: 'Server Name', accessorKey: 'name', sortable: true },
      { header: 'Members', accessorKey: 'members', sortable: true },
    ];

    const data: ServerRow[] = [
      { id: '1', name: 'RNG High Command', members: 1200 },
      { id: '2', name: 'Alpha Squad', members: 450 },
    ];

    it('renders table columns, rows, and handles sorting', () => {
      render(<Table data={data} columns={columns} />);

      expect(screen.getByText('Server Name')).toBeInTheDocument();
      expect(screen.getByText('RNG High Command')).toBeInTheDocument();
      expect(screen.getByText('Alpha Squad')).toBeInTheDocument();

      // Click sort header
      const nameHeader = screen.getByText('Server Name');
      fireEvent.click(nameHeader);
    });

    it('displays loading indicator when loading is true', () => {
      render(<Table data={[]} columns={columns} loading={true} />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('displays emptyState when data is empty', () => {
      render(
        <Table
          data={[]}
          columns={columns}
          emptyState={<div>No servers registered</div>}
        />
      );
      expect(screen.getByText('No servers registered')).toBeInTheDocument();
    });
  });

  describe('List', () => {
    it('renders list items with leading, trailing, and click callback', () => {
      const onClick = vi.fn();
      const items: ListItemProps[] = [
        {
          id: '1',
          title: 'General Announcements',
          subtitle: 'Channel ID: 10928392183',
          leading: <span>#</span>,
          trailing: <button>Manage</button>,
          onClick,
        },
      ];

      render(<List items={items} />);

      expect(screen.getByText('General Announcements')).toBeInTheDocument();
      expect(screen.getByText('Channel ID: 10928392183')).toBeInTheDocument();
      expect(screen.getByText('#')).toBeInTheDocument();

      const itemRow = screen.getByText('General Announcements');
      fireEvent.click(itemRow);
      expect(onClick).toHaveBeenCalled();
    });

    it('renders emptyState when items list is empty', () => {
      render(<List items={[]} emptyState={<div>No channels configured</div>} />);
      expect(screen.getByText('No channels configured')).toBeInTheDocument();
    });
  });
});
