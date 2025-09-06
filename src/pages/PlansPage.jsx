import SinglePlan from "../components/SinglePlan";

const PlansPage = () => {
    return (
        <section id="plans">
            <h1>Планове</h1>

            <article>
                <SinglePlan
                    name={"Безплатен"}
                    pinsAllowed={1}
                    priceInLv={0}
                    priceInEur={0}
                />
                <SinglePlan
                    isBigger={true}
                    name={"Базов"}
                    pinsAllowed={3}
                    priceInLv={4.99}
                    priceInEur={2.50}
                />
                <SinglePlan
                    name={"Разширение"}
                    pinsAllowed={10}
                    priceInLv={14.99}
                    priceInEur={7.50}
                />
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