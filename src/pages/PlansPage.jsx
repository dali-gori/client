import SinglePlan from "../components/SinglePlan";

const PlansPage = () => {
    return (
        <section id="plans">
            <SinglePlan
                name={"Безплатен"}
                pinsAllowed={1}
                priceInLv={0}
                priceInEur={0}
            />
            <SinglePlan
                isBigger={true}
                name={"Разширен"}
                pinsAllowed={3}
                priceInLv={4.99}
                priceInEur={2.50}
            />
            <SinglePlan
                name={"Бизнес"}
                pinsAllowed={10}
                priceInLv={14.99}
                priceInEur={7.50}
            />
        </section>
    );
}

export default PlansPage;