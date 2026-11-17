package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.ErrorResponseDTO;
import co.unillanos.secct.usecases.dto.ErrorResponseDTO.FieldErrorDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(MethodArgumentNotValidException exception) {
        List<FieldErrorDTO> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDTO(error.getField(), error.getDefaultMessage()))
                .toList();
        String message = "Datos inválidos en: "
                + String.join(", ", errors.stream().map(FieldErrorDTO::field).distinct().toList());
        logger.warn("Validation failed: {}", message);
        return ResponseEntity.badRequest().body(new ErrorResponseDTO(message, errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnreadable(HttpMessageNotReadableException exception) {
        logger.warn("Unreadable HTTP message: {}", exception.getMessage());
        return ResponseEntity.badRequest().body(ErrorResponseDTO.of(
                "El cuerpo de la solicitud no es válido. Verifica la fecha (AAAA-MM-DD) y los valores numéricos"));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleTooLarge(MaxUploadSizeExceededException exception) {
        logger.warn("Upload size exceeded: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(ErrorResponseDTO.of(
                "La imagen supera el tamaño máximo de 5 MB"));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponseDTO> handleBusiness(BusinessException exception) {
        logger.warn("BusinessException ({}): {}", exception.getHttpStatus(), exception.getMessage());
        return ResponseEntity.status(exception.getHttpStatus()).body(ErrorResponseDTO.of(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDTO> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        logger.warn("Type mismatch on parameter '{}': {}", exception.getName(), exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDTO.of("Parámetro inválido: " + exception.getName()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConflict(DataIntegrityViolationException exception,
                                                           jakarta.servlet.http.HttpServletRequest request) {
        String causeMsg = exception.getMostSpecificCause() != null
                ? exception.getMostSpecificCause().getMessage().toLowerCase(java.util.Locale.ROOT)
                : "";
        logger.warn("Data integrity violation on {}: {}", request != null ? request.getRequestURI() : "", causeMsg);

        if (causeMsg.contains("usuario_correo") || causeMsg.contains("correo") || causeMsg.contains("email")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of("correo ya registrado"));
        }
        if (causeMsg.contains("uq_evaluacion_imagen") || causeMsg.contains("id_imagen")
                || causeMsg.contains("referencia_imagen") || causeMsg.contains("uq_evaluacion_lote_imagen")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "Esta imagen ya fue evaluada anteriormente. Carga una imagen distinta."));
        }
        if (causeMsg.contains("uq_reporte_vigente") || causeMsg.contains("uq_reporte_lote_version")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "Ya existe un reporte vigente o duplicado para este lote."));
        }
        if (causeMsg.contains("lote_codigo") || causeMsg.contains("codigo")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "No se pudo generar un código único para el lote. Intenta de nuevo."));
        }

        String uri = request != null && request.getRequestURI() != null ? request.getRequestURI() : "";
        if (uri.contains("/users") || uri.contains("/registro")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "No se pudo completar el registro por un conflicto de datos. Intenta de nuevo"));
        }
        if (uri.contains("/evaluations")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "No se pudo completar la evaluación por un conflicto de datos. Intenta de nuevo"));
        }
        if (uri.contains("/reports")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "No se pudo completar el reporte por un conflicto de datos. Intenta de nuevo"));
        }
        if (uri.contains("/batches")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                    "No se pudo guardar el lote por un conflicto de datos. Intenta de nuevo"));
        }

        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponseDTO.of(
                "Conflicto de integridad de datos. La operación no pudo completarse."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleUnexpected(Exception exception) {
        logger.error("Unexpected error", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ErrorResponseDTO.of(
                "Ocurrió un error inesperado. Intenta de nuevo más tarde"));
    }
}
