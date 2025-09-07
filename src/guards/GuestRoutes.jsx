import { Navigate, Outlet } from "react-router";

const GuestRoutes = () => {
    const isLoggedIn = localStorage.getItem("accessToken") !== null;

    return (
        isLoggedIn ? <Navigate to='/' /> : <Outlet />
    );
}

export default GuestRoutes;