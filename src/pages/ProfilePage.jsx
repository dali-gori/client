import { useEffect, useState } from "react";
import { Link } from "react-router";
import { endpoints } from "../api/endpoints";
import StationMap from "../components/StationMap"; // Stations admin map
import WildfireMap from "../components/WildfireMap"; // User saved locations map

const ProfilePage = () => {
    const [role, setRole] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch(endpoints.me, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
            });

            if (res.ok) {
                const data = await res.json();
                setRole(data.roleId);
            }
        };

        fetchUser();
    }, []);

    return (
        <section id="profile">
            {role == 1 ? (
                <>
                    <WildfireMap />
                    <Link to="/plans"><button type="button" className="accent-button">Промени план</button></Link>
                </>
            ) : <StationMap />}
        </section>
    );
}

export default ProfilePage;