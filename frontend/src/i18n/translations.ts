import { Preferences } from "@capacitor/preferences";

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_STORAGE_KEY = "secct.locale";

const BATCH_STATUS_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    ABIERTO: "Abierto",
    EN_EVALUACION: "En evaluación",
    EVALUADO: "Evaluado",
    REPORTADO: "Reportado",
  },
  en: {
    ABIERTO: "Open",
    EN_EVALUACION: "In evaluation",
    EVALUADO: "Evaluated",
    REPORTADO: "Reported",
  },
};

const ROLE_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    PISCICULTOR: "Piscicultor",
    ADMINISTRADOR: "Administrador",
  },
  en: {
    PISCICULTOR: "Fish Farmer",
    ADMINISTRADOR: "Administrator",
  },
};

const ERROR_TRANSLATIONS_EN: Record<string, string> = {
  "El nombre es obligatorio": "First name is required",
  "El nombre debe tener entre 2 y 50 letras y espacios":
    "First name must be between 2 and 50 letters and spaces",
  "El apellido es obligatorio": "Last name is required",
  "El apellido debe tener entre 2 y 50 letras y espacios":
    "Last name must be between 2 and 50 letters and spaces",
  "El correo es obligatorio": "Email address is required",
  "El correo debe tener entre 6 y 100 caracteres":
    "Email address must be between 6 and 100 characters",
  "El formato de correo no es válido": "Email address format is invalid",
  "El teléfono es obligatorio": "Phone number is required",
  "El teléfono debe tener 10 dígitos numéricos e iniciar en 3":
    "Phone number must have 10 numeric digits and start with 3",
  "La contraseña es obligatoria": "Password is required",
  "La contraseña no puede consistir solo de espacios":
    "Password cannot consist only of spaces",
  "La contraseña debe tener mínimo 8 caracteres":
    "Password must be at least 8 characters",
  "La contraseña debe tener máximo 20 caracteres":
    "Password must be at most 20 characters",
  "las contraseñas no coinciden": "Passwords do not match",
  "Debes confirmar la eliminación de tu cuenta":
    "You must confirm deleting your account",
  "La fecha de captura es obligatoria": "Capture date is required",
  "La fecha de captura no puede ser futura":
    "Capture date cannot be in the future",
  "El peso es obligatorio": "Weight is required",
  "El peso debe ser un número": "Weight must be a number",
  "El peso debe ser mayor que 0": "Weight must be greater than 0",
  "El peso no puede superar 10.000,00": "Weight cannot exceed 10,000.00",
  "El peso admite máximo 2 decimales":
    "Weight allows at most 2 decimal places",
  "El número de unidades de muestra es obligatorio":
    "Sample unit count is required",
  "Las unidades de muestra deben ser un entero entre 1 y 500":
    "Sample units must be an integer between 1 and 500",
  "Las observaciones admiten máximo 500 caracteres":
    "Notes allow at most 500 characters",
  "El número de unidades adicionales es obligatorio":
    "Additional unit count is required",
  "Las unidades adicionales deben ser un entero entre 1 y 499":
    "Additional units must be an integer between 1 and 499",
  "La muestra no puede superar 500 unidades":
    "Sample cannot exceed 500 units",
  "La imagen está vacía": "The image file is empty",
  "La imagen supera el tamaño máximo de 5 MB":
    "The image exceeds the maximum size of 5 MB",
  "El archivo no es una imagen JPG o PNG válida":
    "The file is not a valid JPG or PNG image",
  "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.":
    "Could not connect to the server. Please check your connection and try again.",
  "Tu sesión no es válida o expiró. Inicia sesión de nuevo.":
    "Your session is invalid or expired. Please sign in again.",
  "No se pudo completar la solicitud.":
    "The request could not be completed.",
  "Credenciales inválidas.": "Invalid credentials.",
  "Credenciales inválidas": "Invalid credentials",
  "El correo ya está registrado.": "This email is already registered.",
  "El correo ya se encuentra registrado.":
    "This email is already registered.",
  "La contraseña actual no es correcta.": "Current password is incorrect.",
  "No tienes permisos para realizar esta acción.":
    "You do not have permission to perform this action.",
  "No se encontró el recurso solicitado.":
    "The requested resource was not found.",
  "Ocurrió un error inesperado. Intenta de nuevo.":
    "An unexpected error occurred. Please try again.",
  "Ocurrió un error inesperado al consultar los lotes evaluados.":
    "An unexpected error occurred while fetching evaluated batches.",
  "No se pudo cargar el listado de lotes vigentes.":
    "Could not load the list of active batches.",
  "No se pudo eliminar el lote seleccionado.":
    "Could not delete the selected batch.",
  "No se pudo generar el reporte del lote.":
    "Could not generate the batch report.",
  "No se pudo consultar el reporte guardado.":
    "Could not retrieve the saved report.",
  "No se pudo guardar el reporte del lote.":
    "Could not save the batch report.",
  "No se pudo exportar el reporte a PDF.":
    "Could not export the report to PDF.",
  "No se pudieron consultar los reportes guardados.":
    "Could not retrieve saved reports.",
  "No se pudo abrir el detalle del reporte.":
    "Could not open report details.",
  "No se pudo eliminar el reporte seleccionado.":
    "Could not delete the selected report.",
  "Ocurrió un error inesperado al intentar eliminar tu cuenta.":
    "An unexpected error occurred while trying to delete your account.",
  "No se pudo cargar la información de monitoreo del sistema.":
    "Could not load system monitoring information.",
  "Ocurrió un error inesperado al registrar el usuario. Intenta de nuevo.":
    "An unexpected error occurred while registering the user. Please try again.",
  "Ocurrió un error inesperado al ampliar la muestra.":
    "An unexpected error occurred while expanding the sample.",
};

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  es: {
    "app.skipToMain": "Saltar al contenido principal",
    "app.authenticatedUser": "Usuario autenticado",
    "app.languageLabel": "Seleccionar idioma",
    "app.languageEs": "Español",
    "app.languageEn": "Inglés",
    "app.unexpectedError": "Ocurrió un error inesperado. Intenta de nuevo.",

    "nav.sidebarAria": "Barra lateral del sistema",
    "nav.brandLine1": "Calidad de",
    "nav.brandLine2": "Tilapia",
    "nav.mainAria": "Navegación principal",
    "nav.adminMonitoring": "Monitoreo del sistema",
    "nav.registerUser": "Registrar usuario",
    "nav.registerBatch": "Registrar lote",
    "nav.evaluateBatch": "Evaluar lote",
    "nav.evaluatedBatches": "Lotes evaluados",
    "nav.batchManagement": "Gestión de lotes",
    "nav.savedReports": "Reportes guardados",
    "nav.profile": "Mi cuenta",
    "nav.logout": "Cerrar sesión",
    "nav.loggingOut": "Cerrando sesión...",
    "nav.languageHeading": "Idioma",

    "a11y.toolsAria": "Herramientas de accesibilidad",
    "a11y.panelAria": "Panel de opciones de accesibilidad",
    "a11y.title": "Accesibilidad",
    "a11y.closePanelAria": "Cerrar panel de accesibilidad",
    "a11y.close": "Cerrar",
    "a11y.fontSizeLegend": "Tamaño de fuente",
    "a11y.textScaleAria": "Escala de texto",
    "a11y.fontSize.normal": "Normal",
    "a11y.fontSize.large": "Grande",
    "a11y.fontSize.xlarge": "Extra grande",
    "a11y.highContrast.label": "Alto contraste",
    "a11y.highContrast.description": "Refuerza el contraste entre texto, bordes y fondo.",
    "a11y.grayscale.label": "Escala de grises",
    "a11y.grayscale.description": "Convierte toda la interfaz a tonos de gris.",
    "a11y.underlineLinks.label": "Subrayar enlaces",
    "a11y.underlineLinks.description": "Hace visible el subrayado en todos los enlaces.",
    "a11y.reduceMotion.label": "Reducir animaciones",
    "a11y.reduceMotion.description": "Minimiza transiciones y movimientos en pantalla.",
    "a11y.languageLegend": "Idioma",
    "a11y.reset": "Restablecer preferencias",
    "a11y.openTriggerAria": "Abrir herramientas de accesibilidad",
    "a11y.closeTriggerAria": "Cerrar herramientas de accesibilidad",

    "auth.systemInfoAria": "Información del sistema",
    "auth.brandName": "Calidad de Tilapia",
    "auth.badgeNtc": "Clasificación NTC 1443",
    "auth.login.heroTitle": "Bienvenido de nuevo",
    "auth.login.heroSubtitle": "Ingresa para continuar con tus lotes y evaluaciones.",
    "auth.login.formTitle": "Iniciar sesión",
    "auth.login.legend": "Credenciales de acceso",
    "auth.login.emailLabel": "Correo electrónico",
    "auth.login.emailPlaceholder": "nombre@correo.com",
    "auth.login.passwordLabel": "Contraseña",
    "auth.login.invalidCredentialsFallback": "Credenciales inválidas.",
    "auth.login.submitting": "Ingresando...",
    "auth.login.submit": "Ingresar",
    "auth.login.noAccount": "¿Aún no tienes cuenta?",
    "auth.login.registerLink": "Regístrate",
    "auth.login.roleNotice": "Al ingresar, el sistema te lleva a la vista de tu rol: piscicultor o administrador.",
    "auth.register.heroTitle": "Evalúa tu cosecha con confianza",
    "auth.register.heroSubtitle": "Registra tus lotes y conoce la calidad de cada unidad.",

    "userForm.title": "Registrar usuario",
    "userForm.subtitle": "Para gestionar tus lotes y evaluaciones.",
    "userForm.formAria": "Formulario de registro de usuario",
    "userForm.personalLegend": "Información personal y de contacto",
    "userForm.firstNameLabel": "Nombres",
    "userForm.firstNamePlaceholder": "Máximo 50 caracteres",
    "userForm.lastNameLabel": "Apellidos",
    "userForm.lastNamePlaceholder": "Máximo 50 caracteres",
    "userForm.emailLabel": "Correo electrónico",
    "userForm.emailPlaceholder": "nombre@correo.com",
    "userForm.emailHint": "Máximo 100 caracteres. Con él iniciarás sesión.",
    "userForm.phoneLabel": "Teléfono celular",
    "userForm.phonePlaceholder": "3001234567",
    "userForm.phoneHint": "10 dígitos, inicia en 3",
    "userForm.securityLegend": "Credenciales de seguridad",
    "userForm.passwordLabel": "Contraseña",
    "userForm.passwordHint": "8 a 20 caracteres",
    "userForm.confirmPasswordLabel": "Confirmar contraseña",
    "userForm.submitting": "Creando cuenta...",
    "userForm.submit": "Crear cuenta",
    "userForm.hasAccount": "¿Ya tienes cuenta?",
    "userForm.loginLink": "Inicia sesión",
    "userForm.unexpectedError": "Ocurrió un error inesperado al registrar el usuario. Intenta de nuevo.",

    "userCard.title": "Usuario registrado exitosamente",
    "userCard.subtitle": "El nuevo usuario ha sido registrado en el sistema con su identificador único.",
    "userCard.userId": "ID de Usuario:",
    "userCard.email": "Correo Electrónico:",
    "userCard.role": "Rol Asignado:",
    "userCard.goToLogin": "Iniciar Sesión",
    "userCard.goToRegisterBatch": "Ir a Registrar Lote",
    "userCard.registerAnother": "Registrar otro usuario",

    "batch.register.title": "Registrar lote",
    "batch.register.subtitle": "Identifica tu lote para llevar su trazabilidad.",

    "batchForm.dataLegend": "Datos del lote",
    "batchForm.captureDateLabel": "Fecha de captura",
    "batchForm.captureDatePlaceholder": "dd/mm/aaaa",
    "batchForm.captureDateHint": "No puede ser futura",
    "batchForm.weightLabel": "Peso (kg)",
    "batchForm.weightPlaceholder": "0,00",
    "batchForm.weightHint": "Mayor que 0, hasta 2 decimales, máx. 10.000,00",
    "batchForm.unitsLabel": "Número de unidades de muestra",
    "batchForm.unitsHint": "Entero de 1 a 500",
    "batchForm.notesLegend": "Observaciones del lote",
    "batchForm.notesLabel": "Observaciones (opcional)",
    "batchForm.notesPlaceholder": "Máximo 500 caracteres",
    "batchForm.codeNote":
      "El código del lote lo genera automáticamente el sistema al guardar y el lote quedará abierto para evaluación.",
    "batchForm.cancel": "Cancelar",
    "batchForm.submit": "Guardar lote",

    "batchCard.title": "Lote registrado",
    "batchCard.code": "Código del lote:",
    "batchCard.captureDate": "Fecha de captura:",
    "batchCard.weight": "Peso:",
    "batchCard.units": "Número de unidades de muestra:",
    "batchCard.notes": "Observaciones:",
    "batchCard.status": "Estado:",
    "batchCard.registerAnother": "Registrar otro lote",

    "eval.title": "Evaluar lote",
    "eval.subtitle": "Carga una imagen por unidad y el sistema la clasifica.",
    "eval.sectionAria": "Selección de lote y carga de muestra",

    "selector.label": "Lote disponible",
    "selector.loading": "Cargando lotes...",
    "selector.empty": "Sin resultados",
    "selector.placeholder": "Selecciona un lote",
    "selector.emptyHelp": "No tienes lotes disponibles para evaluar",

    "unitForm.dropAria": "Cargar imagen de muestra",
    "unitForm.dropPrompt1": "Arrastra una imagen aquí o selecciónala",
    "unitForm.dropPrompt2": "JPG o PNG, máximo 5 MB",
    "unitForm.fileInputAria": "Seleccionar archivo de imagen (JPG o PNG)",
    "unitForm.classifiedUnits": "Unidades clasificadas: {count} de {total}",
    "unitForm.progressAria": "Progreso de unidades clasificadas",
    "unitForm.progressValue": "{count} de {total}",
    "unitForm.uploading": "Clasificando...",
    "unitForm.upload": "Cargar imagen",

    "unitResults.title": "Resultado por unidad",
    "unitResults.caption": "Resultados de clasificación NTC 1443 por unidad",
    "unitResults.col.unit": "UNIDAD",
    "unitResults.col.eye": "OJO",
    "unitResults.col.skin": "PIEL",
    "unitResults.col.confidence": "CONFIANZA (0 a 1)",
    "unitResults.empty": "Aún no hay unidades clasificadas en esta sesión",
    "unitResults.category": "Categoría {category}",
    "unitResults.eyeLabel": "OJO",
    "unitResults.skinLabel": "PIEL",
    "unitResults.closedPrefix": "Evaluación finalizada. El lote {code} pasó a estado {status} y su clasificación final es:",
    "unitResults.closeHint":
      "Finalizar evaluación se habilita cuando todas las unidades están clasificadas. Al finalizar, el lote queda evaluado y se calcula su clasificación final.",
    "unitResults.closing": "Finalizando...",
    "unitResults.closeButton": "Finalizar evaluación",

    "expand.unexpectedError": "Ocurrió un error inesperado al ampliar la muestra.",
    "expand.title": "Ampliar muestra del lote",
    "expand.subtitle": "Añade unidades adicionales a un lote evaluado o reportado para complementar sus resultados.",
    "expand.col.code": "CÓDIGO DEL LOTE",
    "expand.col.currentStatus": "ESTADO ACTUAL",
    "expand.col.currentSample": "MUESTRA ACTUAL",
    "expand.col.currentClassification": "CLASIFICACIÓN VIGENTE",
    "expand.selectedBatch": "Lote seleccionado",
    "expand.sampleCompleted": "Muestra completada",
    "expand.enabledHint": "Disponible en lotes evaluados o reportados",
    "expand.additionalUnitsLabel": "Número de unidades adicionales",
    "expand.additionalUnitsPlaceholder": "Ej. 10",
    "expand.additionalUnitsHint": "Entero positivo de 1 a 499 (total acumulado máx. 500 unidades; disponibles: {max}).",
    "expand.infoNote":
      "Al ampliar la muestra, el lote volverá a estar en evaluación para cargar las nuevas imágenes, conservando las evaluaciones previas. Si tenía un reporte guardado, pasará al historial como versión anterior.",
    "expand.cancel": "Cancelar",
    "expand.submitting": "Ampliando muestra...",
    "expand.submit": "Ampliar muestra y continuar",

    "evaluated.title": "Lotes evaluados",
    "evaluated.subtitle": "Revisa la información registrada y los resultados de calidad de tus lotes completados.",
    "evaluated.loadError": "Ocurrió un error inesperado al consultar los lotes evaluados.",
    "evaluated.loading": "Cargando lotes evaluados...",
    "evaluated.emptyTitle": "Sin resultados",
    "evaluated.tableCaption":
      "Listado de lotes evaluados y reportados con clasificación final NTC 1443 y acciones disponibles",
    "evaluated.col.code": "CÓDIGO",
    "evaluated.col.capture": "CAPTURA",
    "evaluated.col.weight": "PESO (KG)",
    "evaluated.col.sample": "MUESTRA",
    "evaluated.col.notes": "OBSERVACIONES",
    "evaluated.col.eval": "EVAL.",
    "evaluated.col.status": "ESTADO",
    "evaluated.col.classification": "CLASIFICACIÓN",
    "evaluated.col.actions": "ACCIONES",
    "evaluated.action.generateReport": "Generar reporte",
    "evaluated.action.generateReportAria": "Generar reporte del lote {code}",
    "evaluated.action.expandSample": "Ampliar muestra",
    "evaluated.action.expandSampleAria": "Ampliar muestra del lote {code}",

    "manage.title": "Gestión de lotes",
    "manage.subtitle": "Lista todos tus lotes vigentes y depura aquellos creados por error o que ya no necesitas.",
    "manage.loadError": "No se pudo cargar el listado de lotes vigentes.",
    "manage.deleteSuccess": "Lote {code} eliminado correctamente.",
    "manage.deleteError": "No se pudo eliminar el lote seleccionado.",
    "manage.loading": "Cargando lotes vigentes...",
    "manage.emptyTitle": "Sin lotes registrados",
    "manage.emptySubtitle": "No tienes lotes vigentes en este momento.",
    "manage.tableCaption": "Lotes vigentes del usuario con opción de eliminación",
    "manage.col.code": "CÓDIGO",
    "manage.col.captureDate": "FECHA DE CAPTURA",
    "manage.col.weight": "PESO (KG)",
    "manage.col.units": "UNIDADES",
    "manage.col.status": "ESTADO",
    "manage.col.classification": "CLASIFICACIÓN",
    "manage.col.action": "ACCIÓN",
    "manage.delete": "Eliminar",
    "manage.deleteAria": "Eliminar lote {code}",
    "manage.confirmTitle": "¿Confirmas eliminar el lote {code}?",
    "manage.confirmBody":
      "Se dará de baja el lote seleccionado junto con sus reportes asociados, conservando el historial de evaluaciones. Solo puedes eliminar lotes propios.",
    "manage.cancel": "Cancelar",
    "manage.deleting": "Eliminando...",
    "manage.confirmDelete": "Confirmar eliminación",
    "batchManagement.successDelete": "Lote {code} eliminado correctamente.",

    "report.titleSaved": "Reporte guardado · Versión v{version}",
    "report.titleBatch": "Reporte del lote",
    "report.subtitle": "Información consolidada del lote, resultados individuales y estadísticas NTC 1443.",
    "report.generateError": "No se pudo generar el reporte del lote.",
    "report.consultError": "No se pudo consultar el reporte guardado.",
    "report.saveError": "No se pudo guardar el reporte del lote.",
    "report.exportError": "No se pudo exportar el reporte a PDF.",
    "report.invalidTarget": "No se especificó un lote o reporte válido para visualizar.",
    "report.savedBannerTitle": "Reporte guardado (versión {version})",
    "report.savedBannerStoredAt": "Almacenado el ",
    "report.savedBannerSuffix": " para el lote {code}. Estado del lote: Reportado.",
    "report.viewSavedReports": "Ver reportes guardados",
    "report.loading": "Cargando reporte del lote...",
    "report.summaryHeading": "Resumen del lote evaluado",
    "report.field.batchCode": "CÓDIGO DEL LOTE",
    "report.field.captureDate": "FECHA DE CAPTURA",
    "report.field.weightSample": "PESO / MUESTRA",
    "report.field.eyeSkinAvg": "PROMEDIO OJO / PIEL",
    "report.field.finalClassification": "CLASIFICACIÓN FINAL",
    "report.notesLine": "Observaciones registradas: {notes}.",
    "report.noNotes": "Sin observaciones",
    "report.ntcTitle": "Distribución NTC 1443",
    "report.ntcSubtitle": "Distribución de unidades por categoría NTC 1 a 5",
    "report.chartAlt": "Gráfica de distribución de unidades por categoría NTC",
    "report.ntcCountAria": "Conteo de unidades por categoría NTC",
    "report.catShort": "Cat. {cat}",
    "report.evaluationsCountFooter": "Total de evaluaciones contabilizadas: {count} de {total}.",
    "report.unitsTitle": "Evaluaciones individuales del lote",
    "report.consolidatedTitle": "Estadísticas consolidadas",
    "report.unitsTableCaption": "Resultados individuales de clasificación organoléptica NTC 1443 por unidad",
    "report.col.unit": "UNIDAD",
    "report.col.dateTime": "FECHA Y HORA",
    "report.col.eye": "OJO (CAT. / CONF.)",
    "report.col.skin": "PIEL (CAT. / CONF.)",
    "report.frozenTitle": "Resultados guardados de esta versión",
    "report.frozenBody":
      "Este reporte conserva los resultados guardados de esa versión: muestra de {count}, promedios de OJO ({eye}) y PIEL ({skin}) y distribución NTC 1443 (v{version}).",
    "report.alreadyReportedHint":
      "Este lote ya fue reportado y cuenta con una versión vigente en tus reportes guardados.",
    "report.saveHint":
      "Guardar reporte está disponible cuando el lote está evaluado y almacena una nueva versión en \"Reportes guardados\".",
    "report.backToSaved": "Volver a reportes guardados",
    "report.backToEvaluated": "Volver a lotes evaluados",
    "report.saving": "Guardando...",
    "report.save": "Guardar reporte",
    "report.exportingPdf": "Exportando PDF...",
    "report.exportPdf": "Exportar PDF",
    "report.unavailable": "No hay información de reporte disponible para mostrar.",

    "savedReports.title": "Reportes guardados",
    "savedReports.subtitle": "Consulta en cualquier momento las versiones de reportes almacenadas de tus lotes.",
    "savedReports.listHeading": "Mis reportes almacenados",
    "savedReports.loadError": "No se pudieron consultar los reportes guardados.",
    "savedReports.openError": "No se pudo abrir el detalle del reporte.",
    "savedReports.exportError": "No se pudo exportar el reporte a PDF.",
    "savedReports.deleteSuccessItem": "Reporte v{version} del lote {code} eliminado correctamente.",
    "savedReports.deleteSuccess": "Reporte eliminado correctamente.",
    "savedReports.successDelete": "Reporte eliminado correctamente.",
    "savedReports.deleteError": "No se pudo eliminar el reporte seleccionado.",
    "savedReports.loadingList": "Cargando reportes guardados...",
    "savedReports.emptyTitle": "Aún no tienes reportes guardados",
    "savedReports.retry": "Reintentar",
    "savedReports.tableCaption": "Versiones de reportes guardados por lote, vigencia y acciones disponibles",
    "savedReports.col.batch": "LOTE",
    "savedReports.col.version": "VER.",
    "savedReports.col.validity": "VIGENCIA",
    "savedReports.col.final": "FINAL",
    "savedReports.col.date": "FECHA",
    "savedReports.col.actions": "ACCIONES",
    "savedReports.current": "Vigente",
    "savedReports.previous": "Anterior",
    "savedReports.view": "Ver reporte",
    "savedReports.viewAria": "Ver reporte versión {version} del lote {code}",
    "savedReports.exportPdf": "Exportar PDF",
    "savedReports.exporting": "Exportando...",
    "savedReports.exportAria": "Exportar a PDF reporte versión {version} del lote {code}",
    "savedReports.delete": "Eliminar",
    "savedReports.deleteAria": "Eliminar reporte versión {version} del lote {code}",
    "savedReports.detailTitleWithBatch": "Detalle · {code} (v{version})",
    "savedReports.detailTitle": "Detalle del reporte",
    "savedReports.loadingDetail": "Cargando versión del reporte...",
    "savedReports.field.captureWeight": "CAPTURA / PESO",
    "savedReports.field.evaluationsVersion": "EVALUACIONES (v{version})",
    "savedReports.field.eyeSkin": "OJO / PIEL",
    "savedReports.field.classification": "CLASIFICACIÓN",
    "savedReports.frozenDistAria": "Distribución de resultados guardados por categoría NTC 1443",
    "savedReports.openFull": "Abrir en vista completa",
    "savedReports.deleteReport": "Eliminar reporte",
    "savedReports.selectPrompt":
      "Selecciona \"Ver reporte\" en una fila para consultar los resultados guardados de esa versión.",
    "savedReports.confirmTitle": "¿Confirmas eliminar el reporte v{version} de {code}?",
    "savedReports.confirmBody":
      "El lote y sus evaluaciones individuales se conservan. Si eliminas la versión vigente, el lote volverá al estado evaluado.",
    "savedReports.cancel": "Cancelar",
    "savedReports.deleting": "Eliminando...",
    "savedReports.confirmDelete": "Confirmar eliminación",

    "profile.title": "Mi cuenta",
    "profile.subtitle": "Consulta tus datos registrados o solicita la eliminación de tu cuenta.",
    "profile.holderTitle": "Datos del titular",
    "profile.field.fullName": "NOMBRES Y APELLIDOS",
    "profile.field.email": "CORREO ELECTRÓNICO",
    "profile.noEmail": "Sin correo disponible",
    "profile.field.role": "ROL ASIGNADO",
    "profile.deleteTitle": "Eliminar cuenta de usuario",
    "profile.deleteDesc":
      "Al confirmar se dará de baja tu cuenta junto con tus lotes y reportes, y se cerrará tu sesión de inmediato.",
    "profile.deleteUnexpectedError": "Ocurrió un error inesperado al intentar eliminar tu cuenta.",
    "profile.passwordLabel": "Ingresa tu contraseña actual como confirmación",
    "profile.passwordPlaceholder": "Contraseña de 8 a 20 caracteres",
    "profile.passwordHint":
      "Si la contraseña ingresada no coincide, la operación será rechazada y tu sesión permanecerá activa.",
    "profile.confirmCheck": "Confirmo que deseo eliminar mi cuenta de manera irreversible.",
    "profile.irreversibleWarning":
      "Acción irreversible: una vez eliminada la cuenta, no podrás volver a iniciar sesión.",
    "profile.cancel": "Cancelar",
    "profile.submittingDelete": "Eliminando cuenta...",
    "profile.submitDelete": "Eliminar cuenta",

    "admin.loadError": "No se pudo cargar la información de monitoreo del sistema.",
    "admin.status403": "Estado 403",
    "admin.accessDenied": "Acceso denegado",
    "admin.accessDeniedBodyPrefix":
      "No tienes los permisos requeridos para acceder al panel de administración del sistema SECCT. Este módulo está restringido exclusivamente a usuarios con rol ",
    "admin.userLabel": "Usuario:",
    "admin.unknownUser": "Desconocido",
    "admin.detectedRoleLabel": "Rol detectado:",
    "admin.noRole": "Sin rol asignado",
    "admin.backToBatches": "Volver a gestión de lotes",
    "admin.title": "Monitoreo del sistema",
    "admin.subtitle": "Información general de actividad y uso global de la plataforma.",
    "admin.badgeAria": "Usuario administrador autenticado",
    "admin.badgePrefix": "Administrador · {name}",
    "admin.metricsHeading": "Indicadores globales del sistema",
    "admin.metricUsersTitle": "USUARIOS REGISTRADOS",
    "admin.metricUsersDesc": "Cuentas activas registradas en la plataforma.",
    "admin.metricBatchesTitle": "LOTES CREADOS",
    "admin.metricBatchesDesc": "Lotes vigentes registrados por los piscicultores.",
    "admin.metricEvaluationsTitle": "EVALUACIONES REALIZADAS",
    "admin.metricEvaluationsDesc": "Unidades de tilapia evaluadas en lotes vigentes.",
    "admin.detailTitle": "Detalle de métricas globales",
    "admin.loadingMetrics": "Cargando indicadores del sistema...",
    "admin.tableCaption": "Detalle de conteo de usuarios, lotes y evaluaciones activas en SECCT",
    "admin.col.indicator": "INDICADOR DEL SISTEMA",
    "admin.col.total": "TOTAL VIGENTE",
    "admin.col.status": "ESTADO",
    "admin.row.usersName": "Usuarios activos",
    "admin.row.usersDesc": "Piscicultores y administradores con cuenta activa",
    "admin.row.batchesName": "Lotes vigentes",
    "admin.row.batchesDesc": "Lotes registrados disponibles para evaluación, evaluados o reportados",
    "admin.row.evalsName": "Evaluaciones vigentes",
    "admin.row.evalsDesc": "Unidades evaluadas dentro de lotes vigentes",
    "admin.statusOperational": "Operativo",
    "admin.footerNote": "Resumen general actualizado de los registros activos en la plataforma.",
    "admin.registerNewUser": "Registrar nuevo usuario",
    "admin.refreshing": "Actualizando...",
    "admin.refresh": "Actualizar indicadores",
  },
  en: {
    "app.skipToMain": "Skip to main content",
    "app.authenticatedUser": "Authenticated user",
    "app.languageLabel": "Select language",
    "app.languageEs": "Spanish",
    "app.languageEn": "English",
    "app.unexpectedError": "An unexpected error occurred. Please try again.",

    "nav.sidebarAria": "System sidebar",
    "nav.brandLine1": "Tilapia",
    "nav.brandLine2": "Quality",
    "nav.mainAria": "Main navigation",
    "nav.adminMonitoring": "System monitoring",
    "nav.registerUser": "Register user",
    "nav.registerBatch": "Register batch",
    "nav.evaluateBatch": "Evaluate batch",
    "nav.evaluatedBatches": "Evaluated batches",
    "nav.batchManagement": "Batch management",
    "nav.savedReports": "Saved reports",
    "nav.profile": "My account",
    "nav.logout": "Sign out",
    "nav.loggingOut": "Signing out...",
    "nav.languageHeading": "Language",

    "a11y.toolsAria": "Accessibility tools",
    "a11y.panelAria": "Accessibility options panel",
    "a11y.title": "Accessibility",
    "a11y.closePanelAria": "Close accessibility panel",
    "a11y.close": "Close",
    "a11y.fontSizeLegend": "Font size",
    "a11y.textScaleAria": "Text scale",
    "a11y.fontSize.normal": "Normal",
    "a11y.fontSize.large": "Large",
    "a11y.fontSize.xlarge": "Extra large",
    "a11y.highContrast.label": "High contrast",
    "a11y.highContrast.description": "Enhances contrast between text, borders, and background.",
    "a11y.grayscale.label": "Grayscale",
    "a11y.grayscale.description": "Converts the entire interface to shades of gray.",
    "a11y.underlineLinks.label": "Underline links",
    "a11y.underlineLinks.description": "Makes underlines visible on all links.",
    "a11y.reduceMotion.label": "Reduce animations",
    "a11y.reduceMotion.description": "Minimizes transitions and motion on screen.",
    "a11y.languageLegend": "Language",
    "a11y.reset": "Reset preferences",
    "a11y.openTriggerAria": "Open accessibility tools",
    "a11y.closeTriggerAria": "Close accessibility tools",

    "auth.systemInfoAria": "System information",
    "auth.brandName": "Tilapia Quality",
    "auth.badgeNtc": "NTC 1443 Classification",
    "auth.login.heroTitle": "Welcome back",
    "auth.login.heroSubtitle": "Sign in to continue with your batches and evaluations.",
    "auth.login.formTitle": "Sign in",
    "auth.login.legend": "Access credentials",
    "auth.login.emailLabel": "Email address",
    "auth.login.emailPlaceholder": "name@email.com",
    "auth.login.passwordLabel": "Password",
    "auth.login.invalidCredentialsFallback": "Invalid credentials.",
    "auth.login.submitting": "Signing in...",
    "auth.login.submit": "Sign in",
    "auth.login.noAccount": "Don't have an account yet?",
    "auth.login.registerLink": "Sign up",
    "auth.login.roleNotice": "Upon signing in, the system takes you to your role view: fish farmer or administrator.",
    "auth.register.heroTitle": "Evaluate your harvest with confidence",
    "auth.register.heroSubtitle": "Register your batches and track the quality of each unit.",

    "userForm.title": "Register user",
    "userForm.subtitle": "To manage your batches and evaluations.",
    "userForm.formAria": "User registration form",
    "userForm.personalLegend": "Personal and contact information",
    "userForm.firstNameLabel": "First name",
    "userForm.firstNamePlaceholder": "Maximum 50 characters",
    "userForm.lastNameLabel": "Last name",
    "userForm.lastNamePlaceholder": "Maximum 50 characters",
    "userForm.emailLabel": "Email address",
    "userForm.emailPlaceholder": "name@email.com",
    "userForm.emailHint": "Maximum 100 characters. You will use it to sign in.",
    "userForm.phoneLabel": "Mobile phone",
    "userForm.phonePlaceholder": "3001234567",
    "userForm.phoneHint": "10 digits, starts with 3",
    "userForm.securityLegend": "Security credentials",
    "userForm.passwordLabel": "Password",
    "userForm.passwordHint": "8 to 20 characters",
    "userForm.confirmPasswordLabel": "Confirm password",
    "userForm.submitting": "Creating account...",
    "userForm.submit": "Create account",
    "userForm.hasAccount": "Already have an account?",
    "userForm.loginLink": "Sign in",
    "userForm.unexpectedError": "An unexpected error occurred while registering the user. Please try again.",

    "userCard.title": "User registered successfully",
    "userCard.subtitle": "The new user has been registered in the system with a unique identifier.",
    "userCard.userId": "User ID:",
    "userCard.email": "Email Address:",
    "userCard.role": "Assigned Role:",
    "userCard.goToLogin": "Sign In",
    "userCard.goToRegisterBatch": "Go to Register Batch",
    "userCard.registerAnother": "Register another user",

    "batch.register.title": "Register batch",
    "batch.register.subtitle": "Identify your batch to keep full traceability.",

    "batchForm.dataLegend": "Batch details",
    "batchForm.captureDateLabel": "Capture date",
    "batchForm.captureDatePlaceholder": "dd/mm/yyyy",
    "batchForm.captureDateHint": "Cannot be in the future",
    "batchForm.weightLabel": "Weight (kg)",
    "batchForm.weightPlaceholder": "0.00",
    "batchForm.weightHint": "Greater than 0, up to 2 decimal places, max 10,000.00",
    "batchForm.unitsLabel": "Sample unit count",
    "batchForm.unitsHint": "Integer from 1 to 500",
    "batchForm.notesLegend": "Batch notes",
    "batchForm.notesLabel": "Notes (optional)",
    "batchForm.notesPlaceholder": "Maximum 500 characters",
    "batchForm.codeNote":
      "The batch code is automatically generated when saving and the batch will remain open for evaluation.",
    "batchForm.cancel": "Cancel",
    "batchForm.submit": "Save batch",

    "batchCard.title": "Batch registered",
    "batchCard.code": "Batch code:",
    "batchCard.captureDate": "Capture date:",
    "batchCard.weight": "Weight:",
    "batchCard.units": "Sample unit count:",
    "batchCard.notes": "Notes:",
    "batchCard.status": "Status:",
    "batchCard.registerAnother": "Register another batch",

    "eval.title": "Evaluate batch",
    "eval.subtitle": "Upload one image per unit and the system classifies it.",
    "eval.sectionAria": "Batch selection and sample upload",

    "selector.label": "Available batch",
    "selector.loading": "Loading batches...",
    "selector.empty": "No results",
    "selector.placeholder": "Select a batch",
    "selector.emptyHelp": "You have no batches available for evaluation",

    "unitForm.dropAria": "Upload sample image",
    "unitForm.dropPrompt1": "Drag an image here or browse to select",
    "unitForm.dropPrompt2": "JPG or PNG, maximum 5 MB",
    "unitForm.fileInputAria": "Select image file (JPG or PNG)",
    "unitForm.classifiedUnits": "Classified units: {count} of {total}",
    "unitForm.progressAria": "Classified units progress",
    "unitForm.progressValue": "{count} of {total}",
    "unitForm.uploading": "Classifying...",
    "unitForm.upload": "Upload image",

    "unitResults.title": "Result per unit",
    "unitResults.caption": "NTC 1443 classification results per unit",
    "unitResults.col.unit": "UNIT",
    "unitResults.col.eye": "EYE",
    "unitResults.col.skin": "SKIN",
    "unitResults.col.confidence": "CONFIDENCE (0 to 1)",
    "unitResults.empty": "No units have been classified in this session yet",
    "unitResults.category": "Category {category}",
    "unitResults.eyeLabel": "EYE",
    "unitResults.skinLabel": "SKIN",
    "unitResults.closedPrefix": "Evaluation finished. Batch {code} moved to {status} status and its final classification is:",
    "unitResults.closeHint":
      "Finish evaluation is enabled once all units are classified. Upon completion, the batch is marked as evaluated and its final classification is calculated.",
    "unitResults.closing": "Finishing...",
    "unitResults.closeButton": "Finish evaluation",

    "expand.unexpectedError": "An unexpected error occurred while expanding the sample.",
    "expand.title": "Expand batch sample",
    "expand.subtitle": "Add additional units to an evaluated or reported batch to complement its results.",
    "expand.col.code": "BATCH CODE",
    "expand.col.currentStatus": "CURRENT STATUS",
    "expand.col.currentSample": "CURRENT SAMPLE",
    "expand.col.currentClassification": "CURRENT CLASSIFICATION",
    "expand.selectedBatch": "Selected batch",
    "expand.sampleCompleted": "Sample completed",
    "expand.enabledHint": "Available for evaluated or reported batches",
    "expand.additionalUnitsLabel": "Number of additional units",
    "expand.additionalUnitsPlaceholder": "E.g. 10",
    "expand.additionalUnitsHint": "Positive integer from 1 to 499 (max total 500 units; available: {max}).",
    "expand.infoNote":
      "When expanding the sample, the batch will return to evaluation so you can upload the new images, keeping previous evaluations. If it had a saved report, it will move to the history as a previous version.",
    "expand.cancel": "Cancel",
    "expand.submitting": "Expanding sample...",
    "expand.submit": "Expand sample and continue",

    "evaluated.title": "Evaluated batches",
    "evaluated.subtitle": "Review recorded information and quality results for your completed batches.",
    "evaluated.loadError": "An unexpected error occurred while fetching evaluated batches.",
    "evaluated.loading": "Loading evaluated batches...",
    "evaluated.emptyTitle": "No results",
    "evaluated.tableCaption":
      "List of evaluated and reported batches with final NTC 1443 classification and available actions",
    "evaluated.col.code": "CODE",
    "evaluated.col.capture": "CAPTURE",
    "evaluated.col.weight": "WEIGHT (KG)",
    "evaluated.col.sample": "SAMPLE",
    "evaluated.col.notes": "NOTES",
    "evaluated.col.eval": "EVAL.",
    "evaluated.col.status": "STATUS",
    "evaluated.col.classification": "CLASSIFICATION",
    "evaluated.col.actions": "ACTIONS",
    "evaluated.action.generateReport": "Generate report",
    "evaluated.action.generateReportAria": "Generate report for batch {code}",
    "evaluated.action.expandSample": "Expand sample",
    "evaluated.action.expandSampleAria": "Expand sample for batch {code}",

    "manage.title": "Batch management",
    "manage.subtitle": "List all your active batches and clean up any created by mistake or no longer needed.",
    "manage.loadError": "Could not load the list of active batches.",
    "manage.deleteSuccess": "Batch {code} deleted successfully.",
    "manage.deleteError": "Could not delete the selected batch.",
    "manage.loading": "Loading active batches...",
    "manage.emptyTitle": "No registered batches",
    "manage.emptySubtitle": "You have no active batches at this time.",
    "manage.tableCaption": "Active user batches with deletion option",
    "manage.col.code": "CODE",
    "manage.col.captureDate": "CAPTURE DATE",
    "manage.col.weight": "WEIGHT (KG)",
    "manage.col.units": "UNITS",
    "manage.col.status": "STATUS",
    "manage.col.classification": "CLASSIFICATION",
    "manage.col.action": "ACTION",
    "manage.delete": "Delete",
    "manage.deleteAria": "Delete batch {code}",
    "manage.confirmTitle": "Confirm deleting batch {code}?",
    "manage.confirmBody":
      "The selected batch and its associated reports will be deactivated while keeping evaluation history. You can only delete your own batches.",
    "manage.cancel": "Cancel",
    "manage.deleting": "Deleting...",
    "manage.confirmDelete": "Confirm deletion",
    "batchManagement.successDelete": "Batch {code} deleted successfully.",

    "report.titleSaved": "Saved report · Version v{version}",
    "report.titleBatch": "Batch report",
    "report.subtitle": "Consolidated batch information, individual results, and NTC 1443 statistics.",
    "report.generateError": "Could not generate the batch report.",
    "report.consultError": "Could not retrieve the saved report.",
    "report.saveError": "Could not save the batch report.",
    "report.exportError": "Could not export the report to PDF.",
    "report.invalidTarget": "No valid batch or report was specified to display.",
    "report.savedBannerTitle": "Report saved (version {version})",
    "report.savedBannerStoredAt": "Stored on ",
    "report.savedBannerSuffix": " for batch {code}. Batch status: Reported.",
    "report.viewSavedReports": "View saved reports",
    "report.loading": "Loading batch report...",
    "report.summaryHeading": "Evaluated batch summary",
    "report.field.batchCode": "BATCH CODE",
    "report.field.captureDate": "CAPTURE DATE",
    "report.field.weightSample": "WEIGHT / SAMPLE",
    "report.field.eyeSkinAvg": "EYE / SKIN AVERAGE",
    "report.field.finalClassification": "FINAL CLASSIFICATION",
    "report.notesLine": "Recorded notes: {notes}.",
    "report.noNotes": "No notes",
    "report.ntcTitle": "NTC 1443 Distribution",
    "report.ntcSubtitle": "Unit distribution across NTC categories 1 to 5",
    "report.chartAlt": "Unit distribution chart by NTC category",
    "report.ntcCountAria": "Unit count by NTC category",
    "report.catShort": "Cat. {cat}",
    "report.evaluationsCountFooter": "Total counted evaluations: {count} of {total}.",
    "report.unitsTitle": "Individual batch evaluations",
    "report.consolidatedTitle": "Consolidated statistics",
    "report.unitsTableCaption": "Individual NTC 1443 organoleptic classification results per unit",
    "report.col.unit": "UNIT",
    "report.col.dateTime": "DATE & TIME",
    "report.col.eye": "EYE (CAT. / CONF.)",
    "report.col.skin": "SKIN (CAT. / CONF.)",
    "report.frozenTitle": "Saved results for this version",
    "report.frozenBody":
      "This report preserves the saved results for that version: sample of {count}, EYE ({eye}) and SKIN ({skin}) averages, and NTC 1443 distribution (v{version}).",
    "report.alreadyReportedHint":
      "This batch is already reported and has a current version in your saved reports.",
    "report.saveHint":
      "Save report is enabled when the batch is evaluated and stores a new version in \"Saved reports\".",
    "report.backToSaved": "Back to saved reports",
    "report.backToEvaluated": "Back to evaluated batches",
    "report.saving": "Saving...",
    "report.save": "Save report",
    "report.exportingPdf": "Exporting PDF...",
    "report.exportPdf": "Export PDF",
    "report.unavailable": "No report information is available to display.",

    "savedReports.title": "Saved reports",
    "savedReports.subtitle": "Check stored report versions for your batches at any time.",
    "savedReports.listHeading": "My stored reports",
    "savedReports.loadError": "Could not retrieve saved reports.",
    "savedReports.openError": "Could not open report details.",
    "savedReports.exportError": "Could not export the report to PDF.",
    "savedReports.deleteSuccessItem": "Report v{version} for batch {code} deleted successfully.",
    "savedReports.deleteSuccess": "Report deleted successfully.",
    "savedReports.successDelete": "Report deleted successfully.",
    "savedReports.deleteError": "Could not delete the selected report.",
    "savedReports.loadingList": "Loading saved reports...",
    "savedReports.emptyTitle": "You don't have any saved reports yet",
    "savedReports.retry": "Retry",
    "savedReports.tableCaption": "Saved report versions by batch, status, and available actions",
    "savedReports.col.batch": "BATCH",
    "savedReports.col.version": "VER.",
    "savedReports.col.validity": "STATUS",
    "savedReports.col.final": "FINAL",
    "savedReports.col.date": "DATE",
    "savedReports.col.actions": "ACTIONS",
    "savedReports.current": "Current",
    "savedReports.previous": "Previous",
    "savedReports.view": "View report",
    "savedReports.viewAria": "View report version {version} of batch {code}",
    "savedReports.exportPdf": "Export PDF",
    "savedReports.exporting": "Exporting...",
    "savedReports.exportAria": "Export report version {version} of batch {code} to PDF",
    "savedReports.delete": "Delete",
    "savedReports.deleteAria": "Delete report version {version} of batch {code}",
    "savedReports.detailTitleWithBatch": "Detail · {code} (v{version})",
    "savedReports.detailTitle": "Report detail",
    "savedReports.loadingDetail": "Loading report version...",
    "savedReports.field.captureWeight": "CAPTURE / WEIGHT",
    "savedReports.field.evaluationsVersion": "EVALUATIONS (v{version})",
    "savedReports.field.eyeSkin": "EYE / SKIN",
    "savedReports.field.classification": "CLASSIFICATION",
    "savedReports.frozenDistAria": "Saved results distribution by NTC 1443 category",
    "savedReports.openFull": "Open in full view",
    "savedReports.deleteReport": "Delete report",
    "savedReports.selectPrompt":
      "Select \"View report\" on a row to view the saved results for that version.",
    "savedReports.confirmTitle": "Confirm deleting report v{version} of {code}?",
    "savedReports.confirmBody":
      "The batch and its individual evaluations are preserved. If you delete the current version, the batch will return to evaluated status.",
    "savedReports.cancel": "Cancel",
    "savedReports.deleting": "Deleting...",
    "savedReports.confirmDelete": "Confirm deletion",

    "profile.title": "My account",
    "profile.subtitle": "Review your registered details or request account deletion.",
    "profile.holderTitle": "Account holder details",
    "profile.field.fullName": "FULL NAME",
    "profile.field.email": "EMAIL ADDRESS",
    "profile.noEmail": "No email available",
    "profile.field.role": "ASSIGNED ROLE",
    "profile.deleteTitle": "Delete user account",
    "profile.deleteDesc":
      "Upon confirmation, your account will be deactivated along with your batches and reports, and your session will be closed immediately.",
    "profile.deleteUnexpectedError": "An unexpected error occurred while trying to delete your account.",
    "profile.passwordLabel": "Enter your current password to confirm",
    "profile.passwordPlaceholder": "Password of 8 to 20 characters",
    "profile.passwordHint":
      "If the entered password does not match, the operation will be rejected and your session will remain active.",
    "profile.confirmCheck": "I confirm that I want to permanently delete my account.",
    "profile.irreversibleWarning":
      "Irreversible action: once your account is deleted, you will no longer be able to sign in.",
    "profile.cancel": "Cancel",
    "profile.submittingDelete": "Deleting account...",
    "profile.submitDelete": "Delete account",

    "admin.loadError": "Could not load system monitoring information.",
    "admin.status403": "Status 403",
    "admin.accessDenied": "Access denied",
    "admin.accessDeniedBodyPrefix":
      "You do not have the required permissions to access the SECCT administration panel. This module is restricted exclusively to users with role ",
    "admin.userLabel": "User:",
    "admin.unknownUser": "Unknown",
    "admin.detectedRoleLabel": "Detected role:",
    "admin.noRole": "No role assigned",
    "admin.backToBatches": "Back to batch management",
    "admin.title": "System monitoring",
    "admin.subtitle": "General overview of platform activity and global usage.",
    "admin.badgeAria": "Authenticated administrator user",
    "admin.badgePrefix": "Administrator · {name}",
    "admin.metricsHeading": "Global system indicators",
    "admin.metricUsersTitle": "REGISTERED USERS",
    "admin.metricUsersDesc": "Active accounts registered on the platform.",
    "admin.metricBatchesTitle": "CREATED BATCHES",
    "admin.metricBatchesDesc": "Active batches registered by fish farmers.",
    "admin.metricEvaluationsTitle": "COMPLETED EVALUATIONS",
    "admin.metricEvaluationsDesc": "Tilapia units evaluated in active batches.",
    "admin.detailTitle": "Global metrics detail",
    "admin.loadingMetrics": "Loading system indicators...",
    "admin.tableCaption": "Detailed count of active users, batches, and evaluations in SECCT",
    "admin.col.indicator": "SYSTEM INDICATOR",
    "admin.col.total": "CURRENT TOTAL",
    "admin.col.status": "STATUS",
    "admin.row.usersName": "Active users",
    "admin.row.usersDesc": "Fish farmers and administrators with active account",
    "admin.row.batchesName": "Active batches",
    "admin.row.batchesDesc": "Registered batches available for evaluation, evaluated, or reported",
    "admin.row.evalsName": "Active evaluations",
    "admin.row.evalsDesc": "Evaluated units within active batches",
    "admin.statusOperational": "Operational",
    "admin.footerNote": "Updated general summary of active records on the platform.",
    "admin.registerNewUser": "Register new user",
    "admin.refreshing": "Refreshing...",
    "admin.refresh": "Refresh indicators",
  },
};

