
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PassengerPage from "./pages/PassengerPage";
import AdminPage from "./pages/AdminPage";
import InspectorPage from "./pages/InspectorPage";
import DriverPage from "./pages/DriverPage";
import VehiclePage from "./pages/VehiclePage";
import RoutesPage from "./pages/RoutesPage";             
import AdminRoutesPage from "./pages/AdminRoutesPage";
import RouteOptimizationPage from "./pages/RouteOptimizationPage";
import RouteStatsPage from "./pages/RouteStatsPage";
import SchedulePage from './pages/SchedulePage';
import FuelStatisticsPage from './pages/FuelStatisticsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Demo “logged in” pages */}
          <Route path="/passenger" element={<PassengerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/inspector" element={<InspectorPage />} />
          <Route path="/driver" element={<DriverPage />} />
          {/* Vehicles management page */}
          <Route path="/vehicles" element={<VehiclePage />} />

          {/* Routes pages */}
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/admin/routes" element={<AdminRoutesPage />} />
          <Route path="/admin/routes/optimize" element={<RouteOptimizationPage />} />
          <Route path="/admin/routes/stats" element={<RouteStatsPage />} />
          <Route path="/admin/routes/schedules" element={<SchedulePage />} />
          <Route path="/admin/fuel-stats" element={<FuelStatisticsPage />} />
          

          {/* Fallback */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
