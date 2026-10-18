package co.unillanos.secct.adapters.web;

import co.unillanos.secct.entities.EstadoLote;
import co.unillanos.secct.entities.PuntoEvaluacion;
import co.unillanos.secct.usecases.dto.DatosNuevoLote;
import co.unillanos.secct.usecases.dto.OperationResult;
import co.unillanos.secct.usecases.services.SecctApp;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * Adaptador de entrada (HU03). Solo captura la entrada e invoca el caso de uso.
 *
 * El piscicultor se identifica TEMPORALMENTE con el encabezado {@code X-Usuario-Id}
 * (id de la tabla usuario) hasta que exista el login real.
 */
@RestController
@RequestMapping("/api/lotes")
public class LoteController {

    static final String ENCABEZADO_USUARIO = "X-Usuario-Id";

    /** HU03 no pide el punto de evaluación: el piscicultor registra en la estación piscícola. */
    static final String PUNTO_EVALUACION_REGISTRO = PuntoEvaluacion.ESTACION_PISCICOLA.name();

    private final SecctApp app;

    public LoteController(SecctApp app) {
        this.app = app;
    }

    /** Frontera transaccional: código, lote y log se guardan juntos o no se guarda nada. */
    @PostMapping
    @Transactional
    public ResponseEntity<?> registrar(@RequestHeader(ENCABEZADO_USUARIO) String usuarioId,
                                       @Valid @RequestBody RegistrarLoteRequest request) {
        OperationResult resultado = app.registrarLote(new DatosNuevoLote(
                usuarioId.trim(),
                request.estacionOrigen(),
                request.fechaCaptura(),
                request.peso(),
                request.numeroUnidadesMuestra(),
                PUNTO_EVALUACION_REGISTRO,
                request.observaciones()));

        if (!resultado.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.de(resultado.getMessage()));
        }
        String codigo = resultado.getReferencia();
        return ResponseEntity.created(URI.create("/api/lotes/" + codigo))
                .body(new LoteCreadoResponse(codigo, EstadoLote.ABIERTO.name(), resultado.getMessage()));
    }

    /** Solo los lotes del piscicultor identificado. */
    @GetMapping
    public List<LoteResponse> listar(@RequestHeader(ENCABEZADO_USUARIO) String usuarioId) {
        return app.listarLotesDePiscicultor(usuarioId.trim())
                .stream().map(LoteResponse::desde).toList();
    }
}
