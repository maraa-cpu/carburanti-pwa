const btn = document.getElementById('geo-btn');
const resultDiv = document.getElementById('result');
const latSpan = document.getElementById('lat');
const lngSpan = document.getElementById('lng');
const errorP = document.getElementById('error');

btn.addEventListener('click', () => {
  resultDiv.classList.add('hidden');
  errorP.classList.add('hidden');

  if (!navigator.geolocation) {
    errorP.innerText = 'La geolocalizzazione non è supportata dal tuo browser.';
    errorP.classList.remove('hidden');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      latSpan.innerText = position.coords.latitude;
      lngSpan.innerText = position.coords.longitude;
      resultDiv.classList.remove('hidden');
    },
    (error) => {
      errorP.innerText = 'Impossibile recuperare la posizione. Hai cliccato "Consenti"?';
      errorP.classList.remove('hidden');
    }
  );
});