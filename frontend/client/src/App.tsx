
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import PassengerPage from "./pages/PassengerPage";
import AdminPage from "./pages/AdminPage";
import InspectorPage from "./pages/InspectorPage";
import VehiclePage from "./pages/VehiclePage";
import RoutesPage from "./pages/RoutesPage";             
import AdminRoutesPage from "./pages/AdminRoutesPage"; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Demo “logged in” pages */}
          <Route path="/passenger" element={<PassengerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/inspector" element={<InspectorPage />} />
          <Route path="/driver" element={<VehiclePage />} />

          {/* Routes pages */}
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/admin/routes" element={<AdminRoutesPage />} />
          {/* Fallback */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
