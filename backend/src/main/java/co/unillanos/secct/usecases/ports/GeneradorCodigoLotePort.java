package co.unillanos.secct.usecases.ports;

import co.unillanos.secct.entities.CodigoLote;

import java.time.LocalDate;

public interface GeneradorCodigoLotePort {

    CodigoLote generarCodigoLote();

    /**
     * Código para un lote capturado en la fecha indicada (SECCT-AAAAMMDD-NNN, con la
     * fecha de captura). Por defecto ignora la fecha; los generadores persistentes la usan.
     */
    default CodigoLote generarCodigoLote(LocalDate fechaCaptura) {
        return generarCodigoLote();
    }
}
