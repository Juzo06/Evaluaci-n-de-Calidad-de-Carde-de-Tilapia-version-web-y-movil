<img width="1536" height="1024" alt="99c65264-b4c5-447a-9f9b-4180013e07cd" src="https://github.com/user-attachments/assets/a36d6af1-edfc-4adb-8c77-bbbe9a703536" />


# SECCT — Sistema de Evaluación de Calidad de Carne de Tilapia

SECCT es una aplicación web para registrar y evaluar lotes de tilapia bajo los estándares **NTC 1443** y **GTC 157**. El piscicultor registra un lote, sube una fotografía de cada unidad de la muestra y el sistema la clasifica automáticamente con una red neuronal convolucional (CNN). Al evaluar todas las unidades se cierra el lote y se obtiene su clasificación final.

---

## Funcionalidades

| HU | Funcionalidad | Rol | Estado |
| --- | --- | --- | --- |
| HU-01 | Registro de usuarios | Piscicultor | Implementada |
| HU-02 | Inicio y cierre de sesión (JWT) | Ambos | Implementada |
| HU-03 | Registro de lotes | Piscicultor | Implementada |
| HU-04 | Evaluación de lotes (clasificación por imagen y cierre) | Piscicultor | Implementada |
| HU-05 | Consulta de lotes evaluados | Piscicultor | Implementada |
| HU-07 | Monitoreo del sistema | Administrador | Parcial (solo interfaz) |
| HU-06, 08 a 14 | Reportes, PDF, eliminaciones y ampliación de muestra | Piscicultor | Pendientes |

### Reglas principales

- Todo usuario que se registra recibe el rol `PISCICULTOR`. El rol `ADMINISTRADOR` no se puede obtener desde el registro y debe asignarse directamente en la base de datos.
- Un lote tiene fecha de captura (no futura), peso entre 0,01 y 10.000 kg, entre 1 y 500 unidades de muestra y observaciones opcionales (máx. 500 caracteres).
- Estados del lote: `ABIERTO` → `EN_EVALUACION` → `EVALUADO` (existe también `REPORTADO`, reservado para los reportes).
- Cada unidad se evalúa con una imagen (máx. 5 MB, formato validado). No se permite evaluar dos veces la misma imagen en un lote (se compara el hash SHA-256 del contenido).
- La CNN clasifica dos partes del pez, `OJO` y `PIEL`, en una categoría NTC de 1 a 5.
- El lote solo se puede cerrar cuando todas sus unidades fueron evaluadas. La clasificación final es el promedio de las categorías, redondeado a 2 decimales.
- Los eventos relevantes (por ejemplo `UNIT_EVALUATED` y `EVALUATION_CLOSED`) se registran en la tabla de auditoría `log`.

---

## Arquitectura

El sistema tiene tres componentes que se comunican por HTTP:

```
Navegador (React)  ──►  Backend (Spring Boot)  ──►  Servicio CNN (FastAPI)
   :5173                    :8080                         :8000
                               │
                               ▼
                    PostgreSQL (Supabase)
```

| Componente | Tecnología |
| --- | --- |
| Backend | Spring Boot 4.1.1, Java 21, Maven, Spring Security, Spring Data JPA, Flyway, Actuator |
| Autenticación | JWT HS256 (jjwt 0.12.6), expiración de 30 minutos por defecto |
| Base de datos | PostgreSQL alojado en Supabase |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Servicio de inferencia | Python 3.13, FastAPI, TensorFlow 2.21 |

El backend sigue una arquitectura limpia por capas: `entities` (dominio), `usecases` (servicios, DTOs y puertos), `adapters` (controladores y filtro JWT) e `infrastructure` (configuración, repositorios y cliente HTTP de la CNN).

---

## Estructura del proyecto

```
secct/
├── backend/            API REST (Spring Boot)
│   └── src/
│       ├── main/java/co/unillanos/secct/
│       │   ├── entities/          Entidades JPA y dominio
│       │   ├── usecases/          dto/, exceptions/, ports/, services/
│       │   ├── adapters/          controllers/, security/
│       │   └── infrastructure/    config/, classifier/, repositories/, security/
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/      Migraciones Flyway
│       └── test/                  Pruebas unitarias
├── frontend/           Cliente web (React + Vite)
│   └── src/            components/, pages/, services/, types/, validation/
├── servicioCNN/        Servicio de inferencia (FastAPI)
├── models/             Modelo CNN entrenado (modelo_calidad_tilapia.h5)
├── docs/               Documentación, casos de uso y entregables
└── README.md
```

---

## Requisitos

- Java 21
- Node.js 20 o superior y npm
- Python 3.13
- Acceso a la base de datos PostgreSQL (Supabase)
- Maven no es necesario: el backend incluye Maven Wrapper (`mvnw`)

---

## Configuración

### Backend

Crea el archivo `backend/.env` con las credenciales de la base de datos y la clave del JWT:

```env
DB_URL=jdbc:postgresql://<host>:5432/postgres?sslmode=require
DB_USERNAME=<usuario>
DB_PASSWORD=<contraseña>
JWT_SECRET=<clave de al menos 32 caracteres>
```

