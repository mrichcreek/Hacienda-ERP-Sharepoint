import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json';
import { FileProvider } from './contexts/FileContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { FileBrowser } from './components/files/FileBrowser';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { ToastContainer } from './components/common/Toast';
import { ImportDataPage } from './pages/ImportDataPage';

Amplify.configure(outputs);

function AppContent({ user }: { user: { signInDetails?: { loginId?: string } } }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'files' | 'import'>('files');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check URL for import page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'import') {
      setCurrentPage('import');
    }
  }, []);

  const userEmail = user.signInDetails?.loginId || 'User';

  return (
    <FileProvider>
      <NotificationProvider>
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50">
          <Header
            userEmail={userEmail}
            onMenuToggle={() => setIsSidebarOpen(true)}
          />

          <div className="flex flex-1 min-h-0">
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onUploadClick={() => setIsUploadModalOpen(true)}
            />

            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {currentPage === 'import' ? (
                <ImportDataPage />
              ) : (
                <FileBrowser
                  isUploadModalOpen={isUploadModalOpen}
                  onUploadModalClose={() => setIsUploadModalOpen(false)}
                />
              )}
            </main>
          </div>

          <NotificationCenter />
          <ToastContainer />
        </div>
      </NotificationProvider>
    </FileProvider>
  );
}

const formFields = {
  signUp: {
    email: {
      order: 1,
      placeholder: 'Enter your email',
      label: 'Email',
      inputProps: { required: true },
    },
    password: {
      order: 2,
      placeholder: 'Enter your password',
      label: 'Password',
      inputProps: { required: true },
    },
    confirm_password: {
      order: 3,
      placeholder: 'Confirm your password',
      label: 'Confirm Password',
      inputProps: { required: true },
    },
  },
};

export default function App() {
  return (
    <Authenticator formFields={formFields}>
      {({ user }) => (user ? <AppContent user={user} /> : <></>)}
    </Authenticator>
  );
}
