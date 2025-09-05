import { useState } from "react";

const DonationPage = () => {
    const [amount, setAmount] = useState("Или повече лв.");

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
                        <li onClick={() => setAmount(3)} className={`${amount === 3 && "current"}`}><button type="button">6лв. / 3.07€</button></li>
                        <li onClick={() => setAmount(5)} className={`${amount === 5 && "current"}`}><button type="button">10лв. / 5.11€</button></li>
                        <li onClick={() => setAmount(7)} className={`${amount === 7 && "current"}`}><button type="button">15лв. / 7.67€</button></li>
                        <li><input onChange={(e) => setAmount(Number(e.target.value) ? Number(e.target.value) : 1)} type="text" name="amount" id="amount" placeholder="10" value={amount} /></li>
                    </ul>
                    <button type="submit">Изпрати {amount !== `Или повече лв.` && `${amount}лв. / ${(amount * 0.51).toFixed(2)}€`}</button>
                </form>
            </article>
        </section>
    );
}

export default DonationPage;