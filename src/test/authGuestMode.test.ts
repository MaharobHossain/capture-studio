import { describe, it, expect } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';

describe('Optional Login & Guest Mode Guarantee', () => {
  it('defaults to Guest Mode with no mandatory login', () => {
    const state = useAuthStore.getState();
    expect(state.isGuest).toBe(true);
    expect(state.user).toBeNull();
  });

  it('allows user to explicitly continue as guest', () => {
    const { continueAsGuest } = useAuthStore.getState();
    continueAsGuest();
    const updated = useAuthStore.getState();
    expect(updated.isGuest).toBe(true);
    expect(updated.error).toBeNull();
  });

  it('handles sign in gracefully when Supabase is not configured', async () => {
    const { signInWithEmail } = useAuthStore.getState();
    const result = await signInWithEmail('test@example.com', 'password123');
    expect(result).toBe(false);

    // Guest mode should still remain intact!
    const state = useAuthStore.getState();
    expect(state.isGuest).toBe(true);
  });
});

