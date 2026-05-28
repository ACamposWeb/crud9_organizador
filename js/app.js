// ─── Gestión de Eventos — app.js ────────────────────────────

document.addEventListener("DOMContentLoaded", () => {

  try {

    // ── Elementos del DOM ──────────────────────────────────
    const toast        = document.getElementById("toast");
    const titleInput   = document.getElementById("title");
    const dateInput    = document.getElementById("date");
    const addBtn       = document.getElementById("addBtn");
    const eventList    = document.getElementById("eventList");
    const countBadge   = document.getElementById("countBadge");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalTitle   = document.getElementById("modalTitle");
    const modalBody    = document.getElementById("modalBody");
    const modalClose   = document.getElementById("modalClose");

    if (!eventList) throw new Error("No se encontró el elemento #eventList");

    // ── Constantes ─────────────────────────────────────────
    const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

    // ── Estado ─────────────────────────────────────────────
    let events = [];
    let toastTimer = null;

    try {
      events = JSON.parse(localStorage.getItem("ev_events")) || [];
    } catch (_) {
      events = [];
    }

    // ── Persistencia ───────────────────────────────────────
    function saveEvents() {
      try {
        localStorage.setItem("ev_events", JSON.stringify(events));
      } catch (e) {
        console.warn("localStorage no disponible:", e.message);
      }
    }

    // ── Toast UX ───────────────────────────────────────────
    function showToast(msg, type = "success") {
      clearTimeout(toastTimer);
      toast.textContent = msg;
      toast.className = "toast " + type;
      toastTimer = setTimeout(() => {
        toast.className = "toast hidden";
      }, 3000);
    }

    // ── Utilidades de fecha ────────────────────────────────
    function daysUntil(dateStr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr + "T00:00:00");
      return Math.round((target - today) / 86_400_000);
    }

    function buildChip(days) {
      if (days === 0) return `<span class="days-chip today">Hoy</span>`;
      if (days <= 7)  return `<span class="days-chip soon">En ${days}d</span>`;
      return              `<span class="days-chip upcoming">En ${days}d</span>`;
    }

    function formatLong(dateStr) {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("es-ES", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    // ── Render de eventos ──────────────────────────────────
    function renderEvents() {
      const count = events.length;
      countBadge.textContent = count + (count === 1 ? " evento" : " eventos");

      if (count === 0) {
        eventList.innerHTML = `
          <div class="empty">
            <i class="ti ti-calendar-off" aria-hidden="true"></i>
            Sin eventos aún. ¡Agrega el primero!
          </div>`;
        return;
      }

      const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
      const grid = document.createElement("div");
      grid.className = "event-grid";

      sorted.forEach(ev => {
        const d    = new Date(ev.date + "T00:00:00");
        const days = daysUntil(ev.date);
        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
          <div class="date-badge" aria-hidden="true">
            <div class="day">${String(d.getDate()).padStart(2, "0")}</div>
            <div class="mon">${MONTHS[d.getMonth()]}</div>
          </div>
          <div class="event-info">
            <h3>${escapeHtml(ev.title)}</h3>
            <p>${formatLong(ev.date)}</p>
          </div>
          ${buildChip(days)}
          <div class="actions">
            <button
              class="icon-btn edit-btn"
              data-id="${ev.id}"
              aria-label="Editar: ${escapeHtml(ev.title)}">
              <i class="ti ti-edit" aria-hidden="true"></i>
            </button>
            <button
              class="icon-btn del-btn"
              data-id="${ev.id}"
              aria-label="Eliminar: ${escapeHtml(ev.title)}">
              <i class="ti ti-trash" aria-hidden="true"></i>
            </button>
          </div>
        `;
        grid.appendChild(card);
      });

      eventList.innerHTML = "";
      eventList.appendChild(grid);
    }

    // ── Escape HTML (prevenir XSS) ─────────────────────────
    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    // ── Modal helpers ──────────────────────────────────────
    function openModal(title, bodyHTML, onAfterRender) {
      modalTitle.textContent = title;
      modalBody.innerHTML = bodyHTML;
      modalOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      if (onAfterRender) onAfterRender();
    }

    function closeModal() {
      modalOverlay.classList.add("hidden");
      document.body.style.overflow = "";
      modalBody.innerHTML = "";
    }

    modalClose.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // ── Modal Editar ───────────────────────────────────────
    function openEditModal(ev) {
      openModal(
        "Editar evento",
        `<div class="field">
          <label for="m-title">
            <i class="ti ti-text-size" aria-hidden="true"></i>
            Título
          </label>
          <input type="text" id="m-title" value="${escapeHtml(ev.title)}">
        </div>
        <div class="field">
          <label for="m-date">
            <i class="ti ti-calendar" aria-hidden="true"></i>
            Fecha
          </label>
          <input type="date" id="m-date" value="${ev.date}">
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" id="m-cancel">Cancelar</button>
          <button class="btn-save"   id="m-save">Guardar cambios</button>
        </div>`,
        () => {
          document.getElementById("m-title").focus();

          document.getElementById("m-cancel").addEventListener("click", closeModal);

          document.getElementById("m-save").addEventListener("click", () => {
            const newTitle = document.getElementById("m-title").value.trim();
            const newDate  = document.getElementById("m-date").value;

            if (!newTitle || !newDate) {
              showToast("Completa todos los campos", "danger");
              return;
            }

            ev.title = newTitle;
            ev.date  = newDate;
            saveEvents();
            renderEvents();
            closeModal();
            showToast("Evento actualizado", "info");
          });
        }
      );
    }

    // ── Modal Confirmar Eliminación ────────────────────────
    function openDeleteModal(ev) {
      openModal(
        "Eliminar evento",
        `<p class="modal-desc">
          ¿Seguro que deseas eliminar
          <strong>${escapeHtml(ev.title)}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" id="m-cancel">Cancelar</button>
          <button class="btn-danger" id="m-delete">Eliminar</button>
        </div>`,
        () => {
          document.getElementById("m-cancel").addEventListener("click", closeModal);

          document.getElementById("m-delete").addEventListener("click", () => {
            events = events.filter(e => e.id !== ev.id);
            saveEvents();
            renderEvents();
            closeModal();
            showToast("Evento eliminado", "danger");
          });
        }
      );
    }

    // ── Agregar evento ─────────────────────────────────────
    addBtn.addEventListener("click", () => {
      const title = titleInput.value.trim();
      const date  = dateInput.value;

      if (!title || !date) {
        showToast("Completa todos los campos", "danger");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      if (date < today) {
        showToast("No puedes agregar fechas pasadas", "danger");
        return;
      }

      const newEvent = {
        id:    Date.now(),
        title: title,
        date:  date
      };

      events.push(newEvent);
      saveEvents();
      renderEvents();

      titleInput.value = "";
      dateInput.value  = "";
      titleInput.focus();

      showToast("Evento agregado correctamente", "success");
    });

    // Enter en el input también agrega
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addBtn.click();
    });

    // ── Delegación de clicks en la lista ──────────────────
    eventList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const ev = events.find(ev => ev.id === id);
      if (!ev) return;

      if (btn.classList.contains("edit-btn")) openEditModal(ev);
      if (btn.classList.contains("del-btn"))  openDeleteModal(ev);
    });

    // ── Render inicial ─────────────────────────────────────
    renderEvents();

  } catch (error) {
    console.error("Error en app.js:", error.message);
  }

});