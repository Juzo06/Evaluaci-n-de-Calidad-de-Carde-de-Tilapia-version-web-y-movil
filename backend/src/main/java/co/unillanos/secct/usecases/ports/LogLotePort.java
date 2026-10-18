package co.unillanos.secct.usecases.ports;

import co.unillanos.secct.entities.Lote;

/**
 * Puerto de salida para dejar constancia (log) de las operaciones sobre lotes.
 * El caso de uso no conoce la tecnología de logging concreta.
 */
public interface LogLotePort {

    void loteRegistrado(Lote lote);

    void registroLoteRechazado(String piscicultorId, String motivo);
}
