const SinglePlan = ({ isBigger = false, name, pinsAllowed, priceInEur, priceInLv }) => {
    return (
        <article className={`${isBigger && "bigger"}`}>
            <h3>{name}</h3>
            <p>Позволява право на {pinsAllowed} пина</p>
            {/* <span>{priceInLv.toFixed(2)}лв. ({priceInEur.toFixed(2)}€) / на месец</span> */}
            <span>
                <b>{priceInLv.toFixed(2)}лв.</b>
                <span> | </span>
                <b>{priceInEur.toFixed(2)}€</b>
                <span> / на месец</span>
            </span>
            <button type="button">Избери</button>
        </article>
    );
}

export default SinglePlan;