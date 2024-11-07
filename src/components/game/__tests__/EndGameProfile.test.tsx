import { render, screen } from '@testing-library/react';
import { EndGameProfile } from '../EndGameProfile';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: {
              username: 'testuser',
              full_name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg',
              level: 5,
              experience: 550
            },
            error: null
          })
        })
      })
    })
  }
}));

describe('EndGameProfile', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it('renders user profile information correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EndGameProfile 
          userId="test-user-id" 
          gameComplete={true} 
          gameScore={3}  // Added gameScore prop
        />
      </QueryClientProvider>
    );
    
    // Wait for the level text to appear
    const levelElement = await screen.findByText('Level 5');
    expect(levelElement).toBeInTheDocument();
    
    // Check for XP progress text
    expect(await screen.findByText('50/100 XP to next level')).toBeInTheDocument();
  });

  it('shows loading state when data is being fetched', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EndGameProfile 
          userId="test-user-id" 
          gameComplete={true} 
          gameScore={3}  // Added gameScore prop
        />
      </QueryClientProvider>
    );
    
    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('applies correct level color based on user level', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EndGameProfile 
          userId="test-user-id" 
          gameComplete={true} 
          gameScore={3}  // Added gameScore prop
        />
      </QueryClientProvider>
    );
    
    // Wait for the avatar to be rendered with the correct color
    const avatar = await screen.findByRole('img', { hidden: true });
    expect(avatar.parentElement).toHaveClass('bg-blue-500');
  });
});