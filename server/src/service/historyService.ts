import fs from 'node:fs/promises';
import fetch from 'node-fetch';

class City {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

interface WeatherApiResponse {
  id: string;
  cod: number;
  name: string;
}

class HistoryService {
  private filePath = 'db/db.json';
  private apiKey = 'f1008e8e6f947296523fee80111c98af';

  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading file:', error);
      return [];
    }
  }

  private async write(cities: City[]): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2));
    } catch (error) {
      console.error('Error writing file:', error);
    }
  }

  private async fetchCityId(city: string): Promise<string | null> {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Type assertion here
      const weatherData = data as WeatherApiResponse;

      if (weatherData.cod === 200) {
        return weatherData.id.toString();
      }
      console.error('City not found');
      return null;
    } catch (error) {
      console.error('Error fetching city ID:', error);
      return null;
    }
  }

  async getCities(): Promise<City[]> {
    return await this.read();
  }

  async addCity(city: string): Promise<City | null> {
    if (!city) throw new Error('City cannot be blank');

    const cities = await this.getCities();
    if (cities.find(c => c.name.toLowerCase() === city.toLowerCase())) {
      return null;
    }

    const cityId = await this.fetchCityId(city);
    if (!cityId) {
      throw new Error('Could not retrieve city ID');
    }

    const newCity = new City(city, cityId);
    cities.push(newCity);
    await this.write(cities);
    return newCity;
  }

  async removeCity(id: string): Promise<boolean> {
    let cities = await this.getCities();
    const updatedCities = cities.filter(city => city.id !== id);

    if (cities.length === updatedCities.length) {
      return false;
    }

    await this.write(updatedCities);
    return true;
  }
}

export default new HistoryService();
