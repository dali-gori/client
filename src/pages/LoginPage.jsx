import { useState } from "react";
import { endpoints } from "../api/endpoints";
import { useNavigate } from "react-router";

const LoginPage = () => {
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();

    const onLoginSubmit = async (e) => {
        e.preventDefault();

        const { email, password } = Object.fromEntries(new FormData(e.target));
        try {
            const res = await fetch(endpoints.login, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            localStorage.setItem("accessToken", data.accessToken);
            navigate("/");
        }
        catch (error) {
            console.log(error);
            alert(error.message);
        }
    }

    const onRegisterSubmit = async (e) => {
        e.preventDefault();

        const { name, phone, email, password } = Object.fromEntries(new FormData(e.target));
        try {
            const res = await fetch(endpoints.register, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, name, phoneNumber: phone }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            localStorage.setItem("accessToken", data.accessToken);
            navigate("/");
        }
        catch (error) {
            console.log(error);
            alert(error.message);
        }
    }

    return (
        <section id="login" className={`${isActive && "active"}`}>
            <article className="register">
                <form onSubmit={onRegisterSubmit}>
                    <h1>Създай акаунт</h1>
                    <input type="text" name="name" placeholder="Име" />
                    <input type="text" name="phone" placeholder="Тел. номер" />
                    <input type="text" name="email" placeholder="Имейл" />
                    <input type="password" name="password" placeholder="Парола" />
                    <button>Регистрация</button>
                </form>
            </article>
            <article className="login">
                <form onSubmit={onLoginSubmit}>
                    <h1>Вход в профила</h1>
                    <input type="text" placeholder="Имейл" name="email" />
                    <input type="password" placeholder="Парола" name="password" />
                    <button>Влизане</button>
                </form>
            </article>
            <article className="toggle-container">
                <div>
                    <div className="toggle-panel toggle-left">
                        <h1>Здравейте отново!</h1>
                        <p>Влезте в профила си и станете част от платформата.</p>
                        <button id="login-button" onClick={() => setIsActive(false)}>Влизане</button>
                    </div>
                    <div className="toggle-panel toggle-right">
                        <h1>Здравейте!</h1>
                        <p>Регистрирайте се и станете част от платформата.</p>
                        <button id="register-button" onClick={() => setIsActive(true)}>Регистрация</button>
                    </div>
                </div>
            </article>
        </section>
    )
}

export default LoginPage;