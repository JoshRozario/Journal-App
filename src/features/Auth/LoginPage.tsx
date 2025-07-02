// src/features/Auth/LoginPage.tsx

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../../services/firebase.ts';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    try {
      if (action === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 text-center">Advisor Journal</h1>
          <p className="text-slate-500 text-center mt-2">Your AI-powered life coach</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleAuthAction('signIn')}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => handleAuthAction('signUp')}
            className="w-full py-2 px-4 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition"
          >
            Sign Up
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-4 border border-slate-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-slate-50 transition"
        >
          {/* Simple SVG for Google Icon */}
          <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L41.611 9.92C38.086 6.643 33.43 4 28 4 15.301 4 4 15.301 4 28s11.301 24 24 24c11.026 0 21.053-8.38 22.863-19.414H43.611z"></path></svg>
          <span className="font-semibold text-slate-700">Google</span>
        </button>
      </div>
    </div>
  );
}