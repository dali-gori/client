const baseUrl = "https://server-production-32f2.up.railway.app";
//const baseUrl = "http://localhost:3000";
export const endpoints = {
    login: `${baseUrl}/auth/login`,
    register: `${baseUrl}/auth/register`,
    logout: `${baseUrl}/auth/logout`,
    createItemDonation: `${baseUrl}/item-donations`,
    homeMap: `${baseUrl}/home-map`,
    isOnFire: (x, y) => `${baseUrl}/home-map/status/${x}/${y}`,
    me: `${baseUrl}/auth/me`,
    addItem: `${baseUrl}/items/`,
    reports: `${baseUrl}/reports`,
    reportById: (id) => `${baseUrl}/reports/${id}`,
    reportStatus: (id) => `${baseUrl}/reports/${id}/status`,
};