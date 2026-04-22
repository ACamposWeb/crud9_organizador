// Esperar a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
    
    try {
        const contenedorMensaje = document.getElementById("mensaje");

        if (!contenedorMensaje) {
            throw new Error("No se encontró el elemento #mensaje");
        }

        // Mensaje que quieres mostrar
        contenedorMensaje.textContent = "Bienvenido al sistema de gestión de eventos!!!";

    } catch (error) {
        console.error("Error:", error.message);
    }

});