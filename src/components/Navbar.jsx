import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("accessToken") !== null);
    const location = useLocation();

    function logoutUser(e) {
        e.preventDefault();
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
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
                    <li><NavLink to="/donation">Направи дарение</NavLink></li>
                    <li><NavLink to="/" className="org-name">ДАЛИГОРИ.БГ</NavLink></li>
                    <li><NavLink to="/tips">Съвети за безопасност</NavLink></li>
                    {isLoggedIn ? userNav : guestNav}
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;