fetch('https://geocoding-api.open-meteo.com/v1/search?name=Madrid&count=5&language=es')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d)))
  .catch(console.error);
