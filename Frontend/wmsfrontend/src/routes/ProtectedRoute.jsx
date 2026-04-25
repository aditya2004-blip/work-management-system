import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Higher Order Component to protect routes
const ProtectedRoute = ({ children }) => {

    // Get authentication token from Redux store
    const { token } = useSelector((s) => s.auth);

    // Get current location (used for redirect after login)
    const location = useLocation();

    // If user is NOT authenticated → redirect to login page
    if (!token) {
        return (
            <Navigate
                to="/login"                    // Redirect path
                state={{ from: location }}    // Save current route for later redirect
                replace                       // Replace history (no back button to protected page)
            />
        );
    }

    // If authenticated → render the protected component
    return children;
};

export default ProtectedRoute;