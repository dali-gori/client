import { Outlet, useLocation } from "react-router";
import Navbar from "../components/Navbar";
import { useEffect } from "react";
import Footer from "../components/Footer";

const MainLayout = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    return (
        <>
            <Navbar />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}

export default MainLayout;