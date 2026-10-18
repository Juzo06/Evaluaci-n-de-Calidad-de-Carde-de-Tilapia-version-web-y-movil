package co.unillanos.secct.infrastructure.repositories;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Repository
public class EvaluacionJdbc {

    private final JdbcTemplate jdbcTemplate;

    public EvaluacionJdbc(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> listarLotesDisponibles(Long usuarioId) {
        String sql = """
            SELECT l.id, l.codigo, l.fecha_captura, l.peso, l.numero_unidades_muestra, el.codigo AS estado
            FROM lote l
            JOIN estado_lote el ON l.estado_lote_id = el.id
            WHERE l.usuario_id = ? 
              AND l.estado_lote_id IN (1, 2)
              AND l.is_deleted = false
            ORDER BY l.created_at DESC
        """;
        return jdbcTemplate.queryForList(sql, usuarioId);
    }

    public Map<String, Object> obtenerLoteDetalle(Long usuarioId, String codigo) {
        String sqlLote = """
            SELECT l.id, l.codigo, l.fecha_captura, l.peso, l.numero_unidades_muestra, 
                   l.clasificacion_final, el.codigo AS estado
            FROM lote l
            JOIN estado_lote el ON l.estado_lote_id = el.id
            WHERE l.usuario_id = ? AND l.codigo = ? AND l.is_deleted = false
        """;

        List<Map<String, Object>> lotes = jdbcTemplate.queryForList(sqlLote, usuarioId, codigo);
        if (lotes.isEmpty()) return null;

        Map<String, Object> lote = new HashMap<>(lotes.get(0));
        Long loteId = ((Number) lote.get("id")).longValue();

        String sqlEvaluaciones = """
            SELECT e.id, e.id_imagen, e.fecha_evaluacion,
                   MAX(pe.categoria_ntc) AS categoria_unidad
            FROM evaluacion e
            JOIN punto_evaluacion pe ON pe.evaluacion_id = e.id
            WHERE e.lote_id = ?
            GROUP BY e.id, e.id_imagen, e.fecha_evaluacion
            ORDER BY e.fecha_evaluacion ASC
        """;

        List<Map<String, Object>> evaluaciones = jdbcTemplate.queryForList(sqlEvaluaciones, loteId);
        lote.put("evaluaciones", evaluaciones);
        lote.put("unidadesEvaluadas", evaluaciones.size());

        return lote;
    }

    @Transactional
    public Map<String, Object> evaluarUnidad(Long usuarioId, String codigo, MultipartFile imagen) {
        Map<String, Object> lote = obtenerLoteDetalle(usuarioId, codigo);
        if (lote == null) {
            throw new IllegalStateException("Lote no encontrado");
        }

        int estadoId = ((Number) jdbcTemplate.queryForObject(
            "SELECT estado_lote_id FROM lote WHERE codigo = ?", Integer.class, codigo)).intValue();

        if (estadoId != 1 && estadoId != 2) {
            throw new IllegalArgumentException("El lote ya se encuentra evaluado o cerrado.");
        }

        int totalMuestra = ((Number) lote.get("numero_unidades_muestra")).intValue();
        int evaluadas = ((Number) lote.get("unidadesEvaluadas")).intValue();

        if (evaluadas >= totalMuestra) {
            throw new IllegalArgumentException("El lote ya completó todas sus unidades de muestra (" + totalMuestra + ").");
        }

        Long loteId = ((Number) lote.get("id")).longValue();

        // Evita duplicados en uq_evaluacion_imagen
        String idImagenUnico = UUID.randomUUID().toString() + "_" + imagen.getOriginalFilename();

        String sqlInsEval = "INSERT INTO evaluacion (lote_id, id_imagen) VALUES (?, ?) RETURNING id";
        Long evaluacionId = jdbcTemplate.queryForObject(sqlInsEval, Long.class, loteId, idImagenUnico);

        int catOjo = (int) (Math.random() * 3) + 1;
        int catPiel = (int) (Math.random() * 3) + 1;

        jdbcTemplate.update("INSERT INTO punto_evaluacion (evaluacion_id, parte_pez_id, categoria_ntc, confianza) VALUES (?, 1, ?, 0.9500)", evaluacionId, catOjo);
        jdbcTemplate.update("INSERT INTO punto_evaluacion (evaluacion_id, parte_pez_id, categoria_ntc, confianza) VALUES (?, 2, ?, 0.9200)", evaluacionId, catPiel);

        if (estadoId == 1) {
            jdbcTemplate.update("UPDATE lote SET estado_lote_id = 2, updated_at = NOW() WHERE id = ?", loteId);
        }

        jdbcTemplate.update("INSERT INTO log (tipo_evento_id, usuario_id, lote_id, evaluacion_id, descripcion) VALUES (1, ?, ?, ?, ?)",
                usuarioId, loteId, evaluacionId, "Evaluación de unidad realizada");

        int categoriaUnidad = Math.max(catOjo, catPiel);

        return Map.of(
            "evaluacionId", evaluacionId,
            "idImagen", idImagenUnico,
            "categoriaUnidad", categoriaUnidad,
            "categoriaOjo", catOjo,
            "categoriaPiel", catPiel,
            "unidadesEvaluadas", evaluadas + 1,
            "totalUnidades", totalMuestra
        );
    }

    @Transactional
    public Map<String, Object> cerrarEvaluacion(Long usuarioId, String codigo) {
        Map<String, Object> lote = obtenerLoteDetalle(usuarioId, codigo);
        if (lote == null) {
            throw new IllegalStateException("Lote no encontrado");
        }

        Long loteId = ((Number) lote.get("id")).longValue();
        int totalMuestra = ((Number) lote.get("numero_unidades_muestra")).intValue();
        int evaluadas = ((Number) lote.get("unidadesEvaluadas")).intValue();

        if (evaluadas < totalMuestra) {
            throw new IllegalStateException("No se puede cerrar la evaluación. Faltan " + (totalMuestra - evaluadas) + " unidades por evaluar.");
        }

        String sqlPromedio = """
            SELECT AVG(max_cat) FROM (
                SELECT MAX(pe.categoria_ntc) AS max_cat
                FROM evaluacion e
                JOIN punto_evaluacion pe ON pe.evaluacion_id = e.id
                WHERE e.lote_id = ?
                GROUP BY e.id
            ) sub
        """;

        Double promedio = jdbcTemplate.queryForObject(sqlPromedio, Double.class, loteId);
        if (promedio == null) promedio = 1.0;

        // Cumple la restricción ck_lote_estado_clasificacion
        jdbcTemplate.update(
            "UPDATE lote SET estado_lote_id = 3, clasificacion_final = ?, updated_at = NOW() WHERE id = ?",
            promedio, loteId
        );

        jdbcTemplate.update(
            "INSERT INTO log (tipo_evento_id, usuario_id, lote_id, descripcion) VALUES (1, ?, ?, ?)",
            usuarioId, loteId, "Cierre de evaluación completado con clasificación " + String.format("%.2f", promedio)
        );

        return Map.of(
            "codigo", codigo,
            "estado", "EVALUADO",
            "clasificacionFinal", promedio,
            "mensaje", "Evaluación finalizada con éxito."
        );
    }
}