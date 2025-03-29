"use client";

import { JSX, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sun, CloudRain, Wind, Thermometer, Droplet, Leaf, Moon, Cloudy } from "lucide-react";

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=20.044999&longitude=99.894333&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm&current=temperature_2m,weather_code,wind_speed_10m,surface_pressure,is_day,rain";

const weatherIcons: Record<number, JSX.Element> = {
    0: <Sun className="text-yellow-400 size-20" />, // Clear sky
    1: <Sun className="text-yellow-400 size-20" />, // Mainly clear
    2: <Sun className="text-yellow-300 size-20" />, // Partly cloudy
    3: <Cloudy className="size-20" />, // Overcast
    51: <CloudRain className="text-blue-300 size-20" />, // Light rain
    61: <CloudRain className="size-20" />, // Moderate rain
    71: <CloudRain className="size-20" />, // Snow
};

interface WeatherData {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    surface_pressure: number;
    is_day: number;
    rain: number;
    soil_temperature_0cm: number;
    soil_moisture_0_to_1cm: number;
}

export default function WeatherCard() {
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(WEATHER_API_URL);
                const data = await response.json();
                setWeather({
                    ...data.current,
                    soil_temperature_0cm: data.hourly.soil_temperature_0cm[0], // Fetch the latest soil temperature
                    soil_moisture_0_to_1cm: data.hourly.soil_moisture_0_to_1cm[0], // Fetch the latest soil moisture
                });
            } catch (error) {
                console.error("Failed to fetch weather data", error);
            }
        };

        fetchWeather();
    }, []);

    if (!weather) {
        return <p>Loading weather...</p>;
    }

    const isNight = weather.is_day === 0;

    return (
        <Card className={`w-full p-6 bg-sky-400 text-white rounded-lg text-center shadow-xl`}>
            <h2 className="text-2xl font-semibold">Chiang Rai</h2>

            <div className="flex justify-center items-center my-2">
                {isNight ? <Moon className="text-white size-20" /> : (weatherIcons[weather.weather_code] || <CloudRain className="size-20" />)}
            </div>

            <p className="text-lg">
                {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                })}
            </p>
            <div>
            <div>
                <h1 className="text-4xl font-bold">{Math.round(weather.temperature_2m)}°C</h1>
                <p className="text-lg">{weather.rain > 0 ? "Rainy" : isNight ? "Clear Night" : "Sunny"}</p>
            </div>
                <hr className="my-4 border-t border-white/50" />
                <div className="grid grid-cols-3 justify-around mt-4 text-xs gap-2">
                    <div className="flex items-center gap-1">
                        <Wind className="size-4" /> {weather.wind_speed_10m} km/h
                    </div>
                    <div className="flex items-center gap-1">
                        <Thermometer className="size-4" /> {weather.surface_pressure} mbar
                    </div>
                    <div className="flex items-center gap-1">
                        <Droplet className="size-4" /> {weather.rain} mm
                    </div>
                    <div className="flex items-center gap-1">
                        <Leaf className="size-4" /> {weather.soil_temperature_0cm}°C Soil
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                        <Leaf className="size-4" /> {weather.soil_moisture_0_to_1cm}% Moisture
                    </div>
                </div>
            </div>
        </Card>
    );
}
