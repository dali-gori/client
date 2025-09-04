import AboutUs from "../components/AboutUs";
import HomeMap from "../components/HomeMap";

const HomePage = () => {
    return (
        <>
            <section id="home">    
                <HomeMap />
                <AboutUs />
            </section>
        </>
    );
}

export default HomePage;