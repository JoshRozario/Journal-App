import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.tsx';

export default function MainLayout() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Main content area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <Outlet /> {/* This is where the routed page component will be rendered */}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}