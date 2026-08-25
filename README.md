# Finix

## APIs Faltantes de Configurar (Autenticación)

Para que el inicio de sesión con proveedores externos funcione correctamente en producción y desarrollo, es necesario configurar las siguientes APIs / credenciales Oauth en el dashboard de Supabase (Authentication -> Providers):

1. **Google OAuth API**: 
   - Debes obtener un `Client ID` y `Client Secret` desde [Google Cloud Console](https://console.cloud.google.com/).
   - Asegúrate de agregar la URI de redirección autorizada que proporciona Supabase (ej. `https://<project_id>.supabase.co/auth/v1/callback`).

2. **GitHub OAuth API**:
   - Debes obtener un `Client ID` y `Client Secret` creando una OAuth App en tu cuenta de GitHub (Settings -> Developer Settings -> OAuth Apps).
   - Agregar el "Authorization callback URL" de Supabase (ej. `https://<project_id>.supabase.co/auth/v1/callback`).

Una vez agregadas estas credenciales, los botones de "Iniciar Sesión con Google" y "GitHub" funcionarán de manera completa.
