import { useEffect, useState } from "react";
import { Link } from "react-router";
import { endpoints } from "../api/endpoints";
<<<<<<< Updated upstream
import WildfireMap from "../components/StationMap";
=======
import WildfireMap from "../components/WildfireMap";
>>>>>>> Stashed changes

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
            <WildfireMap />
            {role == 1 ? (
                <Link to="/plans"><button type="button" href="#" className="accent-button">Промени план</button></Link>
            ): <></>}
            <WildfireMap />
        </section>
    );
}

export default ProfilePage;