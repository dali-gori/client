const baseUrl = "https://server-production-32f2.up.railway.app";

export const endpoints = {
    login: `${baseUrl}/auth/login`,
    register: `${baseUrl}/auth/register`,
    logout: `${baseUrl}/auth/logout`,
    createItemDonation: `${baseUrl}/item-donations`,
    homeMap: `${baseUrl}/home-map`,
    isOnFire: (x, y) => `${baseUrl}/home-map/status/${x}/${y}`
};