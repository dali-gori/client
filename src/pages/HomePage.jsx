import AboutUs from "../components/AboutUs";
import HomeMap from "../components/HomeMap";
import Mission from "../components/Mission";
import ReportDetails from "../components/ReportDetails"
import { SelectedReportProvider } from "../contexts/SelectedReportContext";

const HomePage = () => {
    return (
        <>
            <section id="home">
                <SelectedReportProvider>
                    <HomeMap />
                    <ReportDetails />
                </SelectedReportProvider>
                <AboutUs />
                <hr />
                <Mission />
            </section>
        </>
    );
}

export default HomePage;