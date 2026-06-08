// ── Selección de paquete ──────────────────────────────────
function selectPaquete(el) {
    document.querySelectorAll('.paquete-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    const precio = el.dataset.precio;
    const nombre = el.dataset.paquete;
    // Actualiza input precio y resumen
    document.getElementById('precioPP').value = precio > 0 ? precio : '';
    document.getElementById('res-paquete').textContent = nombre;
    actualizarTotal();
}

// ── Toggle servicios check cards ──────────────────────────
document.querySelectorAll('.servicio-check-card').forEach(card => {
    card.addEventListener('click', function() {
        const checkbox = this.querySelector('input[type="checkbox"]');
        this.classList.toggle('selected', checkbox.checked);
        actualizarResumenServicios();
    });
});

// ── Actualizar resumen lateral en tiempo real ─────────────
function actualizarResumenLateral() {
    const tipo      = document.getElementById('tipo');
    const fecha     = document.getElementById('fecha');
    const invitados = document.getElementById('invitados');
    const buffet    = document.getElementById('buffet');
    const anticipo  = document.getElementById('anticipo');

    if (tipo)      document.getElementById('res-tipo').textContent    = tipo.value || '—';
    if (fecha)     document.getElementById('res-fecha').textContent   = fecha.value ? new Date(fecha.value + 'T00:00:00').toLocaleDateString('es-ES') : '—';
    if (invitados) document.getElementById('res-invitados').textContent = invitados.value || '0';
    if (buffet)    document.getElementById('res-buffet').textContent  = buffet.value;
    if (anticipo)  document.getElementById('res-anticipo').textContent = '$' + (parseFloat(anticipo.value) || 0).toFixed(2);

    actualizarTotal();
    actualizarChecklist();
}

function actualizarResumenServicios() {
    const count = document.querySelectorAll('.servicio-check-card input:checked').length;
    document.getElementById('res-servicios').textContent = count + ' seleccionados';
    actualizarTotal();
}

function actualizarTotal() {
    const invitados = parseFloat(document.getElementById('invitados')?.value) || 0;
    const precio    = parseFloat(document.getElementById('precioPP')?.value)  || 0;
    const anticipo  = parseFloat(document.getElementById('anticipo')?.value)  || 0;
    const total     = invitados * precio;
    document.getElementById('res-total').textContent   = '$' + total.toFixed(2);
    document.getElementById('res-anticipo').textContent = '$' + anticipo.toFixed(2);
}

function actualizarChecklist() {
    const nombre   = document.getElementById('nombre')?.value.trim();
    const tipo     = document.getElementById('tipo')?.value;
    const fecha    = document.getElementById('fecha')?.value;
    const cliente  = document.getElementById('clienteNombre')?.value.trim();
    const paquete  = document.querySelector('.paquete-card.selected');
    const buffet   = document.getElementById('buffet')?.value;
    const servicios = document.querySelectorAll('.servicio-check-card input:checked').length;

    setStep('step1', nombre && tipo && fecha);
    setStep('step2', !!cliente);
    setStep('step3', !!paquete);
    setStep('step4', buffet !== 'Sin buffet');
    setStep('step5', servicios > 0);
}

function setStep(id, done) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector('i');
    const txt  = el.querySelector('span');
    if (done) {
        icon.className = 'bi bi-check-circle-fill small';
        txt.style.color = '#8aad3f';
    } else {
        icon.className = 'bi bi-circle small';
        txt.style.color = 'rgba(255,255,255,0.5)';
    }
}

// Mostrar/ocultar alerta
function ocultarAlerta() {
    document.getElementById('alertaToast').style.display = 'none';
}

// ── Escuchar cambios en inputs para actualizar resumen ────
document.addEventListener('DOMContentLoaded', () => {
    const campos = ['tipo','fecha','invitados','buffet','anticipo','precioPP'];
    campos.forEach(id => {
        document.getElementById(id)?.addEventListener('input',  actualizarResumenLateral);
        document.getElementById(id)?.addEventListener('change', actualizarResumenLateral);
    });
    document.getElementById('btnAgregar')?.addEventListener('click', agregarEvento);
});