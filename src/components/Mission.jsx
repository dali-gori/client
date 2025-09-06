import SingleMission from "./SingleMission";

const Mission = () => {
    return (
        <section id="mission">
            <h2>Нашата мисия</h2>

            <article>
                <SingleMission
                    title="Сигурност"
                    description="Предлагаме абонамент за следене на обекти в реално време, който осигурява навременни известия и спокойствие за вашата сигурност."
                    buttonText="Виж плановете"
                    to="/plans"
                    color={"#F58E44"}
                    file={"safety"}
                />
                <SingleMission
                    title="Информиранoст"
                    description="Осигуряваме навременна и достъпна информация за пожарите и рисковите ситуации."
                    file={"information"}
                />
                <SingleMission
                    title="Даряване"
                    description="Подкрепяме пострадалите от пожари чрез насочване на дарения към надеждни организации."
                    buttonText="Направи дарение"
                    to="/donation"
                    color={"#3A7C2B"}
                    file={"people"}
                />
            </article>
        </section>
    );
}

export default Mission;