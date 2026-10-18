package co.unillanos.secct.adapters.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Comparator;
import java.util.List;

/** Traduce los errores de entrada a respuestas 400 que indican el campo. */
@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> datosInvalidos(MethodArgumentNotValidException ex) {
        List<ErrorResponse.CampoError> errores = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ErrorResponse.CampoError(e.getField(), e.getDefaultMessage()))
                .sorted(Comparator.comparing(ErrorResponse.CampoError::campo)
                        .thenComparing(ErrorResponse.CampoError::mensaje))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new ErrorResponse("No se guardó el lote: hay campos faltantes o fuera de rango.", errores));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> cuerpoIlegible(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse.de(
                "El cuerpo de la solicitud es inválido. Revise que sea JSON, que la fecha "
                        + "tenga formato yyyy-MM-dd y que peso y unidades sean numéricos."));
    }
}
