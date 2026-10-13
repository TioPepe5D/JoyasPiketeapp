# Joyas Pikete · Contabilidad

App web para registrar las ventas de Joyas Pikete y calcular ganancias, comisiones y transferencias entre el gerente y los vendedores. Se instala en el teléfono como una app y guarda los datos en Firebase, así todos ven lo mismo en tiempo real.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página de entrada: carga React, Recharts, los íconos y Firebase, y luego `app.jsx`. |
| `app.jsx` | Toda la app (pantallas, cálculos y estilos). Se traduce en el navegador, no hay que compilar nada. |
| `firebase-config.js` | Datos del proyecto de Firebase. |
| `firestore.rules` | Reglas de seguridad para copiar en Firebase. |
| `sw.js`, `manifest.webmanifest`, `icon*` | Lo que permite instalar la app en el teléfono y abrirla sin internet. |

## Dónde se guardan los datos (Firestore)

- Colección `config`: documentos `precios`, `costosReales`, `pins`, `comisiones` y `lotes`. Se crean solos con los valores iniciales la primera vez que se abre la app. El PIN inicial de todos es `1234`.
- Colección `ventas`: un documento por venta.

## Puesta en marcha

1. **Datos de Firebase**: en Firebase Console > ⚙️ Configuración del proyecto > Tus apps, crea una app web (si no existe) y copia los valores de `firebaseConfig` en `firebase-config.js`.
2. **Inicio de sesión anónimo**: Firebase Console > Authentication > Método de acceso > **Anónimo** > Habilitar. Es invisible para los usuarios (ellos siguen entrando con su PIN); sirve para que la base de datos solo acepte a la app.
3. **Base de datos**: Firebase Console > Firestore Database > Crear base de datos (si no existe). Luego, en **Reglas**, pega el contenido de `firestore.rules` y presiona Publicar.
4. **Publicar la app**: en GitHub, Settings > Pages > Build and deployment > *Deploy from a branch* > rama `main`, carpeta `/ (root)`. Queda en `https://<usuario>.github.io/<repositorio>/`.
5. **Instalar en el teléfono**: abrir ese enlace y elegir "Agregar a pantalla de inicio".

## Al publicar cambios

Sube el número de `CACHE_NAME` en `sw.js` (por ejemplo `joyas-pikete-v2`) para que los teléfonos descarguen la versión nueva.
