import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { endpoints } from "../api/endpoints";
import { toast } from "react-toastify";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("accessToken") !== null);
    const [areWeCooked, setAreWeCooked] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    async function logoutUser(e) {
        e.preventDefault();

        try {
            const res = await fetch(endpoints.logout, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            localStorage.removeItem("accessToken");
            setIsLoggedIn(false);
            toast.success("Успешен изход!");
            navigate("/");
        }
        catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    }

    navigator.geolocation.getCurrentPosition((position) => {
        fetchIsOnFire(position.coords.latitude, position.coords.longitude);
    });

    async function fetchIsOnFire(x, y) {
        try {
            const res = await fetch(endpoints.isOnFire(y, x));
            const data = await res.json();

            if (!res.ok) {
                throw new Error();
            }

            setAreWeCooked(data);
        }
        catch (err) {
            console.error(err);
            toast.error("Грешка при достъпването на данните!");
        }
    }

    useEffect(() => {
        setIsLoggedIn(localStorage.getItem("accessToken") !== null);
    }, [location]);

    const userNav = (
        <>
            {/* <li><NavLink to="/profile" className="login">Профил</NavLink></li> */}
            <li><a onClick={logoutUser} className="login">Изход</a></li>
        </>
    );

    const guestNav = (
        <>
            <li><NavLink to="/login" className="login">Вход</NavLink></li>
        </>
    );

    return (
        <header>
            {
                areWeCooked !== null &&
                <section className={areWeCooked ? "danger" : undefined}>
                    <p>{areWeCooked ? "Опасност от пожар!" : "Няма опасност от пожар!"}</p>
                </section>
            }

            <nav>
                <ul>
                    <li><NavLink to="/">Начало</NavLink></li>
                    <li><NavLink to="/tips">Съвети за превенция</NavLink></li>
                    <li><NavLink to="/" className="org-name">ДАЛИГОРИ.БГ</NavLink></li>
                    <li><NavLink to="/donation">Направи дарение</NavLink></li>
                    {isLoggedIn ? userNav : guestNav}
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;