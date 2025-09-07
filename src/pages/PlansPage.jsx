import { useState } from "react";
import SinglePlan from "../components/SinglePlan";
import { useEffect } from "react";
import { endpoints } from "../api/endpoints";

const PlansPage = () => {

    const [subscriptionId, setSubscriptionId] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch(endpoints.me, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
            });

            if (res.ok) {
                const data = await res.json();
                setSubscriptionId(data.subscriptionId);
            }
        };

        fetchUser();
    }, []);

    const plans = [
        { name: "Безплатен", pinsAllowed: 1, priceInLv: 0, priceInEur: 0, id: 1, },
        { name: "Базов", pinsAllowed: 3, priceInLv: 4.99, priceInEur: 2.5, id: 2 },
        { name: "Разширение", pinsAllowed: 10, priceInLv: 14.99, priceInEur: 7.5, id: 3 },
    ];

    return (
        <section id="plans">
            <h1>Планове</h1>

            <article>
                {plans.map((plan, index) => (
                    <SinglePlan
                        key={index}
                        {...plan}
                        isBigger={plan.name === "Базов"}
                        isDisabled={subscriptionId !== null && subscriptionId >= plan.id}
                        isCurrent={subscriptionId === plan.id}
                    />
                ))}
            </article>

            <article className="enterprise">
                <div>
                    <h3>Корпоративен</h3>
                    <p>Започва от</p>
                    <span>99.99 лв./ 50.00€</span>
                    <p>На месец</p>
                    <p>Избор над 10 пина</p>
                </div>
                <button type="button" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Свържи се с нас</button>
            </article>
        </section>
    );
}

export default PlansPage;