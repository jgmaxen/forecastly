import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Coordinates interface for latitude and longitude
interface Coordinates {
  lat: number;
  lon: number;
}

// WeatherData interface for current weather response from OpenWeatherMap
interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: [
    {
      description: string;
      icon: string;
    }
  ];
}

// ListEntry interface for each forecast data point
interface ListEntry {
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: [
    {
      description: string;
      icon: string;
    }
  ];
}

// ForecastData interface for forecast response from OpenWeatherMap
interface ForecastData {
  list: ListEntry[];
}

// Weather class to hold the parsed weather data
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

// WeatherService class to interact with the OpenWeather API
class WeatherService {
  private baseURL = 'https://api.openweathermap.org/data/2.5';
  private apiKey = process.env.OPENWEATHER_API_KEY as string;

  constructor() {
    if (!this.apiKey) {
      throw new Error('Missing OpenWeather API key in environment variables');
    }
  }

// Fetch location data (latitude and longitude) for the given city
private async fetchLocationData(city: string): Promise<Coordinates | null> {
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`;
  const response = await fetch(url);

  // Check if the response was successful (status 200) and parse the JSON data
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }

  // Explicitly cast the response data to the expected array type
  const data = await response.json() as any[];

  // Validate that the data contains latitude and longitude
  if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
    return { lat: data[0].lat, lon: data[0].lon };
  }

  return null;
}

  // Fetch the current weather data using latitude and longitude
  private async fetchWeatherData(coordinates: Coordinates): Promise<WeatherData> {
    const { lat, lon } = coordinates;
    const url = `${this.baseURL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    return response.json() as unknown as WeatherData; // Typecast to WeatherData
  }

  // Fetch the forecast data for the next few days using latitude and longitude
  private async fetchForecastData(coordinates: Coordinates): Promise<ForecastData> {
    const { lat, lon } = coordinates;
    const url = `${this.baseURL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    
    return response.json() as unknown as ForecastData; // Typecast to ForecastData
  }

  // Parse the current weather data into a Weather instance
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

  // Main method to fetch both current weather and forecast for a city
  async getWeatherForCity(city: string) {
    try {
      // Fetch location data (latitude and longitude)
      const coordinates = await this.fetchLocationData(city);
      if (!coordinates) throw new Error('City not found');
      
      // Fetch current weather and forecast data
      const currentWeatherData = await this.fetchWeatherData(coordinates);
      const forecastData = await this.fetchForecastData(coordinates);

      // Parse current weather
      const currentWeather = this.parseCurrentWeather(currentWeatherData);

      // Parse forecast data
      const forecast = forecastData.list.slice(0, 5).map((entry: ListEntry) => ({
        date: entry.dt_txt,
        temperature: entry.main.temp,
        windSpeed: entry.wind.speed,
        humidity: entry.main.humidity,
        description: entry.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${entry.weather[0].icon}.png`,
      }));

      // Return both current weather and forecast
      return { currentWeather, forecast };
    } catch (error) {
      console.error(error);
      throw new Error('Error retrieving weather data');
    }
  }
}

// Export a new instance of WeatherService
export default new WeatherService();
