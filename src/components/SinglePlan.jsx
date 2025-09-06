const SinglePlan = ({ isBigger = false, name, pinsAllowed, priceInEur, priceInLv }) => {
    return (
        <article className={`${isBigger && "bigger"}`}>
            <h3>{name}</h3>
            <p>Избор до {pinsAllowed} локации</p>
            <span>{priceInLv.toFixed(2)}лв. / {priceInEur.toFixed(2)}€</span>
            <p>На месец</p>
            <button type="button">Избери</button>
        </article>
    );
}

export default SinglePlan;