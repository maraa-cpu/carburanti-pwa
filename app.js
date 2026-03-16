const btn = document.getElementById('geo-btn');
const errorP = document.getElementById('error');
const mapDiv = document.getElementById('map');

let map; 
let userMarker; 

btn.addEventListener('click', () => {
  errorP.style.display = 'none';
  btn.innerText = "⏳ Ricerca in corso..."; 

  if (!navigator.geolocation) {
    showError('GPS non supportato dal browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      btn.innerText = "📍 Posizione trovata!";
      mapDiv.style.display = 'block';

      if (!map) {
        map = L.map('map').setView([lat, lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        userMarker = L.marker([lat, lng]).addTo(map)
          .bindPopup("<b>Tu sei qui!</b>").openPopup();
      } else {
        map.setView([lat, lng], 14);
        userMarker.setLatLng([lat, lng]);
      }
    },
    (error) => {
      btn.innerText = "📍 Riprova";
      showError('Impossibile ottenere la posizione. Hai dato i permessi?');
    }
  );
});

function showError(msg) {
  errorP.innerText = msg;
  errorP.style.display = 'block';
}
