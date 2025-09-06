import { useState } from "react";

const LoginPage = () => {
    const [isActive, setIsActive] = useState(false);

    return (
        <section id="login" className={`${isActive && "active"}`}>
            <article className="register">
                <form>
                    <h1>Създай акаунт</h1>
                    <input type="text" placeholder="Име" />
                    <input type="email" placeholder="Имейл" />
                    <input type="password" placeholder="Парола" />
                    <button>Регистрация</button>
                </form>
            </article>
            <article className="login">
                <form>
                    <h1>Вход в профила</h1>
                    <input type="email" placeholder="Имейл" />
                    <input type="password" placeholder="Парола" />
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