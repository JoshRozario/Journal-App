import { create } from 'zustand';
import { User } from 'firebase/auth'; // Make sure to import the User type

interface AuthState {
  user: User | null;
  isLoading: boolean; // This state is crucial
  // No need for separate setters, we can use setState directly
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  isLoading: true, // Default to true on initial app load
}));