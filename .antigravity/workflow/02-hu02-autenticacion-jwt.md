# HU-02: Inicio y Cierre de Sesión (DC-HU2, DS-HU2-login, DS-HU2-logout)

## 1. Resumen de Implementación
Se implementó el backend completo de la historia de usuario HU-02: Inicio y Cierre de Sesión con tokens JWT, cumpliendo rigurosamente los diagramas de clases `DC-HU2`, diagramas de secuencia `DS-HU2-login` y `DS-HU2-logout`, y el Plan de Pruebas `PP-001` (pruebas `PU-10` a `PU-16` y cobertura `CB-01`).

## 2. Componentes Implementados

### 2.1 Servicio Criptográfico JWT (`co.unillanos.secct.infrastructure.security.JwtService`)
- Configuración externa vía `application.yml`: clave secreta y vigencia configurable de 30 minutos (`CB-05`).
- `+ generateToken(User user): String`: firma digital con algoritmo HMAC-SHA256 (`HS256`) incorporando `sub` (`userId`), `roleCode` (`user.getRole().getCode()`), `iat` y `exp` (30 min).
- `+ validateToken(String token): boolean`: valida criptográficamente la firma con la clave secreta, descarta explícitamente tokens no seguros con algoritmo `"none"` (`PQ-08`), y rechaza tokens expirados o alterados (`PU-11`, `PU-12`, `PU-13`).
- `+ getUserId(String token): Integer`: extrae el `sub` del token convertido a `Integer` (`PU-14`).
- `+ getRoleCode(String token): String`: extrae la notificación `roleCode` del token (`PU-14`).

### 2.2 Filtro de Autenticación (`co.unillanos.secct.adapters.security.JwtAuthenticationFilter`)
- Extiende `OncePerRequestFilter` interceptando todas las solicitudes HTTP entrantes.
- Paso libre (`permitAll`) exclusivo para `POST /api/users`, `POST /api/auth/login`, `POST /api/auth/registro`, `/actuator/health` y solicitudes CORS preflight `OPTIONS` (`CB-12`).
- Para rutas protegidas (`/api/auth/logout`, `/api/batches/**`, etc.), extrae el encabezado `Authorization: Bearer <token>`. Si es nulo, no inicia con `Bearer ` o falla `validateToken`, responde inmediatamente con código `401 Unauthorized` y JSON de error `{"message":"Tu sesión no es válida o expiró. Inicia sesión de nuevo.","errors":[]}` sin invocar la cadena de filtros (`PU-15`, `PL-2.19`, `PL-2.24`).
- Cuando el token es válido, registra el `userId` y autoridad con prefijo `ROLE_` (`ROLE_PISCICULTOR` o `ROLE_ADMINISTRADOR`) en el `SecurityContextHolder` y continúa la cadena (`PU-16`).

