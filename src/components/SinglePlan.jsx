const SinglePlan = ({ isBigger = false, name, pinsAllowed, priceInEur, priceInLv, isCurrent, isDisabled }) => {
    return (
        <>
            <article className={`${isBigger && "bigger"}`}>
                {isCurrent? (<span className="current-plan-badge">Текущият ви план</span>) : (<></>)}
                <h3>{name}</h3>
                <p>Избор до {pinsAllowed} локации</p>
                <span>{priceInLv.toFixed(2)}лв. / {priceInEur.toFixed(2)}€</span>
                <p>На месец</p>
                <button type="button" disabled={isDisabled}>Избери</button>
            </article>
        </>
    );
}

export default SinglePlan;