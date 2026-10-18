package co.unillanos.secct.adapters.web;

import java.util.List;

/** Cuerpo de error: un mensaje general y, si aplica, el detalle por campo. */
public record ErrorResponse(String mensaje, List<CampoError> errores) {

    public record CampoError(String campo, String mensaje) { }

    public static ErrorResponse de(String mensaje) {
        return new ErrorResponse(mensaje, List.of());
    }
}
