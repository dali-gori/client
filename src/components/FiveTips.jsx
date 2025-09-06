const FiveTips = ({ tips, areFirstFive = true, image }) => {
    return (
        <section className={`${!areFirstFive && "reversed"}`}>
            <img src={`/images/tips/${image}.png`} alt="tips section image" />

            <article>
                {
                    tips.map((tip, index) => (
                        <>
                            <div key={index}>
                                <h3>{String(index + (areFirstFive ? 1 : 6)).padStart(2, '0')}.</h3>
                                <p>{tip}</p>
                            </div>

                            <hr />
                        </>
                    ))
                }
            </article>
        </section>
    );
}

export default FiveTips;