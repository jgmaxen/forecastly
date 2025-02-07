import './styles/jass.css';

// All necessary DOM elements selected
const elements = {
  searchForm: document.getElementById('search-form') as HTMLFormElement,
  searchInput: document.getElementById('search-input') as HTMLInputElement,
  todayContainer: document.querySelector('#today') as HTMLDivElement,
  forecastContainer: document.querySelector('#forecast') as HTMLDivElement,
  searchHistoryContainer: document.getElementById('history') as HTMLDivElement,
  heading: document.getElementById('search-title') as HTMLHeadingElement,
  weatherIcon: document.getElementById('weather-img') as HTMLImageElement,
  tempEl: document.getElementById('temp') as HTMLParagraphElement,
  windEl: document.getElementById('wind') as HTMLParagraphElement,
  humidityEl: document.getElementById('humidity') as HTMLParagraphElement,
};

/*
API Calls
*/
const fetchData = async (url: string, method: string = 'GET', body: any = null) => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });
  return await response.json();
};

const fetchWeather = async (cityName: string) => {
  const weatherData = await fetchData('/api/weather/', 'POST', { cityName });
  renderCurrentWeather(weatherData[0]);
  renderForecast(weatherData.slice(1));
};

const fetchSearchHistory = async () => {
  return await fetchData('/api/weather/history');
};

const deleteCityFromHistory = async (id: string) => {
  await fetch(`/api/weather/history/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

/*
Render Functions
*/
const renderCurrentWeather = (currentWeather: any): void => {
  const { city, date, icon, iconDescription, tempF, windSpeed, humidity } = currentWeather;

  updateHeading(city, date);
  updateWeatherIcon(icon, iconDescription);
  updateWeatherDetails(tempF, windSpeed, humidity);

  if (elements.todayContainer) {
    elements.todayContainer.innerHTML = '';
    elements.todayContainer.append(elements.heading, elements.tempEl, elements.windEl, elements.humidityEl);
  }
};

const updateHeading = (city: string, date: string) => {
  elements.heading.textContent = `${city} (${date})`;
};

const updateWeatherIcon = (icon: string, description: string) => {
  elements.weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
  elements.weatherIcon.setAttribute('alt', description);
  elements.weatherIcon.setAttribute('class', 'weather-img');
  elements.heading.append(elements.weatherIcon);
};

const updateWeatherDetails = (tempF: number, windSpeed: number, humidity: number) => {
  elements.tempEl.textContent = `Temp: ${tempF}°F`;
  elements.windEl.textContent = `Wind: ${windSpeed} MPH`;
  elements.humidityEl.textContent = `Humidity: ${humidity} %`;
};

const renderForecast = (forecast: any): void => {
  const headingCol = document.createElement('div');
  const heading = document.createElement('h4');

  headingCol.setAttribute('class', 'col-12');
  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  if (elements.forecastContainer) {
    elements.forecastContainer.innerHTML = '';
    elements.forecastContainer.append(headingCol);
  }

  for (let i = 0; i < forecast.length; i++) {
    renderForecastCard(forecast[i]);
  }
};

const renderForecastCard = (forecast: any) => {
  const { date, icon, iconDescription, tempF, windSpeed, humidity } = forecast;

  const { col, cardTitle, weatherIcon, tempEl, windEl, humidityEl } = UIHelper.createForecastCard();

  // Add content to elements
  cardTitle.textContent = date;
  weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windSpeed} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  if (elements.forecastContainer) {
    elements.forecastContainer.append(col);
  }
};

const renderSearchHistory = async (searchHistory: any) => {
  const historyList = await searchHistory.json();

  if (elements.searchHistoryContainer) {
    elements.searchHistoryContainer.innerHTML = '';

    if (!historyList.length) {
      elements.searchHistoryContainer.innerHTML =
        '<p class="text-center">No Previous Search History</p>';
    }

    // * Start at end of history array and count down to show the most recent cities at the top.
    for (let i = historyList.length - 1; i >= 0; i--) {
      const historyItem = UIHelper.buildHistoryListItem(historyList[i]);
      elements.searchHistoryContainer.append(historyItem);
    }
  }
};

/*
Event Handlers
*/
const handleSearchFormSubmit = (event: any): void => {
  event.preventDefault();

  if (!elements.searchInput.value) {
    throw new Error('City cannot be blank');
  }

  const search: string = elements.searchInput.value.trim();
  fetchWeather(search).then(() => {
    getAndRenderHistory();
  });
  elements.searchInput.value = '';
};

const handleSearchHistoryClick = (event: any) => {
  if (event.target.matches('.history-btn')) {
    const city = event.target.textContent;
    fetchWeather(city).then(getAndRenderHistory);
  } else if (event.target.matches('.delete-city')) {
    const cityID = JSON.parse(event.target.getAttribute('data-city')).id;
    deleteCityFromHistory(cityID).then(getAndRenderHistory);
  }
};

/*
Initial Render
*/
const getAndRenderHistory = () =>
  fetchSearchHistory().then(renderSearchHistory);

elements.searchForm?.addEventListener('submit', handleSearchFormSubmit);
elements.searchHistoryContainer?.addEventListener('click', handleSearchHistoryClick);

getAndRenderHistory();

/*
UIHelper Class
*/
class UIHelper {
  static createForecastCard() {
    const col = document.createElement('div');
    const card = document.createElement('div');
    const cardBody = document.createElement('div');
    const cardTitle = document.createElement('h5');
    const weatherIcon = document.createElement('img');
    const tempEl = document.createElement('p');
    const windEl = document.createElement('p');
    const humidityEl = document.createElement('p');

    col.append(card);
    card.append(cardBody);
    cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

    col.classList.add('col-auto');
    card.classList.add('forecast-card', 'card', 'text-white', 'bg-primary', 'h-100');
    cardBody.classList.add('card-body', 'p-2');
    cardTitle.classList.add('card-title');
    tempEl.classList.add('card-text');
    windEl.classList.add('card-text');
    humidityEl.classList.add('card-text');

    return { col, cardTitle, weatherIcon, tempEl, windEl, humidityEl };
  }

  static createHistoryButton(city: string) {
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', 'today forecast');
    btn.classList.add('history-btn', 'btn', 'btn-secondary', 'col-10');
    btn.textContent = city;

    return btn;
  }

  static createDeleteButton() {
    const delBtnEl = document.createElement('button');
    delBtnEl.setAttribute('type', 'button');
    delBtnEl.classList.add('fas', 'fa-trash-alt', 'delete-city', 'btn', 'btn-danger', 'col-2');
    delBtnEl.addEventListener('click', handleDeleteHistoryClick);

    return delBtnEl;
  }

  static createHistoryDiv() {
    const div = document.createElement('div');
    div.classList.add('display-flex', 'gap-2', 'col-12', 'm-1');
    return div;
  }

  static buildHistoryListItem(city: any) {
    const newBtn = this.createHistoryButton(city.name);
    const deleteBtn = this.createDeleteButton();
    deleteBtn.dataset.city = JSON.stringify(city);
    const historyDiv = this.createHistoryDiv();
    historyDiv.append(newBtn, deleteBtn);
    return historyDiv;
  }
}
function handleDeleteHistoryClick(this: HTMLButtonElement, _ev: MouseEvent) {
  throw new Error('Function not implemented.');
}