export function isValidLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}

export function applyDocumentLang(locale: Locale): void {
  if (typeof document === "undefined" || !document.documentElement) {
    return;
  }
  document.documentElement.lang = locale;
}

export function loadLocale(): Locale {
  let resolved: Locale = DEFAULT_LOCALE;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isValidLocale(stored)) {
        resolved = stored;
      }
    }
  } catch {
    resolved = DEFAULT_LOCALE;
  }
  applyDocumentLang(resolved);
  return resolved;
}

export function saveLocale(locale: Locale): Locale {
  const validLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, validLocale);
    }
  } catch {
    // Ignorar fallos de almacenamiento web en entornos restringidos.
  }
  try {
    void Preferences.set({ key: LOCALE_STORAGE_KEY, value: validLocale }).catch(() => {});
  } catch {
    // Ignorar fallos del plugin nativo fuera de entorno compatible.
  }
  applyDocumentLang(validLocale);
  return validLocale;
}

export async function syncLocaleFromNative(): Promise<Locale | null> {
  try {
    const { value } = await Preferences.get({ key: LOCALE_STORAGE_KEY });
    if (isValidLocale(value)) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
        }
      } catch {
        // Ignorar fallos de almacenamiento web.
      }
      applyDocumentLang(value);
      return value;
    }
  } catch {
    // Usar fallback localStorage cuando @capacitor/preferences no esté disponible.
  }
  return null;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dictionary = TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];
  let resolved = dictionary[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      resolved = resolved.split(`{${paramKey}}`).join(String(paramValue));
    }
  }
  return resolved;
}

