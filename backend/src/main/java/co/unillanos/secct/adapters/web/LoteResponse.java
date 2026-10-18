package co.unillanos.secct.adapters.web;

import co.unillanos.secct.entities.Lote;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Representación JSON de un lote en el listado. */
public record LoteResponse(
        String codigo,
        String estacionOrigen,
        LocalDate fechaCaptura,
        BigDecimal peso,
        int numeroUnidadesMuestra,
        String observaciones,
        String estado) {

    public static LoteResponse desde(Lote lote) {
        return new LoteResponse(
                lote.getId(),
                lote.getEstacionOrigen(),
                lote.getFechaCaptura().getValor(),
                lote.getPesoLote().getValor(),
                lote.getNumeroUnidadesMuestra(),
                lote.getObservaciones(),
                lote.getEstado().name());
    }
}
