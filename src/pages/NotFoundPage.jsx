import { Link, useNavigate } from "react-router-dom";

const NotFoundPage = () => {
    const navigate = useNavigate();

    function goBack() {
        navigate(-1);
    }

    return (
        <section id="not-found">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <h1>404 Не е намерено</h1>
            <p>Тази страница не съществува!</p>
            <Link onClick={goBack}>Назад</Link>
        </section>
    )
}

export default NotFoundPage;