export default {
    async fetch(request, env) {
        try {
            // Intentar servir el asset estático (HTML, CSS, JS, imágenes, etc.)
            const response = await env.ASSETS.fetch(request);

            // Si el asset no existe (error 404), es porque es una ruta de React (SPA)
            // En ese caso, servimos el archivo "index.html" como predeterminado
            if (response.status === 404) {
                return await env.ASSETS.fetch(new Request(new URL("/", request.url)));
            }

            return response;
        } catch (e) {
            return new Response("Error al cargar el sitio web", { status: 500 });
        }
    }
};
