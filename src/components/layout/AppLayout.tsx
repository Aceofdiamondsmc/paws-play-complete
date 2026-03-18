import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { CareNotificationProvider } from '../CareNotificationProvider';
import { LostDogFAB } from '../lost-dog/LostDogFAB';

export function AppLayout() {
  return (
    <CareNotificationProvider>
      <div className="min-h-screen bg-background safe-top">
        <Header />
        <main className="pb-24">
          <Outlet />
        </main>
        <LostDogFAB />
        <BottomNav />
      </div>
    </CareNotificationProvider>
  );
}
