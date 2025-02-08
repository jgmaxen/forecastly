import { Router, type Request, type Response } from 'express';
const router = Router();

import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

// TODO: POST Request with city name to retrieve weather data
router.post('/', async (req: Request, res: Response) => {
  try {
    const cityName = req.body.cityName;
    if (!cityName) {
      return res.status(400).json({ error: 'City name is required' }); 
    }

    // Get weather data
    const weatherData = await WeatherService.getWeatherForCity(cityName);
    
    if (!weatherData) {
      return res.status(404).json({ error: `Weather data not found for ${cityName}` });
    }

    // Save city to search history
    await HistoryService.addCity(cityName);

    return res.json(weatherData); 
  } catch (error) {
    console.error('Error fetching weather:', error);
    return res.status(500).json({ error: 'Internal server error' }); 
  }
});
  


// TODO: GET search history
router.get('/history', async (_req: Request, res: Response) => {
    HistoryService.getCities()
      .then((data) => {
        return res.json(data);
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });

// * BONUS TODO: DELETE city from search history
router.delete('/history/:id', async (_req: Request, _res: Response) => {});

export default router;