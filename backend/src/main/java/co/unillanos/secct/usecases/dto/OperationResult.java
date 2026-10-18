package co.unillanos.secct.usecases.dto;


public final class OperationResult {

    private final boolean success;
    private final String message;
    private final String referencia;

    private OperationResult(boolean success, String message, String referencia) {
        this.success = success;
        this.message = message != null ? message : "";
        this.referencia = referencia;
    }

    
    public static OperationResult ok(String message) {
        return new OperationResult(true, message, null);
    }

    
    /** Éxito que además informa una referencia (p. ej. el código del lote creado). */
    public static OperationResult ok(String message, String referencia) {
        return new OperationResult(true, message, referencia);
    }

    public static OperationResult fail(String message) {
        return new OperationResult(false, message, null);
    }

    
    public boolean isSuccess() {
        return success;
    }

    
    public String getMessage() {
        return message;
    }

    /** Referencia opcional asociada al resultado; {@code null} si no aplica. */
    public String getReferencia() {
        return referencia;
    }
}
