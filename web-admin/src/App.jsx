import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Organizations from "./pages/Organizations";
import UsersPage from "./pages/UsersPage";
import DriversPage from "./pages/DriversPage";
import Emergencies from "./pages/Emergencies";
import Reports from "./pages/Reports";

function PrivateShell() {
  const { loading, profile } = useAuth();
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-brand-sub">
        Loading…
      </div>
    );
  }
  if (!profile || profile.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Organizations />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="emergencies" element={<Emergencies />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/*" element={<PrivateShell />} />
      </Routes>
    </AuthProvider>
  );
}
