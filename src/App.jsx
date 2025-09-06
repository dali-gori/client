import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

import '/src/styles/app.css';

import MainLayout from './layouts/MainLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import TipsPage from './pages/TipsPage.jsx';
import DonationPage from './pages/DonationPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path='/tips' element={<TipsPage />} />
            <Route path='/donation' element={<DonationPage />} />
            <Route path='/plans' element={<PlansPage />} />
            <Route path='/login' element={<LoginPage />} />
        </Route>
    )
);

function App() {
    return <>
        <RouterProvider router={router} />
    </>
};

export default App
