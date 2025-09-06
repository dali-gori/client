import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { endpoints } from "../api/endpoints";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("accessToken") !== null);
    const location = useLocation();

    async function logoutUser(e) {
        e.preventDefault();

        try {
            const res = await fetch(endpoints.logout, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ accessToken: localStorage.getItem("accessToken") }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            localStorage.removeItem("accessToken");
            setIsLoggedIn(false);
        }
        catch (error) {
            console.error(error);
            alert(error.message);
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
            <section>
                <p>Няма опасност от пожар!</p>
            </section>

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