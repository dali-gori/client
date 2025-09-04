import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

import '/src/styles/app.css';

import MainLayout from './layouts/MainLayout.jsx';

import HomePage from './pages/HomePage.jsx';

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<MainLayout />}>
            <Route index element={<HomePage />} />
        </Route>
    )
);

function App() {
    return <>
        <RouterProvider router={router} />
    </>
};

export default App
