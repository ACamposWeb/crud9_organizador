// dashboardWorker.js
// Web Worker: procesa las métricas de eventos en segundo plano

self.onmessage = function (e) {
    const eventos = e.data;

    const total      = eventos.length;
    const confirmados = eventos.filter(ev => ev.estado === "Confirmado").length;
    const pendientes  = eventos.filter(ev => ev.estado === "Pendiente").length;
    const enProceso   = eventos.filter(ev => ev.estado === "En proceso").length;
    const finalizados = eventos.filter(ev => ev.estado === "Finalizado").length;

    const tipos = {};
    eventos.forEach(ev => {
        tipos[ev.tipo] = (tipos[ev.tipo] || 0) + 1;
    });

    const hoy = new Date();
    const proximos = eventos.filter(ev => new Date(ev.fecha + "T00:00:00") >= hoy).length;
    const pasados  = eventos.filter(ev => new Date(ev.fecha + "T00:00:00") < hoy).length;

    self.postMessage({
        total,
        confirmados,
        pendientes,
        enProceso,
        finalizados,
        proximos,
        pasados,
        tipos
    });
};