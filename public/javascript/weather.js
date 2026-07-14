document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.getElementById("city-input");
    const searchBtn = document.getElementById("search-btn");
    const weatherBody = document.getElementById("weather-body");
    const welcomeState = document.getElementById("welcome-state");
    const errorMessage = document.getElementById("error-message");

    // Dynamic UI Target Nodes
    const locationName = document.getElementById("location-name");
    const weatherIcon = document.getElementById("weather-icon");
    const temperatureText = document.getElementById("temperature-text");
    const conditionDesc = document.getElementById("condition-desc");
    const humidityText = document.getElementById("humidity-text");
    const windText = document.getElementById("wind-text");

    const API_KEY = "72d8ef9ab42ee8b0f561219a04882189";

    // --- Core Action Event Drivers ---
    searchBtn.addEventListener("click", () => {
        const city = cityInput.value.trim();
        if (city) fetchLiveWeather(city);
    });

    cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const city = cityInput.value.trim();
            if (city) fetchLiveWeather(city);
        }
    });

    // --- Diagnostic Live API Fetch Engine ---
    async function fetchLiveWeather(city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

        try {
            errorMessage.classList.add("hidden");

            // 1. START LOADING STATE
            searchBtn.innerText = "Loading...";
            searchBtn.disabled = true;

            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`Server responded with status: ${response.status}`);
                throw new Error("Location registry miss.");
            }

            const data = await response.json();
            updateWeatherUI(data);

        } catch (error) {
            console.error("API Pipeline Error:", error);
            weatherBody.classList.add("hidden");
            welcomeState.classList.add("hidden");
            errorMessage.classList.remove("hidden");
        } finally {
            // 2. STOP LOADING STATE (This runs whether the API call succeeds OR fails)
            searchBtn.innerText = "Search";
            searchBtn.disabled = false;
        }
    }

    // --- DOM Interface Mapping Logic ---
    function updateWeatherUI(data) {
        locationName.innerText = `${data.name}, ${data.sys.country}`;
        temperatureText.innerText = `${Math.round(data.main.temp)}°C`;
        conditionDesc.innerText = data.weather[0].description;
        humidityText.innerText = `${data.main.humidity}%`;
        windText.innerText = `${Math.round(data.wind.speed * 3.6)} km/h`;

        // Map server weather group codes to native rich UI emojis
        const mainCondition = data.weather[0].main.toLowerCase();
        if (mainCondition.includes("cloud")) weatherIcon.innerText = "☁️";
        else if (mainCondition.includes("rain") || mainCondition.includes("drizzle")) weatherIcon.innerText = "🌧️";
        else if (mainCondition.includes("clear")) weatherIcon.innerText = "☀️";
        else if (mainCondition.includes("snow")) weatherIcon.innerText = "❄️";
        else if (mainCondition.includes("thunderstorm")) weatherIcon.innerText = "⛈️";
        else weatherIcon.innerText = "🌫️";

        welcomeState.classList.add("hidden");
        weatherBody.classList.remove("hidden");
    }
});