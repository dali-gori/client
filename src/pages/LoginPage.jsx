import { useState } from "react";

const LoginPage = () => {
    const [isActive, setIsActive] = useState(false);

    return (
        <section id="login" class={`${isActive && "active"}`}>
            <article class="register">
                <form>
                    <h1>Create Account</h1>
                    <span>or use your email for registeration</span>
                    <input type="text" placeholder="Name" />
                    <input type="email" placeholder="Email" />
                    <input type="password" placeholder="Password" />
                    <button>Sign Up</button>
                </form>
            </article>
            <article class="login">
                <form>
                    <h1>Sign In</h1>
                    <span>or use your email password</span>
                    <input type="email" placeholder="Email" />
                    <input type="password" placeholder="Password" />
                    <button>Sign In</button>
                </form>
            </article>
            <article class="toggle-container">
                <div>
                    <div class="toggle-panel toggle-left">
                        <h1>Welcome Back!</h1>
                        <p>Enter your personal details to use all of site features</p>
                        <button class="hidden" id="login" onClick={() => setIsActive(false)}>Sign In</button>
                    </div>
                    <div class="toggle-panel toggle-right">
                        <h1>Hello, Friend!</h1>
                        <p>Register with your personal details to use all of site features</p>
                        <button class="hidden" id="register" onClick={() => setIsActive(true)}>Sign Up</button>
                    </div>
                </div>
            </article>
        </section>
    )
}

export default LoginPage;