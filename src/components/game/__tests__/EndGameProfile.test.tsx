import { render, screen } from '@testing-library/react';
import { EndGameProfile } from '../EndGameProfile';
import { describe, it, expect } from 'vitest';

describe('EndGameProfile', () => {
  const mockUserProfile = {
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    level: 5,
    experience: 550
  };

  it('renders user profile information correctly', () => {
    render(<EndGameProfile userProfile={mockUserProfile} />);
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('50/100 XP to next level')).toBeInTheDocument();
  });

  it('calculates progress to next level correctly', () => {
    render(<EndGameProfile userProfile={mockUserProfile} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('applies correct level color based on user level', () => {
    const { container } = render(<EndGameProfile userProfile={mockUserProfile} />);
    
    // Level 5 should have blue color
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
  });
});