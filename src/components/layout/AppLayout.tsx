import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { CareNotificationProvider } from '../CareNotificationProvider';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <CareNotificationProvider />
      <Header />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
