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


    async function logoutUser(e) {
        e.preventDefault();

        try {
            const res = await fetch(endpoints.logout, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            localStorage.removeItem("accessToken");
            setIsLoggedIn(false);
            toast.success("Успешен изход!");
            navigate("/");
        }
        catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    }

    return (
        <section id="profile">
            {role == 1 ? (
                <>
                    <WildfireMap />
                    <Link to="/plans"><button type="button" className="accent-button">Промени план</button></Link>
                </>
            ) : <StationMap />}
            <a onClick={logoutUser} className="accent-button">Изход</a>
        </section>
    );
}

export default ProfilePage;