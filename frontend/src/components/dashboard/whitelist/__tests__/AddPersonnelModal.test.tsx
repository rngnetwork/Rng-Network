import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddPersonnelModal, WhitelistModalFormState } from '../AddPersonnelModal';

describe('AddPersonnelModal Dynamic Integration', () => {
  const dynamicHierarchy = {
    'Supreme': ['Chief High Command', 'High Command'],
    'Chancellory': [
      'Chancellor of Roughnuts',
      'Chancellor of Rednecks Gaming',
      'Chancellor of Rivals',
    ],
    'Ministry of Tech': [
      'Minister',
      'Secretary',
      'Tech Specialist',
      'Senior Dev',
      'Junior Dev',
    ],
  };

  const defaultFormState: WhitelistModalFormState = {
    email: '',
    userName: '',
    provider: 'EMAIL',
    designations: ['Ministry of Tech'],
    roles: ['Senior Dev'],
  };

  it('renders dynamic designations from backend hierarchy without fallback enums', () => {
    render(
      <AddPersonnelModal
        isOpen={true}
        onClose={vi.fn()}
        formData={defaultFormState}
        onChangeFormData={vi.fn()}
        hierarchy={dynamicHierarchy}
        isHighCommand={true}
        isMinister={false}
        ministerMinistries={[]}
        onToggleDesignation={vi.fn()}
        onToggleRoleForDept={vi.fn()}
        isRoleSelectedInDept={(des, role) => des === 'Ministry of Tech' && role === 'Senior Dev'}
        onSubmit={vi.fn()}
        isSubmitting={false}
        formError={null}
      />
    );

    expect(screen.getByText('Supreme')).toBeInTheDocument();
    expect(screen.getByText('Chancellory')).toBeInTheDocument();
    expect(screen.getAllByText('Ministry of Tech')[0]).toBeInTheDocument();
    expect(screen.getByText('Senior Dev')).toBeInTheDocument();
    expect(screen.getByText('Junior Dev')).toBeInTheDocument();
  });

  it('restricts designation and role selection for ministers to assigned ministries', () => {
    const onToggle = vi.fn();
    render(
      <AddPersonnelModal
        isOpen={true}
        onClose={vi.fn()}
        formData={defaultFormState}
        onChangeFormData={vi.fn()}
        hierarchy={dynamicHierarchy}
        isHighCommand={false}
        isMinister={true}
        ministerMinistries={['Ministry of Tech']}
        onToggleDesignation={onToggle}
        onToggleRoleForDept={vi.fn()}
        isRoleSelectedInDept={vi.fn().mockReturnValue(false)}
        onSubmit={vi.fn()}
        isSubmitting={false}
        formError={null}
      />
    );

    // Supreme button should be disabled for Minister
    const supremeBtn = screen.getByRole('button', { name: 'Supreme' });
    expect(supremeBtn).toBeDisabled();

    // Ministry of Tech button should be enabled
    const techBtn = screen.getByRole('button', { name: 'Ministry of Tech' });
    expect(techBtn).not.toBeDisabled();
  });

  it('locks Chancellor roles for ministers under Chancellory designation', () => {
    const formWithChancellory: WhitelistModalFormState = {
      email: 'test@rednecksgaming.com',
      userName: 'Test Minister',
      provider: 'EMAIL',
      designations: ['Chancellory'],
      roles: [],
    };

    render(
      <AddPersonnelModal
        isOpen={true}
        onClose={vi.fn()}
        formData={formWithChancellory}
        onChangeFormData={vi.fn()}
        hierarchy={dynamicHierarchy}
        isHighCommand={false}
        isMinister={true}
        ministerMinistries={['Chancellory']}
        onToggleDesignation={vi.fn()}
        onToggleRoleForDept={vi.fn()}
        isRoleSelectedInDept={vi.fn().mockReturnValue(false)}
        onSubmit={vi.fn()}
        isSubmitting={false}
        formError={null}
      />
    );

    const rivalsBtn = screen.getByRole('button', { name: /Chancellor of Rivals/i });
    expect(rivalsBtn).toBeDisabled();
  });

  it('renders Chancellor of Rivals under Chancellory designation for Chancellory ministry', () => {
    const formWithChancellory: WhitelistModalFormState = {
      email: 'chancellor@rednecksgaming.com',
      userName: 'Rivals Chancellor',
      provider: 'EMAIL',
      designations: ['Chancellory'],
      roles: ['Chancellor of Rivals'],
    };

    render(
      <AddPersonnelModal
        isOpen={true}
        onClose={vi.fn()}
        formData={formWithChancellory}
        onChangeFormData={vi.fn()}
        hierarchy={dynamicHierarchy}
        isHighCommand={true}
        isMinister={false}
        ministerMinistries={[]}
        onToggleDesignation={vi.fn()}
        onToggleRoleForDept={vi.fn()}
        isRoleSelectedInDept={(des, role) => des === 'Chancellory' && role === 'Chancellor of Rivals'}
        onSubmit={vi.fn()}
        isSubmitting={false}
        formError={null}
      />
    );

    expect(screen.getByText('Chancellor of Rivals')).toBeInTheDocument();
    expect(screen.getByText('Chancellor of Roughnuts')).toBeInTheDocument();
  });
});
