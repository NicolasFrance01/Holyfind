navigator.geolocation.getCurrentPosition((position) => {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const map = L.map('map').setView([lat, lon], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);

  L.marker([lat, lon]).addTo(map)
    .bindPopup('Estás acá')
    .openPopup();

  const selectFiltro = document.getElementById("filtroIglesia");

  function updateMap(filtro) {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.options.customMarker) {
        map.removeLayer(layer);
      }
    });
    loadLocalIglesias(map, filtro);
    fetchIglesias(map, lat, lon, filtro);
  }

  if (selectFiltro) {
    updateMap(selectFiltro.value);
    selectFiltro.addEventListener("change", () => updateMap(selectFiltro.value));
  } else {
    updateMap("todas");
  }
});

// Solicitud iglesia
document.getElementById("solicitarBtn").addEventListener("click", () => {
  document.getElementById("formPopup").style.display = "block";
});
document.getElementById("cerrarPopup").addEventListener("click", () => {
  document.getElementById("formPopup").style.display = "none";
});
document.getElementById("solicitudForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  fetch("/enviar-solicitud", {
    method: "POST",
    body: formData
  })
    .then(() => {
      alert("Solicitud enviada con éxito. Será creada en 48hs a 72hs.");
      document.getElementById("formPopup").style.display = "none";
    })
    .catch(() => {
      alert("Error al enviar solicitud.");
    });
});

function fetchIglesias(map, lat, lon, filtro = "todas") {
  const overpassUrl = "https://overpass-api.de/api/interpreter";
  const query = `
    [out:json];
    (
      node["amenity"="place_of_worship"](around:4000,${lat},${lon});
      way["amenity"="place_of_worship"](around:4000,${lat},${lon});
      relation["amenity"="place_of_worship"](around:4000,${lat},${lon});
    );
    out center tags;
  `;

  let modificaciones = [];

  fetch("/Holyfind/static/data/modificaciones.json")
    .then(res => res.json())
    .then(data => {
      modificaciones = data;
    })
    .finally(() => {
      fetch(overpassUrl, {
        method: "POST",
        body: query.trim()
      })
        .then((res) => res.json())
        .then((data) => {
          data.elements.forEach((el) => {
            const coords = el.type === "node"
              ? [el.lat, el.lon]
              : [el.center.lat, el.center.lon];

            const religion = el.tags.religion || "";
            const denom = el.tags.denomination || "";

            const filtroMin = filtro.toLowerCase();
            if (
              filtroMin !== "todas" &&
              !religion.toLowerCase().includes(filtroMin) &&
              !denom.toLowerCase().includes(filtroMin)
            ) return;

            const mod = modificaciones.find(m =>
              Math.abs(m.lat - coords[0]) < 0.0001 &&
              Math.abs(m.lon - coords[1]) < 0.0001
            );

            const name = mod?.nombre || el.tags.name || "Iglesia sin nombre";
            const descripcion = mod?.descripcion || generarDescripcion(el.tags);
            const iconUrl = mod?.icono || "/Holyfind/static/img/churchCris-removebg-preview.png";

            const popup = `
              <b>${name}</b><br>
              ${descripcion}<br>
              <a href="https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}" target="_blank">
                🧭 Cómo llegar
              </a><br>
              <a href="#" onclick="abrirEditorIglesia(${coords[0]}, ${coords[1]})">📝 Actualizar</a>
            `;

            L.marker(coords, {
              icon: L.icon({
                iconUrl,
                iconSize: [30, 30]
              }),
              customMarker: true
            }).addTo(map).bindPopup(popup);
          });
        })
        .catch((err) => {
          console.error("Error al cargar iglesias:", err);
        });
    });
}

function loadLocalIglesias(map, filtro = "todas") {
  fetch("/static/data/iglesias.json")
    .then(res => res.json())
    .then(data => {
      data.forEach((igle) => {
        if (
          filtro !== "todas" &&
          igle.tipo.toLowerCase() !== filtro.toLowerCase()
        ) return;

        const popup = `
          <b>${igle.nombre}</b><br>
          <i style="color:${igle.tipo === 'evangelical' ? '#1388cc' : '#e4a600'}">
            ${igle.tipo.charAt(0).toUpperCase() + igle.tipo.slice(1)}
          </i><br>
          📍 ${igle.direccion}<br>
          ⏰ ${igle.horarios}<br>
          <a href="https://www.google.com/maps/search/?api=1&query=${igle.lat},${igle.lon}" target="_blank">
            🧭 Cómo llegar
          </a><br>
          <a href="#" onclick="abrirEditorIglesia(${igle.lat}, ${igle.lon})">📝 Actualizar</a>
        `;

        L.marker([igle.lat, igle.lon], {
          icon: L.icon({
            iconUrl: igle.logo || "/Holyfind/static/img/default.png",
            iconSize: [30, 30]
          }),
          customMarker: true
        }).addTo(map).bindPopup(popup);
      });
    });
}

function generarDescripcion(tags) {
  const religion = tags.religion || "";
  const denom = tags.denomination || "";

  if (denom.toLowerCase().includes("evangelical")) {
    return `<i style="color: rgb(19, 136, 204);">Evangélica</i>`;
  } else if (religion.toLowerCase().includes("christian")) {
    return `<i style="color: rgb(236, 197, 23);">Cristiana</i>`;
  } else if (religion !== "") {
    return `<i>${religion}${denom ? " - " + denom : ""}</i>`;
  } else {
    return `<i>Sin denominación definida</i>`;
  }
}



