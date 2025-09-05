import { useState } from "react";

const DonationPage = () => {
    const [amount, setAmount] = useState("");

    return (
        <section id="donation">
            <img src="/images/donation.png" alt="donation background image" />

            <article>
                <section>
                    <h3>Изпрати виртуална прегръдка!</h3>
                    <p>Когато даряваме, ние даваме шанс на хора и каузи в нужда да получат подкрепа и надежда.</p>
                </section>

                <form>
                    <div>
                        <label htmlFor="firstName">Име</label>
                        <input type="text" id="firstName" name="firstName" />
                    </div>
                    <div>
                        <label htmlFor="lastName">Фамилия</label>
                        <input type="text" id="lastName" name="lastName" />
                    </div>
                    <div>
                        <label htmlFor="email">Имейл</label>
                        <input type="email" id="email" name="email" />
                    </div>
                    <div>
                        <label htmlFor="phone">Телефонен номер</label>
                        <input type="tel" id="phone" name="phone" />
                    </div>
                    <ul>
                        <li onClick={() => setAmount(3)}><button type="button">3</button></li>
                        <li onClick={() => setAmount(5)}><button type="button">5</button></li>
                        <li onClick={() => setAmount(7)}><button type="button">7</button></li>
                        <li><input onChange={(e) => setAmount(Number(e.target.value)) || 1} type="text" name="amount" id="amount" placeholder="10" value={amount} /></li>
                    </ul>
                    <button type="submit">Изпрати</button>
                </form>
            </article>
        </section>
    );
}

export default DonationPage;