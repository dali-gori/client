import { useState } from "react";

const DonationPage = () => {
    const [amount, setAmount] = useState("Или повече лв.");

    return (
        <section id="donation">
            <img src="/images/donation.png" alt="donation background image" />

            <article>
                <section>
                    <h3>Изпрати виртуална прегръдка!</h3>
                    <p>Виртуалната прегръдка е начин всеки от нас да подаде ръка на хората, пострадали от пожари. С малко дарение се изпраща символ на надежда и топлина там, където е най-нужно.</p>
                </section>

                <form>
                    <div>
                        <input type="text" id="firstName" name="firstName" placeholder="Име" />
                    </div>
                    <div>
                        <input type="text" id="lastName" name="lastName" placeholder="Фамилия" />
                    </div>
                    <div>
                        <input type="text" id="email" name="email" placeholder="Имейл" />
                    </div>
                    <div>
                        <input type="text" id="phone" name="phone" placeholder="Тел. номер" />
                    </div>
                    <ul>
                        <li onClick={() => setAmount(3)} className={`${amount === 3 && "current"}`}><button type="button">6лв. / 3.07€</button></li>
                        <li onClick={() => setAmount(5)} className={`${amount === 5 && "current"}`}><button type="button">10лв. / 5.11€</button></li>
                        <li onClick={() => setAmount(7)} className={`${amount === 7 && "current"}`}><button type="button">15лв. / 7.67€</button></li>
                        <li><input onChange={(e) => setAmount(Number(e.target.value) ? Number(e.target.value) : 1)} type="text" name="amount" id="amount" placeholder="10" value={amount} /></li>
                    </ul>
                    <div>
                        <textarea name="message" placeholder="Остави послание" rows={5}></textarea>
                    </div>
                    <button type="submit">Дари {amount !== `Или повече лв.` && `${amount}лв. / ${(amount * 0.51).toFixed(2)}€`}</button>
                </form>
            </article>
        </section>
    );
}

export default DonationPage;