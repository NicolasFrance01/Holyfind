function abrirEditorIglesia(lat, lon) {
    document.getElementById("adminModal").style.display = "block";

    document.getElementById("coordLat").value = lat;
    document.getElementById("coordLon").value = lon;

    Promise.all([
        fetch("/static/data/modificaciones.json").then(r => r.json()),
        fetch("/static/data/galeria.json").then(r => r.json()),
        fetch("/static/data/eventos.json").then(r => r.json())
    ]).then(([mods, fotos, eventos]) => {
    const id = `${lat.toFixed(5)}_${lon.toFixed(5)}`;

    const mod = mods.find(m =>
        m.lat.toFixed(5) == lat.toFixed(5) &&
        m.lon.toFixed(5) == lon.toFixed(5)
    );

    const gal = fotos[id] || [];
    const evs = eventos[id] || [];

    document.getElementById("nombreIglesia").value = mod?.nombre || "";
    document.getElementById("direccionIglesia").value = mod?.direccion || "";
    document.getElementById("tipoIglesia").value = mod?.tipo || "";
    document.getElementById("horariosIglesia").value = mod?.horarios || "";

    const galDiv = document.getElementById("galeriaPreview");
    galDiv.innerHTML = "";
    gal.forEach((img) => {
        galDiv.innerHTML += `<img src="${img}" style="height:60px; margin:5px;">`;
    });

        window.eventosActuales = evs;
        renderizarEventos();
    });
}

document.getElementById("cerrarAdminModal").addEventListener("click", () => {
    document.getElementById("adminModal").style.display = "none";
});

document.getElementById("adminForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const lat = parseFloat(document.getElementById("coordLat").value);
    const lon = parseFloat(document.getElementById("coordLon").value);
    const id = `${lat.toFixed(5)}_${lon.toFixed(5)}`;

    const nuevaModificacion = {
        lat,
        lon,
        nombre: document.getElementById("nombreIglesia").value,
        direccion: document.getElementById("direccionIglesia").value,
        tipo: document.getElementById("tipoIglesia").value,
        horarios: document.getElementById("horariosIglesia").value
    };

    const nuevasImagenes = [];
    const inputImagenes = document.getElementById("nuevaImagen");
    for (let img of inputImagenes.files) {
        nuevasImagenes.push(URL.createObjectURL(img));
    }

    const eventos = window.eventosActuales || [];

    // Simulamos guardado
    console.log("➡️ Modificación:", nuevaModificacion);
    console.log("➡️ Galería (nuevas):", nuevasImagenes);
    console.log("➡️ Eventos:", eventos);

    alert("✅ Cambios preparados para guardar (ver consola)");
});

function agregarEvento() {
    const desde = document.getElementById("fechaDesdeEvento").value;
    const hasta = document.getElementById("fechaHastaEvento").value;
    const titulo = document.getElementById("tituloEvento").value;
    const descripcion = document.getElementById("descripcionEvento").value;
    const imagen = document.getElementById("imagenEvento").files[0];

    if (!desde || !hasta || !titulo) {
        alert("Faltan campos obligatorios (fecha desde, hasta o título)");
        return;
    }

    const evento = {
        desde,
        hasta,
        titulo,
        descripcion,
        imagen: imagen ? URL.createObjectURL(imagen) : null
    };

    window.eventosActuales.push(evento);
    renderizarEventos();
}

function renderizarEventos() {
    const lista = document.getElementById("listaEventos");
    lista.innerHTML = "";

    window.eventosActuales.forEach((ev, i) => {
        lista.innerHTML += `
        <li>
            📅 ${ev.desde} → ${ev.hasta}<br>
            <b>${ev.titulo}</b><br>
            ${ev.descripcion || ""}<br>
            ${ev.imagen ? `<img src="${ev.imagen}" style="height:40px">` : ""}
            <br><button onclick="eliminarEvento(${i})">❌ Eliminar</button>
            <hr>
        </li>
        `;
    });
}

function eliminarEvento(idx) {
    window.eventosActuales.splice(idx, 1);
    renderizarEventos();
}
