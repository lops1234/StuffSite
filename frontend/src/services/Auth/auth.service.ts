import axios from "axios";

const AIP_AUTH_URL = import.meta.env.VITE_API_URL + "/auth/";


export const register = (username: string, email: string, password: string) => {
    return axios.post(AIP_AUTH_URL + "register", {
        username,
        email,
        password,
    });
};

export const login = async (username: string, password: string) => {
    let response = await axios
        .post(AIP_AUTH_URL + "login", {
                email: username,
                password: password,
            },
        );
    if (response.data.accessToken) {
        localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
};

export const refresh = async (refreshToken: string) => {
    let response = await axios
        .post(AIP_AUTH_URL + "refresh", {
            refreshToken: refreshToken,
        });
    if (response.status === 200 && response.data && response.data.accessToken) {
        const accessToken = response.data.accessToken;
        const refreshToken = response.data.refreshToken;

        localStorage.setItem('user', JSON.stringify({
            ...JSON.parse(localStorage.getItem('user') || '{}'),
            accessToken,
            refreshToken
        }));
        return true;
    }
    return false;
};

export const logout = () => {
    localStorage.removeItem("user");
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);

    return null;
};
