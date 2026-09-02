import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-ops-bg-base font-sans text-ops-text-primary p-4">
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-8 max-w-[400px] w-full text-center">
        <div className="w-12 h-12 bg-ops-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-ops-danger" size={24} />
        </div>
        <h1 className="text-ops-lg font-semibold mb-2">Access Denied</h1>
        <p className="text-ops-sm text-ops-text-secondary mb-6">
          You do not have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="w-full h-9 bg-ops-primary hover:bg-ops-primary-hover text-white rounded-ops-sm text-ops-sm font-medium transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
