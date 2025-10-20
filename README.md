# ☕ Tito Café - Frontend

Este es el repositorio del frontend para la aplicación web **Tito Café**. Esta aplicación es un sistema completo de punto de venta (POS) y pedidos en línea, construido con React y Vite.

**Sitio en vivo:** [https://tito-cafe-frontend.onrender.com](https://tito-cafe-frontend.onrender.com)

**Repositorio del Backend:** [https://github.com/falc5561-ux/tito-cafe-backend](https://github.com/falc5561-ux/tito-cafe-backend)

---

## ✨ Características Principales

* **Aplicación Web Progresiva (PWA):** La aplicación es 100% instalable en dispositivos móviles y de escritorio para una experiencia nativa y acceso offline.
* **Autenticación Basada en Roles:** Sistema de inicio de sesión seguro con roles de usuario (Cliente, Empleado, Jefe), cada uno con sus propias vistas y permisos.
* **Gestión de Pedidos:** Los clientes pueden crear pedidos, y los empleados/jefes pueden verlos y gestionarlos.
* **Pasarela de Pagos:** Integración completa con Stripe para procesar pagos en línea de forma segura.
* **Modo Oscuro/Claro:** Botón para cambiar el tema de la aplicación.
* **Modo Offline:** Incluye una página de fallback (juego del dinosaurio) si el usuario pierde la conexión a internet.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React 18, Vite, React Router
* **Estilos:** Tailwind CSS (¡Aunque este proyecto usa `App.css` y Bootstrap!)
* **Gestión de Estado:** React Context API (`AuthContext`, `CartContext`, `ThemeContext`)
* **Notificaciones:** `react-hot-toast`
* **Cliente HTTP:** `axios`
* **PWA:** `vite-plugin-pwa`

## 🚀 Cómo ejecutar este proyecto localmente

Sigue estos pasos para levantar el proyecto en tu máquina local.

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/falc5561-ux/tito-cafe-frontend.git](https://github.com/falc5561-ux/tito-cafe-frontend.git)
    ```

2.  **Entra a la carpeta del proyecto:**
    ```bash
    cd tito-cafe-frontend
    ```

3.  **Instala las dependencias:**
    (Este comando lee el `package.json` e instala todo lo necesario, como React, Vite, Axios, etc.)
    ```bash
    npm install
    ```

4.  **Ejecuta el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

5.  Abre [http://localhost:5173](http://localhost:5173) (o el puerto que te indique la terminal) en tu navegador.

**Nota:** Para que el inicio de sesión y la creación de pedidos funcionen, el [proyecto de backend](https://github.com/falc5561-ux/tito-cafe-backend) también debe estar ejecutándose.

## 📦 Despliegue

Este proyecto está desplegado en **Render**. Cada `git push` a la rama `main` dispara un nuevo despliegue automático.