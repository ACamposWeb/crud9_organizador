// ===============================
//  VARIABLES GLOBALES
// ===============================
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
let indexEliminar = null;
let modoEdicion = false;
let indiceEdicion = null;
let graficoEventos = null;
let mapa;
let marcador;
let indiceBorrador = null;
let idBorradorActual = null;
// ===============================
//  INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

    try {

        // ==========================
        // Cargar componentes
        // ==========================
        const navbarResponse = await fetch("navbar.html");
        const navbarHtml = await navbarResponse.text();
        document.getElementById("navbar-container")?.insertAdjacentHTML("afterbegin", navbarHtml);

        const sidebarResponse = await fetch("sidebar.html");
        const sidebarHtml = await sidebarResponse.text();
        document.getElementById("sidebar-container")?.insertAdjacentHTML("afterbegin", sidebarHtml);

        // Marcar página activa
        const paginaActual = window.location.pathname.split("/").pop();

        const contenedorMapa = document.getElementById('mapa');

        document.querySelectorAll("#sidebar-container a").forEach(link => {
            if (link.getAttribute("href") === paginaActual) {
                link.classList.add("active");
            }
        });

        // ==========================
        // Dashboard
        // ==========================
        mostrarEventosDashboard();
        actualizarResumen();
        iniciarWorkerMetricas();
        actualizarReportes();
            if (contenedorMapa) {
            mapaInit();
        }

        // ==========================
        // Eventos
        // ==========================
        mostrarEventosTabla();
        mostrarBorradores();

        document.getElementById("buscador")
            ?.addEventListener("input", aplicarFiltros);

        document.getElementById("filtroTipo")
            ?.addEventListener("change", aplicarFiltros);

        document.getElementById("filtroFecha")
            ?.addEventListener("change", aplicarFiltros);

        document.getElementById("btnConfirmarEliminar")
            ?.addEventListener("click", eliminarEvento);

        // ==========================
        // Nuevo evento
        // ==========================
        document.getElementById("btnAgregar")
            ?.addEventListener("click", agregarEvento);

        document.getElementById("btnBorrador")
            ?.addEventListener("click", guardarBorrador);

        // ==========================
        // Cargar edición
        // ==========================
        cargarDatosEdicion();
        cargarBorradorFormulario();
        cargarDetalleEvento();

    } catch (error) {
        console.error(error);
    }
});

