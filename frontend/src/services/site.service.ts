import axiosInstance from "./axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export class SiteService {
    static getWeatherForecast() {
        return axiosInstance.get(API_URL + "/weatherforecast");
    }

}

export default SiteService;