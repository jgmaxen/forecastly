import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { WeatherData, ForecastData, ListEntry } from '../models/WeatherAPIResponse'; // Import the types

interface Coordinates {
  lat: number;
  lon: number;
}

class Weather {
  constructor(
    public city: string,
    public temperature: number,
    public windSpeed: number,
    public humidity: number,
    public description: string,
    public iconUrl: string
  ) {}
}

dotenv.config();

class WeatherService {
  private baseURL = 'https://api.openweathermap.org/data/2.5';
  private apiKey = process.env.OPENWEATHER_API_KEY as string;

  constructor() {
    if (!this.apiKey) {
      throw new Error('Missing OpenWeather API key in environment variables');
    }
  }

  private async fetchLocationData(city: string): Promise<Coordinates | null> {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`;
    const response = await fetch(url);
    const data: { lat: number; lon: number }[] = await response.json(); // Type the response

    if (data.length === 0) return null;
    return { lat: data[0].lat, lon: data[0].lon };
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<WeatherData> {
    const { lat, lon } = coordinates;
    const url = `${this.baseURL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    const response = await fetch(url);
    return response.json() as WeatherData; // Cast the response to WeatherData type
  }

  private async fetchForecastData(coordinates: Coordinates): Promise<ForecastData> {
    const { lat, lon } = coordinates;
    const url = `${this.baseURL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    const response = await fetch(url);
    return response.json() as ForecastData; // Cast the response to ForecastData type
  }

  private parseCurrentWeather(data: WeatherData): Weather {
    return new Weather(
      data.name,
      data.main.temp,
      data.wind.speed,
      data.main.humidity,
      data.weather[0].description,
      `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`
    );
  }

  async getWeatherForCity(city: string) {
    try {
      const coordinates = await this.fetchLocationData(city);
      if (!coordinates) throw new Error('City not found');

      const currentWeatherData = await this.fetchWeatherData(coordinates);
      const forecastData = await this.fetchForecastData(coordinates);

      const currentWeather = this.parseCurrentWeather(currentWeatherData);
      const forecast = forecastData.list.slice(0, 5).map((entry: ListEntry) => ({
        date: entry.dt_txt,
        temperature: entry.main.temp,
        windSpeed: entry.wind.speed,
        humidity: entry.main.humidity,
        description: entry.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${entry.weather[0].icon}.png`,
      }));

      return { currentWeather, forecast };
    } catch (error) {
      console.error(error);
      throw new Error('Error retrieving weather data');
    }
  }
}

export default new WeatherService();
