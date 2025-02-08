import { type Dayjs } from 'dayjs';
import dotenv from 'dotenv';
// import axios from 'axios';

dotenv.config();

interface Coordinates {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state: string;
}

class Weather {
  city: string;
  date: Dayjs | string;
  tempF: number;
  windSpeed: number;
  humidity: number;
  icon: string;
  iconDescription: string;

  constructor(
    city: string,
    date: Dayjs | string,
    tempF: number,
    windSpeed: number,
    humidity: number,
    icon: string,
    iconDescription: string
  ) {
    this.city = city;
    this.date = date;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.icon = icon;
    this.iconDescription = iconDescription;
  }
}

class WeatherService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://api.openweathermap.org';
    this.apiKey = process.env.API_KEY || 'c38e7aa7d462dedcf86673d38f9ca482';
  }

  private async fetchLocationData(query: string){
    try {
      const response = await fetch(`${this.baseURL}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${this.apiKey}`);
      const data = await response.json();
      
      if (!data.length) {
        console.error('No location found for:', query);
        return null;
      }
  
      return {
        name: data[0].name,
        lat: data[0].lat,
        lon: data[0].lon,
        country: data[0].country,
        state: data[0].state || ''
      };
    } catch (error) {
      console.error('Error fetching location data:', error);
      return null;
    }
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<any | null> {
    try {
      const url = this.buildWeatherQuery(coordinates);

      const response = await fetch(url);
      return response.json()
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  private async parseForcastData(response: any, city: string): Promise<Weather[] | null> {
    if (!response.list) {
      console.error('Invalid weather response:', response);
      return null;
    }

    const forecast: Weather[] = []

    const forecasData = response.list;
    let lastDateRecorded: Date | undefined = undefined
    await forecasData.forEach((weatherData: any) => {
      const date = new Date(weatherData.dt * 1000);
      if(date.getDay() != lastDateRecorded?.getDay()) {
        const weather = new Weather(
          city,
          date.toDateString(),
          weatherData?.main?.temp,
          weatherData?.main?.temp,
          weatherData?.main?.temp,
          weatherData?.weather[0]?.icon,
          weatherData?.weather[0]?.description,
        )
        lastDateRecorded = date;
        forecast.push(weather)
      }
    })  
    return forecast 
  }

  async getWeatherForCity(city: string): Promise<Weather[] | null> {
    const coordinates = await this.fetchLocationData(city);
    if (!coordinates) {
      console.error(`Could not fetch coordinates for city: ${city}`);
      return null;
    }

    const weatherData = await this.fetchWeatherData(coordinates);
    if (!weatherData) {
      console.error(`Could not fetch weather data for city: ${city}`);
      return null;
    }
  
    return await this.parseForcastData(weatherData, city);
}
}
export default new WeatherService();