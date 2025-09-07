import { Navigate, Outlet } from "react-router";

const UserRoutes = () => {
    const isLoggedIn = localStorage.getItem("accessToken") !== null;

    return (
        isLoggedIn ? <Outlet /> : <Navigate to='/login' />
    );
}

export default UserRoutes;