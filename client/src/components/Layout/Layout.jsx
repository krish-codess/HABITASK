import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import TopBar from './TopBar.jsx';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-20 pt-2">
        <div className="max-w-2xl mx-auto px-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
