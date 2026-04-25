import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Component to protect routes based on user roles (RBAC - Role Based Access Control)
const RoleRoute = ({ children, roles }) => {

    // Get user and token from Redux store
    const { user, token } = useSelector((s) => s.auth);

    // 🔐 Step 1: If no token → user is not logged in
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // ⏳ Step 2: If token exists but user data not yet loaded
    // (can happen during app refresh / async fetch)
    if (!user) {
        return null; // or better: return a loader/spinner
    }

    // 🚫 Step 3: If user's role is NOT allowed
    if (!roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />; // redirect to safe page
    }

    // ✅ Step 4: Authorized → render the protected content
    return children;
};

export default RoleRoute;