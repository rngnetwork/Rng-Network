import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../navigation/Navbar';
import { HamburgerMenu } from '../navigation/HamburgerMenu';
import { Breadcrumbs } from '../navigation/Breadcrumbs';
import { Pagination } from '../navigation/Pagination';
import { Sidebar } from '../navigation/Sidebar';
import { Accordion } from '../navigation/Accordion';

describe('Common Navigation Controls', () => {
  describe('Navbar', () => {
    it('renders brand name, navigation links and menu callback', () => {
      const onMenuClick = vi.fn();
      const items = [
        { label: 'Overview', href: '/dashboard', active: true },
        { label: 'Servers', href: '/dashboard/servers' },
      ];

      render(
        <Navbar
          brandName="RNG Command"
          items={items}
          onMenuClick={onMenuClick}
          userMenu={<span>Chief HC</span>}
        />
      );

      expect(screen.getByText('RNG Command')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Chief HC')).toBeInTheDocument();

      const menuBtn = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuBtn);
      expect(onMenuClick).toHaveBeenCalled();
    });
  });

  describe('HamburgerMenu', () => {
    it('renders and responds to toggle callback', () => {
      const onToggle = vi.fn();
      render(<HamburgerMenu isOpen={false} onToggle={onToggle} />);

      const btn = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(btn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(btn);
      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('Breadcrumbs', () => {
    it('renders breadcrumbs list with current leaf marker', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Servers', href: '/dashboard/servers' },
        { label: 'Embeds' },
      ];

      render(<Breadcrumbs items={items} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Servers')).toBeInTheDocument();
      const leaf = screen.getByText('Embeds');
      expect(leaf).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Pagination', () => {
    it('renders page numbers and triggers onPageChange on next/page click', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
          pageSize={10}
          totalItems={50}
        />
      );

      expect(screen.getByText('11')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();

      const page3 = screen.getByRole('button', { name: '3' });
      fireEvent.click(page3);
      expect(onPageChange).toHaveBeenCalledWith(3);

      const nextBtn = screen.getByLabelText('Next page');
      fireEvent.click(nextBtn);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Sidebar', () => {
    it('renders items and handles collapse toggle', () => {
      const onToggleCollapse = vi.fn();
      const items = [
        { id: '1', label: 'Dashboard', href: '/dashboard', active: true },
        { id: '2', label: 'Whitelist', href: '/dashboard/whitelist', badge: 3 },
      ];

      render(
        <Sidebar
          items={items}
          collapsed={false}
          onToggleCollapse={onToggleCollapse}
          header={<span>RNG Admin</span>}
        />
      );

      expect(screen.getByText('RNG Admin')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Whitelist')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      const collapseBtn = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseBtn);
      expect(onToggleCollapse).toHaveBeenCalled();
    });
  });

  describe('Accordion', () => {
    it('expands panel and displays content on click', () => {
      const items = [
        { id: 'acc1', title: 'Security Clearance', content: 'Supreme Level 5' },
        { id: 'acc2', title: 'Active Ministry', content: 'Ministry of War' },
      ];

      render(<Accordion items={items} defaultOpenId="acc1" />);

      expect(screen.getByText('Supreme Level 5')).toBeInTheDocument();

      const title2 = screen.getByText('Active Ministry');
      fireEvent.click(title2);

      expect(screen.getByText('Ministry of War')).toBeInTheDocument();
    });
  });
});
