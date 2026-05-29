// ===============================
//  VARIABLES GLOBALES
// ===============================
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
let indexEliminar = null;

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
    // Campos obligatorios
    const nombre  = document.getElementById("nombre");
    const fecha   = document.getElementById("fecha");
    const tipo    = document.getElementById("tipo");
    const lugar   = document.getElementById("lugar");
    const invitados = document.getElementById("invitados");
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
        { el: nombre,        msg: "nombre" },
        { el: fecha,         msg: "fecha" },
        { el: tipo,          msg: "tipo" },
        { el: lugar,         msg: "lugar" },
        { el: invitados,     msg: "invitados" },
        { el: clienteNombre, msg: "cliente" },
        { el: clienteTel,    msg: "teléfono" }
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
        // Cliente
        cliente: {
            nombre:    clienteNombre.value.trim(),
            dui:       document.getElementById("clienteDui")?.value || "",
            telefono:  clienteTel.value,
            whatsapp:  document.getElementById("clienteWa")?.value || "",
            email:     document.getElementById("clienteEmail")?.value || "",
            direccion: document.getElementById("clienteDireccion")?.value || ""
        },
        // Paquete
        paquete:    paqueteEl?.dataset.paquete || "Básico",
        precioPP:   parseFloat(document.getElementById("precioPP")?.value) || 0,
        anticipo:   parseFloat(document.getElementById("anticipo")?.value) || 0,
        formaPago:  document.getElementById("formaPago")?.value || "Efectivo",
        // Buffet
        buffet:       document.getElementById("buffet")?.value || "Sin buffet",
        tiempos:      document.getElementById("tiempos")?.value || "1 tiempo",
        menuNotas:    document.getElementById("menuNotas")?.value || "",
        restricciones: restricciones,
        // Servicios y notas
        servicios: servicios,
        notas:     document.getElementById("notas")?.value || "",
        // Meta
        fechaRegistro: new Date().toISOString(),
        id: Date.now()
    };

    eventos.push(nuevoEvento);
    guardarEventos();

    mostrarAlerta("¡Evento creado correctamente! Redirigiendo...", "success");

    // Deshabilitar botón para evitar doble clic
    const btn = document.getElementById("btnAgregar");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Guardado'; }

    setTimeout(() => { window.location.href = "eventos.html"; }, 1500);
}

// ===============================
//  GUARDAR BORRADOR
// ===============================
function guardarBorrador() {
    const nombre = document.getElementById("nombre")?.value.trim();
    if (!nombre) { mostrarAlerta("Escribe al menos el nombre del evento para guardar el borrador.", "warning"); return; }

    const borrador = {
        nombre,
        fecha:   document.getElementById("fecha")?.value || "",
        tipo:    document.getElementById("tipo")?.value || "",
        lugar:   document.getElementById("lugar")?.value || "",
        notas:   document.getElementById("notas")?.value || ""
    };
    sessionStorage.setItem("borrador_evento", JSON.stringify(borrador));
    mostrarAlerta("Borrador guardado en sesión.", "info");
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
// ✏️ EDITAR
// ===============================
function editarEvento(index) {
    sessionStorage.setItem("editarEvento", JSON.stringify({ ...eventos[index], index }));
    window.location.href = "nuevo_evento.html";
}

// ===============================
//  VER DETALLE
// ===============================
function verEvento(index) {
    const ev = eventos[index];
    const fecha = new Date(ev.fecha + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    alert(`📅 ${ev.nombre}\nFecha: ${fecha}\nTipo: ${ev.tipo}\nLugar: ${ev.lugar || "—"}\nInvitados: ${ev.invitados || "—"}\nCliente: ${ev.cliente?.nombre || "—"}\nEstado: ${ev.estado || "—"}`);
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
    const toast   = document.getElementById("alertaToast");
    const msgEl   = document.getElementById("alertaMsg");
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
//  INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    // ── Dashboard ──
    mostrarEventosDashboard();
    actualizarResumen();

    // ── Tabla eventos ──
    mostrarEventosTabla();
    document.getElementById("buscador")?.addEventListener("input",  aplicarFiltros);
    document.getElementById("filtroTipo")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filtroFecha")?.addEventListener("change", aplicarFiltros);
    document.getElementById("btnConfirmarEliminar")?.addEventListener("click", eliminarEvento);

    // ── Nuevo Evento ──
    document.getElementById("btnAgregar")?.addEventListener("click", agregarEvento);
    document.getElementById("btnBorrador")?.addEventListener("click", guardarBorrador);

    // ── Cargar datos para editar ──
    const editData = sessionStorage.getItem("editarEvento");
    if (editData && document.getElementById("nombre")) {
        const ev = JSON.parse(editData);
        sessionStorage.removeItem("editarEvento");

        // Cargar campos básicos
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
        set("nombre",    ev.nombre);
        set("fecha",     ev.fecha);
        set("tipo",      ev.tipo);
        set("horaInicio", ev.horaInicio);
        set("horaFin",   ev.horaFin);
        set("lugar",     ev.lugar);
        set("invitados", ev.invitados);
        set("estado",    ev.estado);
        // Cliente
        set("clienteNombre",    ev.cliente?.nombre);
        set("clienteDui",       ev.cliente?.dui);
        set("clienteTel",       ev.cliente?.telefono);
        set("clienteWa",        ev.cliente?.whatsapp);
        set("clienteEmail",     ev.cliente?.email);
        set("clienteDireccion", ev.cliente?.direccion);
        // Paquete y pagos
        set("precioPP",  ev.precioPP);
        set("anticipo",  ev.anticipo);
        set("formaPago", ev.formaPago);
        // Buffet
        set("buffet",    ev.buffet);
        set("tiempos",   ev.tiempos);
        set("menuNotas", ev.menuNotas);
        set("notas",     ev.notas);

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
            btn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Actualizar Evento';
            btn.onclick = () => {
                eventos[ev.index] = { ...eventos[ev.index], ...recogerDatos() };
                guardarEventos();
                mostrarAlerta("Evento actualizado correctamente. Redirigiendo...", "success");
                btn.disabled = true;
                setTimeout(() => { window.location.href = "eventos.html"; }, 1500);
            };
        }
    }
});

// Recoger todos los datos del formulario 
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
//  WEB WORKER — Métricas Dashboard
// ===============================
function iniciarWorkerMetricas() {
    if (!window.Worker) {
        console.warn("Web Workers no soportados en este navegador.");
        return;
    }

    const worker = new Worker("dashboard.worker.js");

    // Envía los datos al worker
    worker.postMessage(eventos);

    // Recibe el resultado procesado
    worker.onmessage = function (e) {
        const m = e.data;

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
            `Métricas actualizadas por Web Worker · ${m.total} eventos procesados`;

        worker.terminate(); // Cierra el worker al terminar
    };

    worker.onerror = function (err) {
        console.error("Error en Web Worker:", err.message);
    };
}