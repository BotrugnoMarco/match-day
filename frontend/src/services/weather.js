import axios from 'axios';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

export const getWeatherForLocation = async (locationName, date) => {
    if (!locationName) return null;

    try {
        const cleanLocation = locationName.trim();
        console.log('WeatherService: Searching for location:', cleanLocation);

        let latitude, longitude, name, country;

        // Check if locationName is actually coordinates
        // Supports: "41.9, 12.5", "41.9; 12.5", "41.9 12.5"
        const coordMatch = cleanLocation.match(/^(-?\d+(\.\d+)?)[,;\s]\s*(-?\d+(\.\d+)?)$/);

        if (coordMatch) {
            console.log('WeatherService: Input detected as coordinates');
            latitude = parseFloat(coordMatch[1]);
            longitude = parseFloat(coordMatch[3]);
            name = "Posizione selezionata";
            country = "";
        } else {
            // 1. Geocoding: Get Lat/Lon from location name
            let result = null;

            // First try: Search for the full location string
            try {
                const geoResponse = await axios.get(GEOCODING_API, {
                    params: {
                        name: cleanLocation,
                        count: 5,
                        language: 'it',
                        format: 'json'
                    }
                });
                if (geoResponse.data.results && geoResponse.data.results.length > 0) {
                    result = geoResponse.data.results[0];
                }
            } catch (e) {
                console.warn('WeatherService: Error in primary geocoding search', e);
            }

            // Second try: If not found, try splitting by comma and searching for parts
            if (!result && cleanLocation.includes(',')) {
                console.log('WeatherService: Exact location not found, trying parts (comma)...');
                const parts = cleanLocation.split(',').map(p => p.trim());

                for (let i = parts.length - 1; i >= 0; i--) {
                    const part = parts[i];
                    if (part.length < 3) continue;

                    console.log('WeatherService: Searching for part:', part);
                    try {
                        const partResponse = await axios.get(GEOCODING_API, {
                            params: { name: part, count: 1, language: 'it', format: 'json' }
                        });
                        if (partResponse.data.results && partResponse.data.results.length > 0) {
                            result = partResponse.data.results[0];
                            console.log('WeatherService: Found location via part:', result.name);
                            break;
                        }
                    } catch (e) {
                        console.warn('WeatherService: Error searching for part:', part, e);
                    }
                }
            }

            // Third try: If still not found, try splitting by space (for addresses like "Via Roma Milano")
            if (!result && cleanLocation.includes(' ')) {
                console.log('WeatherService: Exact location not found, trying parts (space)...');
                const parts = cleanLocation.split(' ').map(p => p.trim());

                // Only check the last 2 significant words (likely City or Region)
                let checks = 0;
                for (let i = parts.length - 1; i >= 0; i--) {
                    const part = parts[i];
                    if (part.length < 3) continue; // Skip short words
                    if (checks >= 2) break; // Don't search the whole address word by word

                    checks++;
                    console.log('WeatherService: Searching for word:', part);
                    try {
                        const partResponse = await axios.get(GEOCODING_API, {
                            params: { name: part, count: 1, language: 'it', format: 'json' }
                        });
                        if (partResponse.data.results && partResponse.data.results.length > 0) {
                            result = partResponse.data.results[0];
                            console.log('WeatherService: Found location via word:', result.name);
                            break;
                        }
                    } catch (e) {
                        console.warn('WeatherService: Error searching for word:', part, e);
                    }
                }
            }

            if (!result) {
                console.warn('WeatherService: Location not found for:', cleanLocation);
                // Return null instead of throwing to avoid cluttering console with errors for valid but unknown locations
                return null;
            }

            latitude = result.latitude;
            longitude = result.longitude;
            name = result.name;
            country = result.country;
        }

        // 2. Weather: Get forecast for specific date
        // Open-Meteo requires date in YYYY-MM-DD format
        const dateObj = new Date(date);
        const dateStr = dateObj.toISOString().split('T')[0];

        // Check if date is in the past (Open-Meteo free tier has limited historical data, but let's assume future/recent)
        // Or if it's too far in the future (more than 14 days)

        const weatherResponse = await axios.get(WEATHER_API, {
            params: {
                latitude,
                longitude,
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                timezone: 'auto',
                start_date: dateStr,
                end_date: dateStr
            }
        });

        if (!weatherResponse.data.daily) {
            throw new Error('Weather data not available');
        }

        const daily = weatherResponse.data.daily;

        return {
            location: `${name}, ${country}`,
            date: dateStr,
            maxTemp: daily.temperature_2m_max[0],
            minTemp: daily.temperature_2m_min[0],
            precipProb: daily.precipitation_probability_max[0],
            weatherCode: daily.weather_code[0]
        };

    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
};

export const getWeatherIcon = (code) => {
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    const icons = {
        0: 'sunny', // Clear sky
        1: 'partly-sunny', // Mainly clear
        2: 'partly-sunny', // Partly cloudy
        3: 'cloudy', // Overcast
        45: 'cloudy', // Fog
        48: 'cloudy', // Depositing rime fog
        51: 'rainy', // Drizzle: Light
        53: 'rainy', // Drizzle: Moderate
        55: 'rainy', // Drizzle: Dense intensity
        61: 'rainy', // Rain: Slight
        63: 'rainy', // Rain: Moderate
        65: 'rainy', // Rain: Heavy
        71: 'snow', // Snow fall: Slight
        73: 'snow', // Snow fall: Moderate
        75: 'snow', // Snow fall: Heavy
        80: 'rainy', // Rain showers: Slight
        81: 'rainy', // Rain showers: Moderate
        82: 'rainy', // Rain showers: Violent
        95: 'thunderstorm', // Thunderstorm: Slight or moderate
        96: 'thunderstorm', // Thunderstorm with slight hail
        99: 'thunderstorm', // Thunderstorm with heavy hail
    };

    return icons[code] || 'help-circle';
};

export const getWeatherDescription = (code) => {
    const descriptions = {
        0: 'weather.clear_sky',
        1: 'weather.mainly_clear',
        2: 'weather.partly_cloudy',
        3: 'weather.overcast',
        45: 'weather.fog',
        48: 'weather.fog',
        51: 'weather.drizzle',
        53: 'weather.drizzle',
        55: 'weather.drizzle',
        61: 'weather.rain',
        63: 'weather.rain',
        65: 'weather.rain',
        71: 'weather.snow',
        73: 'weather.snow',
        75: 'weather.snow',
        80: 'weather.showers',
        81: 'weather.showers',
        82: 'weather.showers',
        95: 'weather.thunderstorm',
        96: 'weather.thunderstorm',
        99: 'weather.thunderstorm',
    };
    return descriptions[code] || 'weather.unknown';
};
