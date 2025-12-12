import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FuelStatistics from './FuelStatistics';

const FuelStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">E-Transit – Kuro sąnaudų statistika</h1>
          <p className="text-sm text-slate-500">
            Prisijungta kaip {user?.name} ({user?.role})
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="bg-slate-600 text-white px-4 py-1 rounded-md hover:bg-slate-700"
          >
            Grįžti
          </button>
          <button
            onClick={handleSignOut}
            className="bg-slate-900 text-white px-4 py-1 rounded-md hover:bg-slate-800"
          >
            Atsijungti
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <FuelStatistics />
      </div>
    </div>
  );
};

export default FuelStatisticsPage;
