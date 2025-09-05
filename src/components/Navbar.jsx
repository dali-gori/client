import { NavLink } from "react-router";

const Navbar = () => {
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
                    <li><NavLink to="/tips">10 съвета...</NavLink></li>
                    <li><NavLink to="/login" className="login">Влизане</NavLink></li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;