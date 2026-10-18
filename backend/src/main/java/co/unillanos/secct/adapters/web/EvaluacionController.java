package co.unillanos.secct.adapters.web;

import co.unillanos.secct.infrastructure.repositories.EvaluacionJdbc;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluaciones")
public class EvaluacionController {

    private final EvaluacionJdbc evaluacionJdbc;
    private final ValidadorImagen validadorImagen;

    public EvaluacionController(EvaluacionJdbc evaluacionJdbc, ValidadorImagen validadorImagen) {
        this.evaluacionJdbc = evaluacionJdbc;
        this.validadorImagen = validadorImagen;
    }

    @GetMapping("/lotes-disponibles")
    public ResponseEntity<List<Map<String, Object>>> listarDisponibles(
            @RequestHeader("X-Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(evaluacionJdbc.listarLotesDisponibles(usuarioId));
    }

    @GetMapping("/lotes/{codigo}")
    public ResponseEntity<Map<String, Object>> obtenerDetalle(
            @RequestHeader("X-Usuario-Id") Long usuarioId,
            @PathVariable String codigo) {
        Map<String, Object> lote = evaluacionJdbc.obtenerLoteDetalle(usuarioId, codigo);
        if (lote == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", "Lote no encontrado"));
        }
        return ResponseEntity.ok(lote);
    }

    @PostMapping("/lotes/{codigo}/evaluar")
    public ResponseEntity<?> evaluarUnidad(
            @RequestHeader("X-Usuario-Id") Long usuarioId,
            @PathVariable String codigo,
            @RequestParam("imagen") MultipartFile imagen) {

        validadorImagen.validar(imagen);

        try {
            Map<String, Object> resultado = evaluacionJdbc.evaluarUnidad(usuarioId, codigo, imagen);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/lotes/{codigo}/cerrar")
    public ResponseEntity<?> cerrarEvaluacion(
            @RequestHeader("X-Usuario-Id") Long usuarioId,
            @PathVariable String codigo) {

        try {
            Map<String, Object> resultado = evaluacionJdbc.cerrarEvaluacion(usuarioId, codigo);
            return ResponseEntity.ok(resultado);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }
}