function mapaInit(){
    mapa = L.map('mapa').setView(
        [13.7214921845406, -89.20285915157561],
        15
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    mapa.on('click', function(e) {

        let lat = e.latlng.lat;
        let lng = e.latlng.lng;

        document.getElementById('latitud').value = lat;
        document.getElementById('longitud').value = lng;

        if (marcador) {
            mapa.removeLayer(marcador);
        }

        marcador = L.marker([lat, lng]).addTo(mapa);
        obtenerDireccion(lat, lng);
    });
    document.getElementById('btnUbicacionActual').addEventListener('click', () => {

        navigator.geolocation.getCurrentPosition(
            (pos) => {

                let lat = pos.coords.latitude;
                let lng = pos.coords.longitude;

                document.getElementById('latitud').value = lat;
                document.getElementById('longitud').value = lng;

                mapa.setView([lat, lng], 16);

                if (marcador) {
                    mapa.removeLayer(marcador);
                }

                marcador = L.marker([lat, lng]).addTo(mapa);
                obtenerDireccion(lat, lng);
            },
            (error) => {
                alert("No se pudo obtener la ubicación");
            }
        );

    });
}
async function obtenerDireccion(lat, lng) {

    try {

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        const data = await response.json();

        console.log(data);

        document.getElementById("lugar").value =
            data.display_name;

    } catch (error) {
        console.error(error);
    }
}
function mostrarUbicacionGuardada(lat, lng, nombreEvento = "Ubicación del evento") {

    if (!mapa) return;

    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (isNaN(lat) || isNaN(lng)) return;

    if (marcador) {
        mapa.removeLayer(marcador);
    }

    marcador = L.marker([lat, lng])
        .addTo(mapa)
        .bindPopup(nombreEvento)
        .openPopup();

    mapa.setView([lat, lng], 16);
}


// ===============================
//  GUARDAR EN LOCALSTORAGE
// ===============================
function guardarEventos() {
    localStorage.setItem("eventos", JSON.stringify(eventos));
}

// ===============================
//  BADGE por tipo
// ===============================
function badgeTipo(tipo) {
    const map = {
        "Bodas":       "badge-gold",
        "Quinceaños":  "badge-purple",
        "Cumpleaños":  "badge-teal",
        "Babyshower":  "badge-purple",
        "Graduación":  "badge-teal",
        "Corporativo": "badge-gold"
    };
    return `<span class="badge ${map[tipo] || 'badge-gold'}">${tipo}</span>`;
}

function badgeEstado(estado) {
    const map = {
        "Confirmado":  "badge-teal",
        "Pendiente":   "badge-gold",
        "En proceso":  "badge-purple",
        "Finalizado":  "badge-gold"
    };
    return `<span class="badge ${map[estado] || 'badge-gold'}">${estado || 'Pendiente'}</span>`;
}

// ===============================
//  DASHBOARD — index.html
// ===============================
function mostrarEventosDashboard() {
    const tabla = document.getElementById("tablaEventos");
    const sinEventos = document.getElementById("sinEventos");
    if (!tabla) return;

    tabla.innerHTML = "";
    const ordenados = [...eventos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const proximos  = ordenados.slice(0, 5);

    if (proximos.length === 0) {
        if (sinEventos) sinEventos.style.display = "block";
        return;
    }
    if (sinEventos) sinEventos.style.display = "none";

    proximos.forEach(ev => {
        const fecha = new Date(ev.fecha + "T00:00:00").toLocaleDateString("es-ES", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });
        tabla.innerHTML += `
            <tr>
                <td class="fw-semibold">${ev.nombre}</td>
                <td>${fecha}</td>
                <td>${badgeTipo(ev.tipo)}</td>
                <td>${badgeEstado(ev.estado)}</td>
            </tr>`;
    });
}

// ===============================
//  TABLA COMPLETA — eventos.html
// ===============================
function mostrarEventosTabla(lista = eventos) {
    const tabla = document.getElementById("tablaEventos");
    const sinEventos = document.getElementById("sinEventos");
    if (!tabla) return;

    tabla.innerHTML = "";

    if (lista.length === 0) {
        if (sinEventos) sinEventos.style.display = "block";
        return;
    }
    if (sinEventos) sinEventos.style.display = "none";

    lista.forEach((ev, index) => {
        const fecha = new Date(ev.fecha + "T00:00:00").toLocaleDateString("es-ES", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });
        tabla.innerHTML += `
            <tr>
                <td class="text-white-50">${String(index + 1).padStart(3, "0")}</td>
                <td class="fw-semibold">${ev.nombre}</td>
                <td>${badgeTipo(ev.tipo)}</td>
                <td>${fecha}</td>
                <td>${badgeEstado(ev.estado)}</td>
                <td>
                    <button class="btn btn-sm btn-dark-glass me-1" onclick="verEvento(${index})" title="Ver"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-dark-glass me-1" onclick="editarEvento(${index})" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger-glass" onclick="confirmarEliminar(${index})" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
    });
}

// ===============================
//  RESUMEN — Dashboard
// ===============================
function actualizarResumen() {
    let bodas = 0, cumple = 0, quince = 0, baby = 0;
    eventos.forEach(e => {
        if (e.tipo === "Bodas")      bodas++;
        if (e.tipo === "Cumpleaños") cumple++;
        if (e.tipo === "Quinceaños") quince++;
        if (e.tipo === "Babyshower") baby++;
    });
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("totalBodas",  bodas);
    set("totalCumple", cumple);
    set("totalQuince", quince);
    set("totalBaby",   baby);
}

// ===============================
//  AGREGAR EVENTO — nuevo_evento.html
// ===============================
function agregarEvento() {
    const nombre        = document.getElementById("nombre");
    const fecha         = document.getElementById("fecha");
    const tipo          = document.getElementById("tipo");
    const lugar         = document.getElementById("lugar");
    const invitados     = document.getElementById("invitados");
    const clienteNombre = document.getElementById("clienteNombre");
    const clienteTel    = document.getElementById("clienteTel");

    if (!nombre) return; // No estamos en nuevo_evento.html

    // Limpiar validaciones previas
    [nombre, fecha, tipo, lugar, invitados, clienteNombre, clienteTel].forEach(el => {
        if (el) el.classList.remove("is-invalid");
    });

    // Validar campos obligatorios
    let valido = true;
    const requeridos = [
        { el: nombre        },
        { el: fecha         },
        { el: tipo          },
        { el: lugar         },
        { el: invitados     },
        { el: clienteNombre },
        { el: clienteTel    }
    ];

    requeridos.forEach(({ el }) => {
        if (el && !el.value.trim()) {
            el.classList.add("is-invalid");
            valido = false;
        }
    });

    if (!valido) {
        mostrarAlerta("Por favor completa los campos obligatorios marcados en rojo.", "danger");
        return;
    }

    // Validar fecha no pasada
    const hoy = new Date().toISOString().split("T")[0];
    if (fecha.value < hoy && fecha.value !== hoy) {
        fecha.classList.add("is-invalid");
        mostrarAlerta("No puedes registrar eventos en fechas pasadas.", "danger");
        return;
    }

    // Recoger servicios seleccionados
    const servicios = [];
    document.querySelectorAll('.servicio-check-card input:checked').forEach(cb => {
        servicios.push(cb.value);
    });

    // Recoger restricciones alimentarias
    const restricciones = [];
    ['veg','vegan','gluten','lactosa','alergias'].forEach(id => {
        if (document.getElementById(id)?.checked) restricciones.push(id);
    });

    // Paquete seleccionado
    const paqueteEl = document.querySelector('.paquete-card.selected');

    const nuevoEvento = {
        nombre:       nombre.value.trim(),
        fecha:        fecha.value,
        tipo:         tipo.value,
        horaInicio:   document.getElementById("horaInicio")?.value || "",
        horaFin:      document.getElementById("horaFin")?.value || "",
        lugar:        lugar.value.trim(),
        invitados:    invitados.value,
        estado:       document.getElementById("estado")?.value || "Pendiente",
        latitud:      document.getElementById("latitud")?.value,
        longitud:     document.getElementById("longitud")?.value,
        cliente: {
            nombre:    clienteNombre.value.trim(),
            dui:       document.getElementById("clienteDui")?.value || "",
            telefono:  clienteTel.value,
            whatsapp:  document.getElementById("clienteWa")?.value || "",
            email:     document.getElementById("clienteEmail")?.value || "",
            direccion: document.getElementById("clienteDireccion")?.value || ""
        },
        paquete:    paqueteEl?.dataset.paquete || "Básico",
        precioPP:   parseFloat(document.getElementById("precioPP")?.value) || 0,
        anticipo:   parseFloat(document.getElementById("anticipo")?.value) || 0,
        formaPago:  document.getElementById("formaPago")?.value || "Efectivo",
        buffet:       document.getElementById("buffet")?.value || "Sin buffet",
        tiempos:      document.getElementById("tiempos")?.value || "1 tiempo",
        menuNotas:    document.getElementById("menuNotas")?.value || "",
        restricciones: restricciones,
        servicios: servicios,
        notas:     document.getElementById("notas")?.value || "",
        fechaRegistro: new Date().toISOString(),
        id: Date.now()
    };

    if (modoEdicion) {

        nuevoEvento.id = eventos[indiceEdicion].id;
        nuevoEvento.fechaRegistro = eventos[indiceEdicion].fechaRegistro;

        eventos[indiceEdicion] = nuevoEvento;

    } else {

        eventos.push(nuevoEvento);

    }
    if (idBorradorActual) {

    let borradores =
        JSON.parse(sessionStorage.getItem("borradores")) || [];

    borradores = borradores.filter(
        b => b.idBorrador !== idBorradorActual
    );

    sessionStorage.setItem(
        "borradores",
        JSON.stringify(borradores)
    );

    sessionStorage.removeItem("editarBorrador");
}
    guardarEventos();

    mostrarAlerta("¡Evento creado correctamente! Redirigiendo...", "success");

    const btn = document.getElementById("btnAgregar");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Guardado'; }

    setTimeout(() => { window.location.href = "eventos.html"; }, 1500);
}

// ===============================
//  GUARDAR BORRADOR
// ===============================
function guardarBorrador() {

    const datos = recogerDatos();
    datos.idBorrador = idBorradorActual || Date.now();
    if (!datos.nombre) {
        mostrarAlerta(
            "Escribe al menos el nombre del evento.",
            "warning"
        );
        return;
    }
    datos.idBorrador = datos.idBorrador || Date.now();
    let borradores =
        JSON.parse(sessionStorage.getItem("borradores")) || [];

    if (indiceBorrador !== null) {

        // Actualizar el existente
        borradores[indiceBorrador] = datos;

        mostrarAlerta(
            "Borrador actualizado correctamente.",
            "info"
        );

    } else {

        // Crear nuevo
        datos.fechaBorrador = new Date().toISOString();

        borradores.push(datos);

        indiceBorrador = borradores.length - 1;

        mostrarAlerta(
            "Borrador guardado correctamente. Redirigiendo",
            "info"
        );
    }

    sessionStorage.setItem(
        "borradores",
        JSON.stringify(borradores)
    );
    setTimeout(() => { window.location.href = "eventos.html"; }, 1500);
}

function mostrarBorradores() {

    const tabla = document.getElementById("tablaEventosBorradores");
    const seccion = document.getElementById("seccionBorradores");

    if (!tabla || !seccion) return;

    const borradores = JSON.parse(sessionStorage.getItem("borradores")) || [];
     // Ocultar sección si no hay borradores
    if (borradores.length === 0) {
        seccion.classList.add("d-none");
        return;
    }

    // Mostrar sección si existen
    seccion.classList.remove("d-none");

    tabla.innerHTML = "";

    borradores.forEach((ev, index) => {

        tabla.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${ev.nombre || "-"}</td>
            <td>${ev.tipo || "-"}</td>
            <td>${ev.fecha || "-"}</td>
            <td>
                <span class="badge bg-warning text-dark">
                    Borrador
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary"
                        onclick="cargarBorrador(${index})">
                    <i class="bi bi-pencil"></i>
                </button>

                <button class="btn btn-sm btn-danger"
                        onclick="eliminarBorrador(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
    });
}
function cargarBorrador(index) {

    const borradores =
        JSON.parse(sessionStorage.getItem("borradores")) || [];

    const borrador = borradores[index];

    borrador.indexBorrador = index;

    sessionStorage.setItem(
        "editarBorrador",
        JSON.stringify(borrador)
    );

    window.location.href = "nuevo_evento.html";
}
function eliminarBorrador(index){

    let borradores =
        JSON.parse(sessionStorage.getItem("borradores")) || [];

    borradores.splice(index, 1);

    sessionStorage.setItem(
        "borradores",
        JSON.stringify(borradores)
    );

    mostrarBorradores();
}
function cargarBorradorFormulario() {

    const data = sessionStorage.getItem("editarBorrador");

    if (!data) return;

    const ev = JSON.parse(data);

    idBorradorActual = ev.idBorrador;

    indiceBorrador = ev.indexBorrador;

    const set = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.value = valor || "";
    };

    // ==========================
    // Información general
    // ==========================
    set("nombre", ev.nombre);
    set("fecha", ev.fecha);
    set("tipo", ev.tipo);
    set("horaInicio", ev.horaInicio);
    set("horaFin", ev.horaFin);
    set("lugar", ev.lugar);
    set("latitud", ev.latitud);
    set("longitud", ev.longitud);
    set("invitados", ev.invitados);
    set("estado", ev.estado);

    // ==========================
    // Cliente
    // ==========================
    set("clienteNombre", ev.cliente?.nombre);
    set("clienteDui", ev.cliente?.dui);
    set("clienteTel", ev.cliente?.telefono);
    set("clienteWa", ev.cliente?.whatsapp);
    set("clienteEmail", ev.cliente?.email);
    set("clienteDireccion", ev.cliente?.direccion);

    // ==========================
    // Paquete
    // ==========================
    set("precioPP", ev.precioPP);
    set("anticipo", ev.anticipo);
    set("formaPago", ev.formaPago);

    document.querySelectorAll(".paquete-card").forEach(card => {
        card.classList.remove("selected");

        if (card.dataset.paquete === ev.paquete) {
            card.classList.add("selected");
        }
    });

    // ==========================
    // Buffet
    // ==========================
    set("buffet", ev.buffet);
    set("tiempos", ev.tiempos);
    set("menuNotas", ev.menuNotas);

    // ==========================
    // Restricciones alimentarias
    // ==========================
    if (Array.isArray(ev.restricciones)) {

        ["veg", "vegan", "gluten", "lactosa", "alergias"]
            .forEach(id => {

                const checkbox = document.getElementById(id);

                if (checkbox) {
                    checkbox.checked =
                        ev.restricciones.includes(id);
                }
            });
    }

    // ==========================
    // Servicios
    // ==========================
    if (Array.isArray(ev.servicios)) {

        document
            .querySelectorAll('.servicio-check-card input[type="checkbox"]')
            .forEach(cb => {

                cb.checked =
                    ev.servicios.includes(cb.value);
            });
    }

    // ==========================
    // Notas
    // ==========================
    set("notas", ev.notas);

    // ==========================
    // Mostrar ubicación en mapa
    // ==========================
    if (ev.latitud && ev.longitud) {

        setTimeout(() => {

            if (typeof mostrarUbicacionGuardada === "function") {

                mostrarUbicacionGuardada(
                    ev.latitud,
                    ev.longitud,
                    ev.nombre
                );
            }

        }, 500);
    }

    // Limpiar sesión
    sessionStorage.removeItem("editarBorrador");

}

// ===============================
//  CONFIRMAR + ELIMINAR
// ===============================
function confirmarEliminar(index) {
    indexEliminar = index;
    const nombreEl = document.getElementById("nombreEliminar");
    if (nombreEl) nombreEl.textContent = eventos[index].nombre;
    const modal = new bootstrap.Modal(document.getElementById("modalEliminar"));
    modal.show();
}

function eliminarEvento() {
    if (indexEliminar === null) return;
    eventos.splice(indexEliminar, 1);
    indexEliminar = null;
    guardarEventos();
    mostrarEventosTabla();
    actualizarResumen();
    const modalEl = document.getElementById("modalEliminar");
    if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
    mostrarAlerta("Evento eliminado correctamente.", "danger");
}

// ===============================
//  EDITAR
// ===============================
function editarEvento(index) {
    sessionStorage.setItem("editarEvento", JSON.stringify({ ...eventos[index], index }));
    window.location.href = "nuevo_evento.html";
}

// ===============================
//  VER DETALLE
// ===============================
function verEvento(index) {

    sessionStorage.setItem("eventoDetalle",JSON.stringify({ ...eventos[index], index}));
    window.location.href = "detalle_evento.html";

}

// ===============================
//  FILTROS — eventos.html
// ===============================
function aplicarFiltros() {
    const texto = (document.getElementById("buscador")?.value || "").toLowerCase();
    const tipo  = document.getElementById("filtroTipo")?.value || "";
    const fecha = document.getElementById("filtroFecha")?.value || "";

    const filtrados = eventos.filter(ev => {
        const coincideTexto = ev.nombre.toLowerCase().includes(texto);
        const coincideTipo  = tipo  ? ev.tipo  === tipo  : true;
        const coincideFecha = fecha ? ev.fecha === fecha  : true;
        return coincideTexto && coincideTipo && coincideFecha;
    });
    mostrarEventosTabla(filtrados);
}

// ===============================
//  ALERTA UX
// ===============================
function mostrarAlerta(msg, tipo = "success") {
    const toast = document.getElementById("alertaToast");
    const msgEl = document.getElementById("alertaMsg");
    if (!toast || !msgEl) return;

    const colores = {
        success: "bg-success text-white",
        danger:  "bg-danger text-white",
        warning: "bg-warning text-dark",
        info:    "bg-info text-dark"
    };

    toast.className = `toast align-items-center border-0 ${colores[tipo] || colores.success}`;
    msgEl.textContent = msg;
    toast.style.display = "block";

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = "none"; }, 3500);
}

function ocultarAlerta() {
    const toast = document.getElementById("alertaToast");
    if (toast) toast.style.display = "none";
}



// ===============================
//  RECOGER DATOS DEL FORMULARIO
// ===============================
function recogerDatos() {
    const servicios = [];
    document.querySelectorAll('.servicio-check-card input:checked').forEach(cb => servicios.push(cb.value));
    const paqueteEl = document.querySelector('.paquete-card.selected');
    return {
        nombre:     document.getElementById("nombre")?.value.trim(),
        fecha:      document.getElementById("fecha")?.value,
        tipo:       document.getElementById("tipo")?.value,
        horaInicio: document.getElementById("horaInicio")?.value,
        horaFin:    document.getElementById("horaFin")?.value,
        lugar:      document.getElementById("lugar")?.value.trim(),
        invitados:  document.getElementById("invitados")?.value,
        estado:     document.getElementById("estado")?.value,
        latitud:      document.getElementById("latitud")?.value,
        longitud:     document.getElementById("longitud")?.value,
        cliente: {
            nombre:    document.getElementById("clienteNombre")?.value.trim(),
            dui:       document.getElementById("clienteDui")?.value,
            telefono:  document.getElementById("clienteTel")?.value,
            whatsapp:  document.getElementById("clienteWa")?.value,
            email:     document.getElementById("clienteEmail")?.value,
            direccion: document.getElementById("clienteDireccion")?.value
        },
        paquete:   paqueteEl?.dataset.paquete || "Básico",
        precioPP:  parseFloat(document.getElementById("precioPP")?.value) || 0,
        anticipo:  parseFloat(document.getElementById("anticipo")?.value) || 0,
        formaPago: document.getElementById("formaPago")?.value,
        buffet:    document.getElementById("buffet")?.value,
        tiempos:   document.getElementById("tiempos")?.value,
        menuNotas: document.getElementById("menuNotas")?.value,
        servicios,
        notas:     document.getElementById("notas")?.value
    };
}
// ===============================
//  REPORTES — reportes.html
// ===============================
function actualizarReportes() {
    if (!document.getElementById("reporteTotalMes")) return;

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Eventos del mes actual
    const eventosMes = eventos.filter(ev => {
        const fecha = new Date(ev.fecha + "T00:00:00");
        return fecha.getMonth() === mesActual &&
               fecha.getFullYear() === anioActual;
    });

    // Ingresos totales
    const ingresos = eventos.reduce((total, ev) =>
        total + (parseFloat(ev.precioPP) * parseInt(ev.invitados) || 0), 0);

    // Conteo por tipo
    const tipos = {};
    eventos.forEach(ev => {
        tipos[ev.tipo] = (tipos[ev.tipo] || 0) + 1;
    });

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set("reporteTotalMes", eventosMes.length);
    set("reporteIngresos", `$${ingresos.toLocaleString()}`);
    set("reporteClientes", eventos.length);
    set("reporteCalif",    "4.8");

    // Tabla por tipo
    const tbody = document.getElementById("tablaReportes");
    if (!tbody) return;

    tbody.innerHTML = "";
    const total = eventos.length || 1;

    Object.entries(tipos).forEach(([tipo, cantidad]) => {
        const porcentaje = Math.round((cantidad / total) * 100);
        const ingreso = eventos
            .filter(ev => ev.tipo === tipo)
            .reduce((t, ev) => t + (parseFloat(ev.precioPP) * parseInt(ev.invitados) || 0), 0);
        const promedio = cantidad > 0 ? Math.round(ingreso / cantidad) : 0;

        tbody.innerHTML += `
            <tr>
                <td><span class="badge badge-gold me-2">${tipo}</span></td>
                <td>${cantidad}</td>
                <td>$${ingreso.toLocaleString()}</td>
                <td>$${promedio.toLocaleString()}</td>
                <td>
                    <div class="progress progress-glass" style="height: 8px;">
                        <div class="progress-bar bg-gold" style="width: ${porcentaje}%"></div>
                    </div>
                    <small>${porcentaje}%</small>
                </td>
            </tr>`;
    });

    if (Object.keys(tipos).length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-white-50 text-center">No hay eventos registrados aún.</td></tr>`;
    }
}

function exportarCSV() {
    if (eventos.length === 0) {
        mostrarAlerta("No hay eventos para exportar.", "warning");
        return;
    }

    // Encabezados
    const encabezados = [
        "N°", "Nombre del Evento", "Tipo", "Fecha", "Estado",
        "Lugar", "Invitados", "Cliente", "Teléfono",
        "Paquete", "Precio PP", "Anticipo", "Forma de Pago"
    ];

    const filas = eventos.map((ev, i) => [
        i + 1,
        ev.nombre,
        ev.tipo,
        ev.fecha,
        ev.estado || "Pendiente",
        ev.lugar,
        ev.invitados,
        ev.cliente?.nombre || "",
        ev.cliente?.telefono || "",
        ev.paquete || "Básico",
        `$${ev.precioPP || 0}`,
        `$${ev.anticipo || 0}`,
        ev.formaPago || "Efectivo"
    ]);

    const contenido = [
        encabezados.join(";"),
        ...filas.map(fila => fila.map(v => `"${v}"`).join(";"))
    ].join("\n");

    
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + contenido], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;

    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    link.download = `reporte_eventos_${fecha}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    mostrarAlerta("Reporte exportado correctamente.", "success");
}


// ===============================
//  WEB WORKER — Métricas Dashboard
// ===============================
function iniciarWorkerMetricas() {
    if (!window.Worker) {
        console.warn("Web Workers no soportados en este navegador.");
        return;
    }

    const worker = new Worker("js/dashboardWorker.js");

    worker.postMessage(eventos);

    worker.onmessage = function (e) {
        const m = e.data;
        crearGraficoEventos(m.tipos);

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        set("metricaTotal",       m.total);
        set("metricaConfirmados", m.confirmados);
        set("metricaPendientes",  m.pendientes);
        set("metricaFinalizados", m.finalizados);
        set("metricaProximos",    m.proximos);
        set("metricaEnProceso",   m.enProceso);

        const status = document.getElementById("workerStatus");
        if (status) status.textContent =
            `Métricas actualizadas · ${m.total} eventos procesados`;

        worker.terminate();
    };

    worker.onerror = function (err) {
        console.error("Error en Web Worker:", err.message);
    };
}
function cargarDatosEdicion(){
    // ── Cargar datos para editar ──
    const editData = sessionStorage.getItem("editarEvento");
    if (editData && document.getElementById("nombre")) {
        const ev = JSON.parse(editData);
        modoEdicion = true;
        indiceEdicion = ev.index;
        sessionStorage.removeItem("editarEvento");

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
        set("nombre",           ev.nombre);
        set("fecha",            ev.fecha);
        set("tipo",             ev.tipo);
        set("horaInicio",       ev.horaInicio);
        set("horaFin",          ev.horaFin);
        set("lugar",            ev.lugar);
        set("latitud",          ev.latitud);
        set("longitud",         ev.longitud);
        set("invitados",        ev.invitados);
        set("estado",           ev.estado);
        set("clienteNombre",    ev.cliente?.nombre);
        set("clienteDui",       ev.cliente?.dui);
        set("clienteTel",       ev.cliente?.telefono);
        set("clienteWa",        ev.cliente?.whatsapp);
        set("clienteEmail",     ev.cliente?.email);
        set("clienteDireccion", ev.cliente?.direccion);
        set("precioPP",         ev.precioPP);
        set("anticipo",         ev.anticipo);
        set("formaPago",        ev.formaPago);
        set("buffet",           ev.buffet);
        set("tiempos",          ev.tiempos);
        set("menuNotas",        ev.menuNotas);
        set("notas",            ev.notas);

        // Paquete card
        document.querySelectorAll('.paquete-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.paquete === ev.paquete);
        });

        // Servicios
        if (ev.servicios) {
            document.querySelectorAll('.servicio-check-card input').forEach(cb => {
                if (ev.servicios.includes(cb.value)) {
                    cb.checked = true;
                    cb.closest('.servicio-check-card').classList.add('selected');
                }
            });
        }

        // Cambiar título y botón
        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Editar Evento";

        const btn = document.getElementById("btnAgregar");

        if (btn) {
            btn.innerHTML =
                '<i class="bi bi-check-lg me-2"></i>Actualizar Evento';
        }
        if (ev.latitud && ev.longitud) {

            setTimeout(() => {

                mostrarUbicacionGuardada(
                    ev.latitud,
                    ev.longitud,
                    ev.nombre
                );

            }, 500);

        }
    }
    
}
function crearGraficoEventos(tipos) {

    const canvas = document.getElementById("graficoEventos");

    if (!canvas) return;

    if (graficoEventos) {
        graficoEventos.destroy();
    }

    graficoEventos = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: Object.keys(tipos),

            datasets: [{
                data: Object.values(tipos),
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }

    });

}


function cargarDetalleEvento() {
    // ── Cargar datos para editar ──
    const detailsData = sessionStorage.getItem("eventoDetalle");
    if (detailsData && document.getElementById("detalleNombre")) {
        const ev = JSON.parse(detailsData);
        console.log(ev);
        sessionStorage.removeItem("detailsData");
        const total = ev.precioPP * ev.invitados;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
        set("detalleNombre",           ev.nombre);
        set("detalleFecha",            ev.fecha);
        set("detalleTipo",             ev.tipo);
        set("detalleHoraInicio",       ev.horaInicio);
        set("detalleHoraFin",          ev.horaFin);
        set("detalleLugar",            ev.lugar);
         set("latitud",          ev.latitud);
         set("longitud",         ev.longitud);
        set("detalleInvitados",        ev.invitados);
        set("detalleEstado",           ev.estado);
         set("clienteNombre",    ev.cliente?.nombre);
         set("clienteDui",       ev.cliente?.dui);
         set("clienteTel",       ev.cliente?.telefono);
         set("clienteWa",        ev.cliente?.whatsapp);
         set("clienteEmail",     ev.cliente?.email);
         set("clienteDireccion", ev.cliente?.direccion);
        set("detallePrecioPP",         ev.precioPP);
        set("detalleAnticipo",         ev.anticipo);
        set("detalleFormaPago",        ev.formaPago);
        set("detalleBuffet",           ev.buffet);
        set("detalleTiempos",          ev.tiempos);
        set("detalleMenuNotas",        ev.menuNotas);
        set("detalleNotas",            ev.notas);
        set("detalleTotal",      total);

        const badge = document.getElementById("detalleEstado");
        if (ev.estado === "Confirmado") {
            badge.classList.add("bg-success");
        } else if (ev.estado === "Finalizado") {
            badge.classList.add("bg-danger");
        } else if (ev.estado === "Pendiente") {
            badge.classList.add("bg-warning");
        } else {
            badge.classList.add("bg-info");
        }
        document.querySelectorAll('.paquete-card').forEach(c => {
            const seleccionado = c.dataset.paquete === ev.paquete;

            c.classList.toggle('selected', seleccionado);

            if (seleccionado) {
                c.classList.remove('d-none');
            }
        });
        ev.restricciones.forEach(restriccion => {
            const checkbox = document.getElementById(restriccion);

            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.form-check')?.classList.remove('d-none');
            }
        });
        // Servicios
        if (ev.servicios) {
            document.querySelectorAll('.service input').forEach(cb => {
                if (ev.servicios.includes(cb.value)) {
                    cb.checked = true;
                    cb.closest('.servicio-check-card').classList.add('selected');
                    cb.closest('.service')?.classList.remove('d-none');
                }
            });
        }

        // Cambiar título y botón
        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Editar Evento";

        const btn = document.getElementById("btnAgregar");

        if (btn) {
            btn.innerHTML =
                '<i class="bi bi-check-lg me-2"></i>Actualizar Evento';
        }
        if (ev.latitud && ev.longitud) {

            setTimeout(() => {

                mostrarUbicacionGuardada(
                    ev.latitud,
                    ev.longitud,
                    ev.nombre
                );

            }, 500);

        }
    }
}


