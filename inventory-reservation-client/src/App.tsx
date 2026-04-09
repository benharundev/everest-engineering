import { useApp } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { ToastStack } from './components/shared/Toast';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ReservationsTab } from './components/Reservations/ReservationsTab';
import { CreateForm } from './components/Create/CreateForm';
import { SimulateTab } from './components/Simulate/SimulateTab';
import { SettingsTab } from './components/Settings/SettingsTab';

export default function App() {
  const { tab } = useApp();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar />

        <main
          className="dot-grid"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            background: 'var(--bg-base)',
          }}
        >
          {tab === 'dashboard'    && <Dashboard />}
          {tab === 'reservations' && <ReservationsTab />}
          {tab === 'create'       && <CreateForm />}
          {tab === 'simulate'     && <SimulateTab />}
          {tab === 'settings'     && <SettingsTab />}
        </main>
      </div>

      <ToastStack />
    </div>
  );
}
