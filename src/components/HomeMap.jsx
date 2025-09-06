import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import FullscreenMap from "./FullScreenMap";
import FireIcon from "./FireIcon";

const HomeMap = () => {
    return (
        <section id="home-map">
            <ul className="legend">
                <li>
                    <FireIcon color="#FF7410" />
                    <p>Разпространяващ се</p>
                </li>
                <li>
                    <FireIcon color="#0095FF" />
                    <p>Под контрол</p>
                </li>
                <li>
                    <FireIcon color="#3AB549" />
                    <p>Потушен</p>
                </li>
                <li><span></span> <p>НАСА данни</p></li>
            </ul>
            <FullscreenMap />
        </section>
    );
}

export default HomeMap;