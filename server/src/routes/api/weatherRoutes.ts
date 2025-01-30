import fetch from 'node-fetch'; // Ensure node-fetch is available

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

// Define the expected types for the weather and forecast data
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

interface ForecastData {
  list: Array<{
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
  }>;
}

class WeatherService {
  private baseURL = 'https://api.openweathermap.org/data/2.5';
  private apiKey = process.env.OPENWEATHER_API_KEY as string;

  constructor() {
    if (!this.apiKey) {
      throw new Error('Missing OpenWeather API key in environment variables');
    }
  }

  // Fetch location data (coordinates) from OpenWeather Geocoding API
  private async fetchLocationData(city: string): Promise<Coordinates | null> {
    try {
      const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`;
      const response = await fetch(url);
      
      // Explicitly type the JSON response
      const data: { lat: number; lon: number }[] = await response.json();
  
      if (data.length === 0) return null;
      return { lat: data[0].lat, lon: data[0].lon };
    } catch (error) {
      console.error('Error fetching location data:', error);
      throw new Error('Unable to fetch location data');
    }
  }

  // Fetch current weather data using coordinates
  private async fetchWeatherData(coordinates: Coordinates): Promise<WeatherData> {
    const { lat, lon } = coordinates;
    try {
      const url = `${this.baseURL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
      const response = await fetch(url);
      
      // Explicitly type the response as WeatherData
      const data: WeatherData = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Unable to fetch weather data');
    }
  }

  // Fetch forecast data (5-day forecast) using coordinates
  private async fetchForecastData(coordinates: Coordinates): Promise<ForecastData> {
    const { lat, lon } = coordinates;
    try {
      const url = `${this.baseURL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
      const response = await fetch(url);
      
      // Explicitly type the response as ForecastData
      const data: ForecastData = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw new Error('Unable to fetch forecast data');
    }
  }

  // Parse the current weather data
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

  // Main function to fetch weather and forecast for a city
  async getWeatherForCity(city: string): Promise<{ currentWeather: Weather; forecast: any }> {
    try {
      const coordinates = await this.fetchLocationData(city);
      if (!coordinates) throw new Error('City not found');

      const currentWeatherData = await this.fetchWeatherData(coordinates);
      const forecastData = await this.fetchForecastData(coordinates);

      const currentWeather = this.parseCurrentWeather(currentWeatherData);
      const forecast = forecastData.list.slice(0, 5).map((entry) => ({
        date: entry.dt_txt,
        temperature: entry.main.temp,
        windSpeed: entry.wind.speed,
        humidity: entry.main.humidity,
        description: entry.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${entry.weather[0].icon}.png`
      }));

      return { currentWeather, forecast };
    } catch (error) {
      console.error('Error retrieving weather data:', error);
      throw new Error('Error retrieving weather data');
    }
  }
}

export default new WeatherService();
