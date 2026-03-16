const btn = document.getElementById('geo-btn');
const errorP = document.getElementById('error');
const mapDiv = document.getElementById('map');

let map; 
let userMarker; 
let stationMarkers = []; 

// I link ufficiali del Ministero passati attraverso un "ponte" (Proxy) per evitare blocchi
const PROXY = "https://api.allorigins.win/raw?url=";
const URL_ANAGRAFICA = PROXY + encodeURIComponent("https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv");
const URL_PREZZI = PROXY + encodeURIComponent("https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv");

btn.addEventListener('click', () => {
  errorP.style.display = 'none';
  btn.innerText = "📍 Trovo la tua posizione..."; 

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      btn.innerText = "⏳ Scarico i dati nazionali dal Ministero (può volerci un po')...";
      mapDiv.style.display = 'block';

      if (!map) {
        map = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup("<b>Tu sei qui!</b>").openPopup();
      } else {
        map.setView([lat, lng], 13);
        userMarker.setLatLng([lat, lng]);
      }

      fetchRealData(lat, lng);
    },
    () => showError('Impossibile ottenere la posizione.')
  );
});

function showError(msg) {
  errorP.innerText = msg;
  errorP.style.display = 'block';
  btn.innerText = "📍 Riprova";
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function fetchRealData(userLat, userLng) {
  Papa.parse(URL_ANAGRAFICA, {
    download: true,
    delimiter: "|", 
    header: true,
    complete: function(resultsAnagrafica) {
      let distributoriVicini = {};
      resultsAnagrafica.data.forEach(impianto => {
        if(impianto.Latitudine && impianto.Longitudine) {
          const dist = getDistance(userLat, userLng, parseFloat(impianto.Latitudine), parseFloat(impianto.Longitudine));
          if(dist < 5) {
            distributoriVicini[impianto.idImpianto] = {
              nome: impianto.Bandiera,
              indirizzo: impianto.Indirizzo,
              lat: parseFloat(impianto.Latitudine),
              lng: parseFloat(impianto.Longitudine),
              prezzi: []
            };
          }
        }
      });

      btn.innerText = "📊 Calcolo i prezzi più bassi...";
      Papa.parse(URL_PREZZI, {
        download: true,
        delimiter: "|",
        header: true,
        complete: function(resultsPrezzi) {
          
          resultsPrezzi.data.forEach(prezzo => {
            if (distributoriVicini[prezzo.idImpianto] && prezzo.isSelf === "1") { // Mostriamo solo i prezzi Self-Service
              distributoriVicini[prezzo.idImpianto].prezzi.push({
                tipo: prezzo.descCarburante,
                costo: parseFloat(prezzo.prezzo)
              });
            }
          });

          disegnaSullaMappa(distributoriVicini);
          btn.innerText = "✅ Dati aggiornati a oggi!";
        }
      });
    }
  });
}

function disegnaSullaMappa(distributoriVicini) {
  stationMarkers.forEach(marker => map.removeLayer(marker));
  stationMarkers = [];

  Object.values(distributoriVicini).forEach(dist => {
    if (dist.prezzi.length === 0) return; // Saltiamo quelli senza prezzi comunicati

    let prezziHTML = dist.prezzi
      .filter(p => p.tipo.includes('Benzina') || p.tipo.includes('Gasolio')) // Filtriamo solo benzina e diesel
      .map(p => `<b>${p.tipo}:</b> € ${p.costo.toFixed(3)}`)
      .join('<br>');

    const popupText = `
      <div style="text-align: center; min-width: 150px;">
        <h3 style="margin: 0; color: #2f3d58;">⛽ ${dist.nome}</h3>
        <p style="margin: 5px 0; font-size: 12px; color: gray;">${dist.indirizzo}</p>
        <div style="background: #e8f5e9; padding: 10px; border-radius: 8px;">
          ${prezziHTML}
        </div>
      </div>
    `;

    const marker = L.marker([dist.lat, dist.lng]).addTo(map).bindPopup(popupText);
    stationMarkers.push(marker);
  });
}
