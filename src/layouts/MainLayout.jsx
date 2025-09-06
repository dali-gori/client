import { Outlet, useLocation } from "react-router";
import Navbar from "../components/Navbar";
import { useEffect } from "react";
import Footer from "../components/Footer";
import { ToastContainer } from "react-toastify";

const MainLayout = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Navbar />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}

export default MainLayout;