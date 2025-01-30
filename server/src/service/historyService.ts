import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs

// Define a City class
class City {
  constructor(public id: string, public name: string) {}
}

const historyFilePath = path.join(process.cwd(), 'data', 'searchHistory.json');

class HistoryService {
  // Read from the searchHistory.json file
  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(historyFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or read error, return an empty array
      console.error('Error reading history file:', error);
      return [];
    }
  }

  // Write updated cities array to searchHistory.json
  private async write(cities: City[]): Promise<void> {
    try {
      await fs.writeFile(historyFilePath, JSON.stringify(cities, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing to history file:', error);
      throw new Error('Failed to write to history file');
    }
  }

  // Get all saved cities
  async getCities(): Promise<City[]> {
    return await this.read();
  }

  // Add a city to search history (if it doesn’t already exist)
  async addCity(cityName: string): Promise<City[]> {
    let cities = await this.read();

    if (!cities.some(city => city.name.toLowerCase() === cityName.toLowerCase())) {
      const newCity = new City(uuidv4(), cityName);
      cities.push(newCity);
      await this.write(cities);
    }

    return cities;
  }

  // Remove a city from search history
  async removeCity(id: string): Promise<City[]> {
    let cities = await this.read();
    const updatedCities = cities.filter(city => city.id !== id);

    if (cities.length === updatedCities.length) {
      throw new Error('City not found');
    }

    await this.write(updatedCities);
    return updatedCities;
  }
}

export default new HistoryService();
