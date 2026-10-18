package co.unillanos.secct.infrastructure.repositories;

import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.usecases.ports.LogLotePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deja constancia de las operaciones sobre lotes en dos lugares:
 * la tabla {@code log} (evento REGISTRO_LOTE) y el archivo logs/secct.log (SLF4J).
 */
public class LogLoteAdapter implements LogLotePort {

    private static final Logger LOG = LoggerFactory.getLogger(LogLoteAdapter.class);
    private static final int MAX_DESCRIPCION = 500;

    private static final String INSERTAR_LOG =
            "INSERT INTO log (tipo_evento_id, usuario_id, lote_id, descripcion) "
                    + "SELECT t.id, CAST(? AS INTEGER), l.id, CAST(? AS VARCHAR) FROM tipo_evento t, lote l "
                    + "WHERE t.codigo = 'REGISTRO_LOTE' AND l.codigo = ?";

    private final JdbcTemplate jdbc;

    public LogLoteAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Participa en la transacción del registro: si el log falla, el lote no se guarda. */
    @Override
    @Transactional
    public void loteRegistrado(Lote lote) {
        String descripcion = limitar("Lote " + lote.getId() + " registrado en estado "
                + lote.getEstado() + ". Estación: " + limpiar(lote.getEstacionOrigen())
                + ", fecha de captura: " + lote.getFechaCaptura()
                + ", peso: " + lote.getPesoLote().getValor().toPlainString() + " kg"
                + ", unidades de muestra: " + lote.getNumeroUnidadesMuestra() + ".");

        int filas = jdbc.update(INSERTAR_LOG,
                Integer.valueOf(lote.getPiscicultorId()), descripcion, lote.getId());
        if (filas == 0) {
            throw new IllegalStateException(
                    "No se pudo escribir el log: falta el tipo de evento REGISTRO_LOTE (migración V2).");
        }
        LOG.info("LOTE_REGISTRADO codigo={} piscicultor={} estacion='{}' fechaCaptura={} peso={}kg unidades={}",
                lote.getId(), lote.getPiscicultorId(), limpiar(lote.getEstacionOrigen()),
                lote.getFechaCaptura(), lote.getPesoLote().getValor().toPlainString(),
                lote.getNumeroUnidadesMuestra());
    }

    @Override
    public void registroLoteRechazado(String piscicultorId, String motivo) {
        LOG.warn("REGISTRO_LOTE_RECHAZADO piscicultor={} motivo='{}'",
                limpiar(piscicultorId), limpiar(motivo));
    }

    /** Evita que un texto del usuario inyecte saltos de línea falsos en el log. */
    private static String limpiar(String texto) {
        return texto == null ? "" : texto.replaceAll("[\\r\\n\\t]", " ");
    }

    private static String limitar(String texto) {
        return texto.length() <= MAX_DESCRIPCION ? texto : texto.substring(0, MAX_DESCRIPCION);
    }
}