export function formatBatchStatus(
  statusCode: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!statusCode) {
    return "";
  }
  const normalized = statusCode.trim().toUpperCase();
  const labels = BATCH_STATUS_LABELS[locale] ?? BATCH_STATUS_LABELS[DEFAULT_LOCALE];
  return labels[normalized] ?? statusCode;
}

export function formatRoleName(
  roleCode: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!roleCode) {
    return "";
  }
  const normalized = roleCode.trim().toUpperCase();
  const labels = ROLE_LABELS[locale] ?? ROLE_LABELS[DEFAULT_LOCALE];
  return labels[normalized] ?? roleCode;
}

export function formatUnitsCount(
  count: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (locale === "en") {
    return `${count} ${count === 1 ? "unit" : "units"}`;
  }
  return `${count} ${count === 1 ? "unidad" : "unidades"}`;
}

export function formatSampleUnitsSummary(
  sampleUnitCount: number,
  evaluationCount: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const unitsText = formatUnitsCount(sampleUnitCount, locale);
  if (locale === "en") {
    return `${unitsText} (${evaluationCount} evaluated)`;
  }
  const evaluatedLabel = evaluationCount === 1 ? "evaluada" : "evaluadas";
  return `${unitsText} (${evaluationCount} ${evaluatedLabel})`;
}

export function localizeErrorMessage(
  message: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
  fallbackKey?: string,
): string {
  if (!message || message.trim() === "") {
    return fallbackKey ? translate(locale, fallbackKey) : "";
  }
  if (locale === "es") {
    return message;
  }
  const trimmed = message.trim();
  const mapped = ERROR_TRANSLATIONS_EN[trimmed];
  if (mapped) {
    return mapped;
  }
  if (fallbackKey) {
    return translate(locale, fallbackKey);
  }
  return message;
}
