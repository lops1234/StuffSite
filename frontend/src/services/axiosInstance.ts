import axios from 'axios';

import {refresh} from "./Auth/auth.service.ts";
import authHeader from "./Auth/auth-header.ts";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use(
    config => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.accessToken) {
                config.headers['Authorization'] = 'Bearer ' + user.accessToken;
            }
        }

        return config;
    },
    error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const userStr = localStorage.getItem("user");
                let user = null;
                if (userStr)
                    user = JSON.parse(userStr);

                if (!user)
                    return Promise.reject(error);

                const refreshToken = user.refreshToken;
                if (!refreshToken)
                    return Promise.reject(error);

                if (await refresh(refreshToken)) {
                    axiosInstance.defaults.headers.common['Authorization'] = authHeader()['Authorization'];
                    originalRequest.headers['Authorization'] = authHeader()['Authorization'];

                    return axiosInstance(originalRequest);
                }
            } catch (err) {
                console.error('Refresh token failed', err);
                // Handle refresh token failure (e.g., logout the user)
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;