### 2.3 Objetos de Transferencia de Datos (`co.unillanos.secct.usecases.dto`)
- [`LoginRequestDTO`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/dto/LoginRequestDTO.java): `email` y `password` obligatorios. Validación de longitud tras `trim()` entre 6 y 100 caracteres mediante anotación [`@TrimmedLength`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/dto/TrimmedLength.java) para rechazar en Bean Validation sin consultar la base de datos (`PL-2.05`, `PL-2.06`). `toString()` estrictamente enmascara la contraseña con `[PROTECTED]` (`RNF-SEC-04`).
- [`LoginResponseDTO`](file:///c:/Users/juand/OneDrive/Documentos/Universidad/Semestre%20VI/IS%202/Proyecto%20final/secct/backend/src/main/java/co/unillanos/secct/usecases/dto/LoginResponseDTO.java): Java record inmutable que expone únicamente `id`, `email`, `roleCode`, `accessToken` y `expiresInMinutes`, garantizando la no divulgación de atributos sensibles (`PU-10`, `PL-2.12`).

### 2.4 Servicio de Casos de Uso (`co.unillanos.secct.usecases.services.AuthService`)
- `+ login(LoginRequestDTO request): LoginResponseDTO`:
  - Normaliza el correo electrónico aplicando `trim().toLowerCase(Locale.ROOT)` (`PL-2.10`).
  - Validación de contraseña (longitud 8-20 caracteres, no vacía ni solo espacios) y longitud de correo antes de consultar BD.
  - Consulta usuario por correo normalizado en `userRepository.findByEmail`.
  - Verifica que el usuario exista, no esté eliminado lógicamente (`isDeleted == false`) y esté activo (`active == true`).
  - Compara la contraseña mediante `passwordService.verifyPassword` en tiempo constante.
  - En cualquier fallo: registra auditoría `logService.recordEvent("LOGIN_FAILED", userIdOrNull, null, null, maskedDescription)` sin exponer credenciales (`PL-2.22`) y lanza `BusinessException("credenciales inválidas", 401)` (`PL-2.09`, `PL-2.11`, `CN-02`, `CN-03`).
  - En éxito: genera token JWT, registra `logService.recordEvent("LOGIN_SUCCESS", user.getId(), null, null, maskedDescription)` (`PL-2.21`) y retorna `LoginResponseDTO.from(user, accessToken, 30)`.
- `+ logout(Integer userId): void`:
  - Registra evento de auditoría `logService.recordEvent("LOGOUT", userId, null, null, "Sesión cerrada")` (`DS-HU2-logout`, `PI-05`, `PL-2.23`).

### 2.5 Controlador REST (`co.unillanos.secct.adapters.controllers.AuthController`)
- `POST /api/auth/login`: Invoca `authService.login(request)` y retorna `200 OK` con `LoginResponseDTO`.
- `POST /api/auth/logout`: Obtiene el `userId` autenticado del `SecurityContextHolder`, delega en `authService.logout(userId)` y retorna `204 No Content` (`DS-HU2-logout`).

### 2.6 Frontend React 18 + TypeScript + Tailwind CSS
- **`src/services/authStorage.ts`**: Implementa el almacenamiento seguro en `localStorage` de `accessToken`, `roleCode`, `email` e `id`, y la función explícita `removeLocalToken(): void` exigida por `DC-HU2` y `PL-2.23`.
- **`src/services/apiClient.ts`**: Adjunta automáticamente `Authorization: Bearer ${token}` en todas las solicitudes (`PI-04`). Al recibir `401 Unauthorized`, ejecuta `removeLocalToken()` y redirige inmediatamente a `#/login` mediante `window.location.replace("#/login")` (`PS-06`).
- **`src/services/authService.ts`**: Expone `login(request)`, `logout()` y `register(request)`.
- **`src/validation/authValidation.ts`**: Valida correo (`PL-2.01`, `PL-2.03`, `PL-2.05`, `PL-2.06`) y contraseña (`PL-2.02`, `PL-2.04`, `PL-2.07`, `PL-2.08`).
- **`src/pages/LoginPage.tsx`**: Implementa `submitLogin(request)`, `showLoginResult(response)`, `submitLogout()` y `removeLocalToken()` (`DC-HU2`). Bloquea el botón durante el envío para evitar doble autenticación (`PL-2.20`). Redirige con `window.location.replace` a `#/admin` si `roleCode === 'ADMINISTRADOR'` (`PL-2.14`) o a `#/register` si es `PISCICULTOR` (`PL-2.13`).
- **`src/components/SideNav.tsx`**: Renderiza opciones dinámicas según el rol del usuario, implementa `submitLogout()` y `removeLocalToken()` (`DC-HU2`, `PS-07`, `CN-10`).
- **`src/pages/AdminPage.tsx`**: Protegido por rol. Si un `PISCICULTOR` navega a `#/admin`, bloquea el acceso mostrando la vista de estado `403 Acceso denegado` (`PL-2.15`).
- **`src/App.tsx`**: Guardia de rutas para `#/login`, `#/registro`, `#/register`, `#/evaluate` y `#/admin`, redirigiendo automáticamente a `#/login` si no está autenticado (`PS-06`, `PL-2.19`).

## 3. Matriz de Cobertura de Pruebas Unitarias y Casos de Aceptación (Plan de Pruebas PP-001)

| Caso de Prueba | Capa / Clase Evaluada | Descripción | Resultado |
|---|---|---|---|
| **PU-10** | `LoginResponseDTO` | Expone únicamente los 5 campos definidos sin datos sensibles (`PL-2.12`) | **APROBADO** |
| **PU-11** | `JwtService` | `validateToken` retorna true para token con firma íntegra y vigente (`PL-2.16`) | **APROBADO** |
| **PU-12** | `JwtService` | `validateToken` retorna false para token alterado en firma o payload (`PL-2.17`) | **APROBADO** |
| **PU-13** | `JwtService` | `validateToken` retorna false para token con expiración vencida (`PL-2.18`) | **APROBADO** |
| **PU-14** | `JwtService` | `getUserId` y `getRoleCode` extraen subject y reclamos exactamente | **APROBADO** |
| **PQ-08** | `JwtService` | `validateToken` rechaza algoritmo 'none' y tokens malformados | **APROBADO** |
| **PU-15** | `JwtAuthenticationFilter` | Rechaza solicitudes sin token o inválidas en endpoints protegidos con 401 JSON | **APROBADO** |
| **PU-16** | `JwtAuthenticationFilter` | Token válido establece `userId` y autoridad `ROLE_*` en `SecurityContextHolder` | **APROBADO** |
| **CB-01** | `AuthService` | Cobertura completa de ramas en `AuthService.login` (32/32 ramas = 100%) | **APROBADO** |
| **PL-2.01..08** | `authValidation.ts` | Validaciones de formulario de login: obligatorio, formato, longitud y espacios | **APROBADO** |
| **PL-2.09 / CN-02 / CN-03** | `AuthService` | Usuario inexistente o contraseña incorrecta genera "credenciales inválidas" (401) | **APROBADO** |
| **PL-2.10** | `AuthService` | Normalización de correo a minúsculas y sin espacios extremos | **APROBADO** |
| **PL-2.11** | `AuthService` | Usuario inactivo o eliminado produce error 401 "credenciales inválidas" | **APROBADO** |
| **PL-2.13** | `LoginPage.tsx` | Login exitoso de PISCICULTOR redirige con `replace` a `#/register` | **APROBADO** |
| **PL-2.14** | `LoginPage.tsx` | Login exitoso de ADMINISTRADOR redirige con `replace` a `#/admin` | **APROBADO** |
| **PL-2.15** | `AdminPage.tsx` | PISCICULTOR navegando a `#/admin` es bloqueado con estado 403 Acceso denegado | **APROBADO** |
| **PL-2.20** | `LoginPage.tsx` | Botón de submit bloqueado durante envío para evitar doble autenticación | **APROBADO** |
| **PL-2.21** | `AuthService` | Login exitoso audita `LOGIN_SUCCESS` con correo enmascarado | **APROBADO** |
| **PL-2.22** | `AuthService` | Login fallido audita `LOGIN_FAILED` sin datos sensibles | **APROBADO** |
| **PL-2.23 / PI-05** | `AuthService` / `SideNav.tsx` | Logout audita `LOGOUT` y ejecuta `removeLocalToken()` en cliente | **APROBADO** |
| **PS-06** | `apiClient.ts` | Error 401 invoca `removeLocalToken()` y redirige a `#/login` | **APROBADO** |
| **PS-07 / CN-10** | `SideNav.tsx` | Cierre de sesión reemplaza historial para evitar navegación "Atrás" a vistas privadas | **APROBADO** |
