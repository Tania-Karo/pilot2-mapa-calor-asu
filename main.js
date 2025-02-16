
/*
Este script crea un mapa con una imagen satelital y un archivo GeoJSON superpuesto.
Pasamos la imagen satelital en formato GeoTIFF a una imagen PNG con GDAL.
Extraemos la información de la imagen satelital (sus metadatos, con GDAL) para definir los límites del mapa. 
*/


// Variables globales
let map, imageLayer, tileTonerLite, tileOSM, geoJsonLayer, sidebar;

function makeMap() {

    // Estos son los límites de la imagen satelital
    let lowerLeft = [-25.70095, -57.83323]; 
    let upperRight = [-24.8821, -57.14187];
    // let center = [-25.29196, -57.48639]; (CENTRO DE LA IMAGEN SATELITAL)
    let center = [-25.295239, -57.625608]; // Arbitrario, desicion estetica de taka.

    // Definir los límites del mapa según la imagen satelital
    // let bounds = L.latLngBounds(lowerLeft, upperRight);
    let corner1 = L.latLng(lowerLeft[0], lowerLeft[1]);
    let corner2 = L.latLng(upperRight[0], upperRight[1]);
    let bounds = L.latLngBounds(corner1, corner2);

    let imageBounds = [lowerLeft, upperRight];

    // Inicializamos el mapa y establecemos su vista en las coordenadas geográficas elegidas y un nivel de zoom
    // Las coordenadas geográficas son las del centro de la imagen satelital.
    map = L.map('map', {
        center: center,
        zoom: 14,
        // maxZoom: 19,     Opcional: fuerza un zoom máximo en el área
        minZoom: 11.5, 
        maxBounds: bounds, // Restringe el área visible
        maxBoundsViscosity: 1.0 // Mantiene al usuario dentro de los límites
    });

    tileOSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    function addTileLayer(map) {
    // Agregamos una capa de tiles al mapa. En este caso, es la capa 'toner-lite' de StadiaMaps
    // Stadia_StamenTonerLite
    let tileUrl = 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}';
    tileTonerLite = L.tileLayer(tileUrl, {
        minZoom: 0,
	    maxZoom: 20,
	    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	    ext: 'png',
        bounds: bounds
    })
    
    tileTonerLite.addTo(map);
    }

    let imageUrl = 'https://tania-karo.github.io/pilot2-mapa-calor-asu/imagenes/mapa-calor-asu.png';
    function addImageOverlay(map, imageUrl, imageBounds) {
    // Agregamos la imagen satelital
    //let imageBounds = [lowerLeft, upperRight];
    imageLayer = L.imageOverlay(imageUrl, imageBounds, { opacity: 0.7 }).addTo(map);
    }

    // map.setMaxBounds(bounds); // Restringe la vista dentro de la imagen satelital
    // map.fitBounds(bounds);    // Ajusta el zoom para que la imagen se vea bien

    let geojsonUrl = 'https://raw.githubusercontent.com/Tania-Karo/pilot2-mapa-calor-asu/refs/heads/main/escuelas-piloto-3.geojson';
    function addGeoJSON(map, geojsonUrl) {
    let myIcon = L.icon({
        iconUrl: 'https://tania-karo.github.io/pilot2-mapa-calor-asu/imagenes/icon-1.png',
        iconSize:     [64, 64], // size of the icon
        iconAnchor:   [32, 64], // point of the icon which will correspond to marker's location
        popupAnchor:  [0, -64] // point from which the popup should open relative to the iconAnchor
    });

    // let myIcon = L.divIcon({className: 'leaflet-div-icon'});

    // Cargar archivo GeoJSON
    fetch(geojsonUrl)  // Ajusta la ruta si es necesario
    .then(response => response.ok ? response.json() : Promise.reject(`Error fetching GeoJSON: ${response.status}`))
    .then(data => {
        geoJsonLayer = L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                // Crear marcador con ícono personalizado
                // return L.marker(latlng, { icon: myIcon });
                return L.marker(latlng, { icon: myIcon });
            },
            onEachFeature: (feature, layer) => {
                let name = feature.properties?.Name || "Sin nombre";
                layer.bindPopup(name);
                // Manejar el click en el marcador
                layer.on('click', function() {
                    // Actualizar el contenido del sidebar con el valor de "Name"
                    document.getElementById("escuelaName").textContent = name; // Actualizar título
                    document.getElementById("escuelaInfo").textContent = `Información sobre ${name}`; // Actualizar descripción

                    // Abrir el sidebar si no está abierto
                    sidebar.open('escuela');

                     // Centrar el mapa en el marcador y hacer zoom
                     map.setView(layer.getLatLng(), 18, { animate: true }); // Centra el mapa en el marcador con zoom 16 (ajustar si es necesario)
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error cargando GeoJSON:', error));
    }

    function addSidebar(map) {
    // Agregamos sidebar
    sidebar = L.control.sidebar({
        autopan: false,       // whether to maintain the centered map point when opening the sidebar
        closeButton: true,    // whether to add a close button to the panes
        container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
        position: 'left',     // left or right
    }).addTo(map);
    sidebar.open('home');

    // events
    sidebar.on('content', function(e) {
        // e.id contains the id of the opened panel
    });

    /* add a button with click listener 
    sidebar.addPanel({
        id: 'click',
        tab: '<i class="fa fa-info"></i>',
        button: function (event) { console.log(event); },
        position: 'bottom'
    });

    sidebar.addPanel({
        id: 'click',
        tab: '<i class="fa fa-info"></i>',
        button: function (event) { console.log(event); },
        position: 'bottom'
    });
    */

    /* add an external link */
    sidebar.addPanel({
        id: 'ghlink',
        tab: '<i class="fa fa-github"></i>',
        button: 'https://github.com/EsConsenso',
        position: 'bottom'
    });

    }

    // Llamamos a la función que agrega la capa de tiles al mapa
    addTileLayer(map);

    // Llamamos a la función que agrega la imagen satelital
    addImageOverlay(map, imageUrl, imageBounds);

    // Llamamos a la función que agrega el GeoJSON al mapa
    addGeoJSON(map, geojsonUrl);

    // Llamamos a la función que agrega el sidebar al mapa
    addSidebar(map);

    /*
    document.addEventListener("DOMContentLoaded", function () {
        const tabs = document.querySelectorAll(".tabs");
        const panes = document.querySelectorAll(".leaflet-sidebar-pane");
    
        tabs.forEach(tab => {
            tab.addEventListener("click", function (event) {
                event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
    
                // Remover la clase "active" de todos los tabs y panes
                tabs.forEach(t => t.classList.remove("active"));
                panes.forEach(p => p.classList.remove("active"));
    
                // Obtener el ID del panel asociado al tab clickeado
                const targetPane = document.querySelector(tab.querySelector("a").getAttribute("href"));
    
                // Agregar la clase "active" solo al tab y panel correspondiente
                if (targetPane) {
                    tab.classList.add("active");
                    targetPane.classList.add("active");
                }
            });
        });
    });
    */
        /*
        document.addEventListener("DOMContentLoaded", function () {
            const tabs = document.querySelectorAll(".tabs a"); // Seleccionamos los enlaces dentro de los tabs
            const panes = document.querySelectorAll(".leaflet-sidebar-pane");

            tabs.forEach(tab => {
                tab.addEventListener("click", function (event) {
                    event.preventDefault(); // Evita que el enlace navegue a otro lugar

                    const targetPaneId = this.getAttribute("href"); // Obtiene el ID del panel asociado
                    const targetPane = document.querySelector(targetPaneId); // Busca el panel correspondiente

                    if (!targetPane) return; // Si no existe el panel, salir

                    // Remover la clase "active" de todos los tabs y panes
                    document.querySelectorAll(".tabs").forEach(t => t.classList.remove("active"));
                    panes.forEach(p => p.classList.remove("active"));

                    // Agregar la clase "active" al tab actual y al panel correspondiente
                    this.parentElement.classList.add("active");
                    targetPane.classList.add("active");
                });
    });
});
*/
    // para cambiar el color por defecto de los headers de los paneles
    document.addEventListener("DOMContentLoaded", function () {
        const panes = document.querySelectorAll(".leaflet-sidebar-pane");

        panes.forEach(pane => {
            pane.classList.remove("active"); // Aseguramos que al inicio ningún pane tenga "active"
        });

        document.querySelectorAll(".tabs a").forEach(tab => {
            tab.addEventListener("click", function (event) {
                event.preventDefault();

                const targetPaneId = this.getAttribute("href"); // ID del panel destino
                const targetPane = document.querySelector(targetPaneId);

                if (!targetPane) return;

                // Remover "active" de todos los panes
                panes.forEach(p => p.classList.remove("active"));

                // Agregar "active" solo al pane correspondiente
                targetPane.classList.add("active");

                // Cambiar el fondo del heading solo si el pane está activo
                const header = targetPane.querySelector(".leaflet-sidebar-header");
                if (header) {
                    document.querySelectorAll(".leaflet-sidebar-header").forEach(h => {
                        h.style.backgroundColor = ""; // Resetear todos los headers
                        h.style.color = "";
                    });

                    header.style.backgroundColor = "#0b3954"; 
                    header.style.color = "#fff";
                }
            });
        });
    });

    // Para cambiar el color de los iconos del sidebar
    document.addEventListener("DOMContentLoaded", function () {
        const tabs = document.querySelectorAll(".tabs a"); // Seleccionar los enlaces dentro de los tabs
        const panes = document.querySelectorAll(".leaflet-sidebar-pane");
    
        tabs.forEach(tab => {
            tab.addEventListener("click", function (event) {
                event.preventDefault(); 
    
                const targetPaneId = this.getAttribute("href"); // Obtener el ID del panel
                const targetPane = document.querySelector(targetPaneId);
    
                if (!targetPane) return; 
    
                // Remover "active" de todos los tabs y panes
                document.querySelectorAll(".tabs").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".leaflet-sidebar-tabs > li").forEach(li => li.classList.remove("active"));
                panes.forEach(pane => pane.classList.remove("active"));
    
                // Agregar "active" al tab actual y al panel correspondiente
                this.parentElement.classList.add("active");
                targetPane.classList.add("active");
            });
        });
    });
    
}


function verMapaCalor() {
    if (!imageLayer || !map) return; // Evita errores si el mapa aún no está cargado
    imageLayer.setOpacity(1);         // Opacidad total
    map.removeLayer(tileTonerLite);    // Ocultar calles
    if (geoJsonLayer) map.removeLayer(geoJsonLayer); // Ocultar GeoJSON si está cargado
    map.setZoom(11.5);

    sidebar.close();
}

function verMapaCombinado() {
    if (!imageLayer || !map) return; // Evita errores si el mapa aún no está cargado
    
    // Restaurar la capa de calles
    map.addLayer(tileTonerLite);  // Añadir la capa de calles que habíamos removido

    // Restaurar el GeoJSON
    if (geoJsonLayer) map.addLayer(geoJsonLayer); // Añadir de nuevo el GeoJSON si fue removido

    // Restaurar la imagen satelital (opacidad original)
    imageLayer.setOpacity(0.7); // Restaurar opacidad original, si es lo que deseas

    // Restaurar el zoom original
    map.setView(map.getCenter(), 14);  // Ajustar el zoom al nivel original (en este caso 14)

    // Abrir el sidebar de nuevo si lo deseas
    if (sidebar) sidebar.open('home');
    
    // Si el sidebar estaba cerrado, se abriría nuevamente
}



// Cargar mapa al cargar la página
document.addEventListener("DOMContentLoaded", function () {
    makeMap(); // Inicializa el mapa

    // Evento para el botón "Ver mapa calor"
    document.getElementById("btn-mapa-calor").addEventListener("click", verMapaCalor);

    // Evento para el botón "Ver mapa combinado"
    document.getElementById("btn-mapa-combinado").addEventListener("click", verMapaCombinado); // Aquí agregas el evento del nuevo botón
});
