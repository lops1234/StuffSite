import React, { useState, useEffect } from "react";

import SiteService from "../services/site.service.ts";

const Home: React.FC = () => {
    const [content, setContent] = useState<string>("");

    useEffect(() => {
        SiteService.getWeatherForecast().then(
            (response) => {
                setContent(response.data);
            },
            (error) => {
                const _content =
                    (error.response && error.response.data) ||
                    error.message ||
                    error.toString();

                setContent(_content);
            }
        );

    }, []);

    return (
        <div className="container">
            <header className="jumbotron">
                <h3>Weather Forecast</h3>
                {Array.isArray(content) && content.map((forecast, index) => (
                    <div key={index}>
                        <p>Date: {forecast.date}</p>
                        <p>Temperature (C): {forecast.temperatureC}</p>
                        <p>Temperature (F): {forecast.temperatureF}</p>
                        <p>Summary: {forecast.summary}</p>
                        <br/>
                    </div>
                ))}
            </header>
        </div>
    );
};

export default Home;