> **Importante:** el archivo `.env` contiene credenciales. No lo subas al repositorio (agrégalo al `.gitignore`) y usa una clave `JWT_SECRET` propia y larga.

Variables opcionales:

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `DB_POOL_SIZE` | `20` | Tamaño del pool de conexiones |
| `JWT_EXPIRATION_MINUTES` | `30` | Duración del token en minutos |
| `CNN_URL` | `http://localhost:8000` | URL del servicio de inferencia |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido para el frontend |

Las migraciones de Flyway se aplican automáticamente al iniciar el backend.

### Servicio CNN

Crea el entorno virtual e instala las dependencias (una sola vez):

```bash
cd servicioCNN
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

El servicio busca el modelo en `models/modelo_calidad_tilapia.h5`. Si el archivo está en otra ruta o tiene otro nombre, define la variable `SECCT_MODELO_H5`. Si el archivo no existe, el servicio no arranca.

> No actualices TensorFlow sin comprobar antes que el modelo sigue cargando: el servicio incluye un ajuste de compatibilidad para modelos guardados con Keras 2.

### Frontend

```bash
cd frontend
npm install
```

En desarrollo, Vite redirige las peticiones `/api` a `http://localhost:8080`. Para apuntar a otro backend define `VITE_API_URL`.

---

## Ejecución

### Opción 1: script de arranque (Linux/macOS)

Desde la raíz del proyecto:

```bash
chmod +x iniciar_secct.sh
./iniciar_secct.sh
```

El script levanta el servicio CNN, espera a que responda y luego inicia el backend y el frontend. Los registros quedan en `.logs/`. Con `Ctrl+C` se detienen los tres procesos.

### Opción 2: manual (tres terminales)

```bash
# Terminal 1: servicio CNN
cd servicioCNN
.venv/bin/python servicio_inferencia.py

# Terminal 2: backend
cd backend
./mvnw spring-boot:run          # En Windows: mvnw.cmd spring-boot:run

# Terminal 3: frontend
cd frontend
npm run dev
```

Abre la aplicación en **http://localhost:5173**.

---

## API REST

Todos los endpoints requieren el encabezado `Authorization: Bearer <token>`, excepto los marcados como públicos.

| Método | Endpoint | Descripción | Acceso |
| --- | --- | --- | --- |
| POST | `/api/auth/registro` y `/api/users` | Registrar usuario (HU-01) | Público |
| POST | `/api/auth/login` | Iniciar sesión (HU-02) | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticado |
| POST | `/api/batches` | Registrar lote (HU-03) | Autenticado |
| GET | `/api/batches` y `/api/batches/available` | Lotes abiertos o en evaluación del usuario | Autenticado |
| GET | `/api/batches/evaluated` | Lotes evaluados (HU-05); equivale a `/api/batches?estado=EVALUADO` | Autenticado |
| GET | `/api/batches/{code}` | Consultar un lote por código | Autenticado |
| POST | `/api/evaluations/batches/{code}/units` | Evaluar una unidad (multipart, campo `image`) | Autenticado |
| POST | `/api/evaluations/batches/{code}/close` | Cerrar la evaluación del lote | Autenticado |
| GET | `/actuator/health` | Estado del servicio | Público |

El servicio CNN expone `GET /` (estado y modelo cargado), `POST /evaluar` (recibe `imagen_base64` y devuelve la categoría NTC de `OJO` y `PIEL`) y la documentación interactiva en `/docs`.

### Rutas del frontend

La aplicación usa rutas por hash: `#/login`, `#/registro`, `#/register` (registrar lote), `#/evaluate`, `#/evaluados` y `#/admin`. Las rutas protegidas redirigen a `#/login` si no hay sesión.

---

## Pruebas

```bash
cd backend
./mvnw test
```

Las pruebas usan JUnit, Spring Test y H2, y cubren el registro de usuarios, los DTO, las entidades, el servicio de contraseñas y el registro de eventos. El reporte de cobertura lo genera Jacoco. El frontend no tiene pruebas automatizadas todavía.

Para generar la versión de producción del frontend:

```bash
cd frontend
npm run build
```

---

## Registros (logs)

- Archivo de aplicación: `backend/logs/secct.log`.
- Auditoría de negocio: tabla `log` en la base de datos.
- Servicio CNN, backend y frontend (si se usa el script): carpeta `.logs/`.

---

## Documentación

La carpeta `docs/` contiene el análisis y diseño del proyecto:

- Requerimientos y actas de las reuniones con el cliente.
- Casos de uso por iteración, diagramas de clases y de secuencia.
- `GUIA_ENTRENAMIENTO_MODELO.md`: proceso, datos y parámetros del clasificador CNN.
- `RESTRICCIONES_INTEGRACION_MODELO.md`: condiciones que debe cumplir cualquier modelo que se integre al sistema.
- Informe semestral y documentación de arquitectura y herramientas.

---

## Equipo

Proyecto desarrollado por el equipo **Starbyte** — Universidad de los Llanos.

---

*Universidad de los Llanos · Ingeniería de Sistemas*
