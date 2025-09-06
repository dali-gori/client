import AboutUs from "../components/AboutUs";
import HomeMap from "../components/HomeMap";
import Mission from "../components/Mission";

const HomePage = () => {
    return (
        <>
            <section id="home">    
                <HomeMap />
                <AboutUs />
                <hr />
                <Mission />
            </section>
        </>
    );
}

export default HomePage;