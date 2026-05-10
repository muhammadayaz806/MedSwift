import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Overview from "./pages/Overview";
import Drivers from "./pages/Drivers";
import Ambulances from "./pages/Ambulances";
import History from "./pages/History";
import Reports from "./pages/Reports";

function PrivateShell() {
  const { loading, profile } = useAuth();
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }
  if (!profile || profile.role !== "organization") {
    return <Navigate to="/login" replace />;
  }
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Overview />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="ambulances" element={<Ambulances />} />
        <Route path="history" element={<History />} />
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
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<PrivateShell />} />
      </Routes>
    </AuthProvider>
  );
}
