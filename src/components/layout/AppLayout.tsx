import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
