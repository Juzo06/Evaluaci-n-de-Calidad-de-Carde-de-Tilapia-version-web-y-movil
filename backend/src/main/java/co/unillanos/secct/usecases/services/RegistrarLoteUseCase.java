package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.CodigoLote;
import co.unillanos.secct.entities.FechaCaptura;
import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.entities.PesoLote;
import co.unillanos.secct.entities.PuntoEvaluacion;
import co.unillanos.secct.usecases.dto.DatosNuevoLote;
import co.unillanos.secct.usecases.dto.OperationResult;
import co.unillanos.secct.usecases.ports.GeneradorCodigoLotePort;
import co.unillanos.secct.usecases.ports.LogLotePort;
import co.unillanos.secct.usecases.ports.LoteRepository;

/**
 * CU-001 / HU03 — Registrar lote.
 * Valida los datos, genera el código único, guarda el lote en estado ABIERTO
 * asociado al piscicultor y deja constancia en el log.
 */
public class RegistrarLoteUseCase {

    private final LoteRepository loteRepository;
    private final GeneradorCodigoLotePort generadorCodigoLote;
    private final LogLotePort log;

    /** Sin log (compatibilidad con código y tests anteriores a HU03). */
    public RegistrarLoteUseCase(LoteRepository loteRepository,
                                GeneradorCodigoLotePort generadorCodigoLote) {
        this(loteRepository, generadorCodigoLote, new LogLotePort() {
            @Override public void loteRegistrado(Lote lote) { }
            @Override public void registroLoteRechazado(String piscicultorId, String motivo) { }
        });
    }

    public RegistrarLoteUseCase(LoteRepository loteRepository,
                                GeneradorCodigoLotePort generadorCodigoLote,
                                LogLotePort log) {
        this.loteRepository = loteRepository;
        this.generadorCodigoLote = generadorCodigoLote;
        this.log = log;
    }

    public OperationResult execute(DatosNuevoLote datos) {
        // Primero se validan los datos: si algo es inválido no se consume un código.
        FechaCaptura fechaCaptura;
        try {
            fechaCaptura = new FechaCaptura(datos.getFechaCaptura());
        } catch (IllegalArgumentException e) {
            return rechazar(datos, e.getMessage());
        }

        PesoLote pesoLote;
        try {
            pesoLote = new PesoLote(datos.getPesoTotal());
        } catch (IllegalArgumentException e) {
            return rechazar(datos, e.getMessage());
        }

        PuntoEvaluacion puntoEvaluacion;
        try {
            puntoEvaluacion = PuntoEvaluacion.valueOf(datos.getPuntoEvaluacion());
        } catch (IllegalArgumentException | NullPointerException e) {
            return rechazar(datos, "Punto de evaluación inválido: '" + datos.getPuntoEvaluacion()
                    + "' (RN-006). Valores permitidos: "
                    + java.util.Arrays.toString(PuntoEvaluacion.values()));
        }

        CodigoLote codigo;
        try {
            codigo = generadorCodigoLote.generarCodigoLote();
        } catch (IllegalStateException e) {
            return rechazar(datos, e.getMessage());
        }

        Lote lote;
        try {
            lote = Lote.nuevo(codigo, datos.getPiscicultorId(), datos.getEstacionOrigen(),
                    fechaCaptura, pesoLote, datos.getNumeroUnidadesMuestra(),
                    puntoEvaluacion, datos.getObservaciones());
        } catch (IllegalArgumentException e) {
            return rechazar(datos, e.getMessage());
        }

        if (loteRepository.existsByCodigo(codigo)) {
            return rechazar(datos, "Ya existe un lote con el código " + codigo.getValor() + " (RN-001).");
        }

        loteRepository.save(lote);
        log.loteRegistrado(lote);

        return OperationResult.ok(
                "Lote '" + codigo.getValor() + "' registrado exitosamente. "
                        + "Estado: ABIERTO. "
                        + "Listo para evaluación de unidades de muestra.",
                codigo.getValor());
    }

    private OperationResult rechazar(DatosNuevoLote datos, String motivo) {
        log.registroLoteRechazado(datos.getPiscicultorId(), motivo);
        return OperationResult.fail(motivo);
    }
}
