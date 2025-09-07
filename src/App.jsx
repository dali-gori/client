import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

import '/src/styles/app.css';
import 'react-toastify/dist/ReactToastify.css';

import MainLayout from './layouts/MainLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import TipsPage from './pages/TipsPage.jsx';
import DonationPage from './pages/DonationPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import GuestRoutes from './guards/GuestRoutes.jsx';
import UserRoutes from './guards/UserRoutes.jsx';

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path='/tips' element={<TipsPage />} />
            <Route path='/*' element={<NotFoundPage />} />
            <Route path='/donation' element={<DonationPage />} />

            <Route element={<GuestRoutes />} >
                <Route path='/login' element={<LoginPage />} />
            </Route>

            <Route element={<UserRoutes />} >
            <Route path='/profile' element={<ProfilePage />} />
            <Route path='/plans' element={<PlansPage />} />
            </Route>
        </Route>
    )
);

function App() {
    return <>
        <RouterProvider router={router} />
    </>
};

export default App
