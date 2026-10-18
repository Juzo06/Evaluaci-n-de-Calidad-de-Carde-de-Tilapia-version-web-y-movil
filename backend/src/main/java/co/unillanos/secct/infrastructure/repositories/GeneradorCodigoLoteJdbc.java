package co.unillanos.secct.infrastructure.repositories;

import co.unillanos.secct.entities.CodigoLote;
import co.unillanos.secct.usecases.ports.GeneradorCodigoLotePort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Genera códigos {@code SECCT-AAAAMMDD-NNN} únicos y persistentes.
 * AAAAMMDD es la FECHA DE CAPTURA del lote (la BD lo exige con ck_lote_codigo_fecha).
 * El secuencial se incrementa de forma atómica en {@code secuencia_codigo_lote}
 * (una fila por fecha, migración V4): no se repite aunque la aplicación se
 * reinicie o haya varias instancias.
 */
public class GeneradorCodigoLoteJdbc implements GeneradorCodigoLotePort {

    private static final String PREFIJO_DEFAULT = "SECCT";
    private static final int MAXIMO_SECUENCIAL = 999;
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("yyyyMMdd");

    // LEAST evita que el contador siga creciendo después de agotar el día
    private static final String SIGUIENTE_SECUENCIAL =
            "INSERT INTO secuencia_codigo_lote (fecha, ultimo) VALUES (?, 1) "
                    + "ON CONFLICT (fecha) DO UPDATE "
                    + "SET ultimo = LEAST(secuencia_codigo_lote.ultimo + 1, " + (MAXIMO_SECUENCIAL + 1) + ") "
                    + "RETURNING ultimo";

    private final JdbcTemplate jdbc;
    private final String prefijo;

    public GeneradorCodigoLoteJdbc(JdbcTemplate jdbc) {
        this(jdbc, PREFIJO_DEFAULT);
    }

    public GeneradorCodigoLoteJdbc(JdbcTemplate jdbc, String prefijo) {
        this.jdbc = jdbc;
        this.prefijo = prefijo;
    }

    @Override
    public CodigoLote generarCodigoLote() {
        return generarCodigoLote(LocalDate.now());
    }

    /**
     * noRollbackFor: el caso de uso captura el IllegalStateException y responde un
     * fallo controlado; no debe dejar la transacción marcada para rollback.
     */
    @Override
    @Transactional(noRollbackFor = IllegalStateException.class)
    public CodigoLote generarCodigoLote(LocalDate fechaCaptura) {
        Integer secuencial = jdbc.queryForObject(SIGUIENTE_SECUENCIAL, Integer.class, Date.valueOf(fechaCaptura));
        if (secuencial == null || secuencial > MAXIMO_SECUENCIAL) {
            throw new IllegalStateException(
                    "Se alcanzó el límite de " + MAXIMO_SECUENCIAL + " lotes para la fecha de captura "
                            + fechaCaptura + ".");
        }
        return new CodigoLote(prefijo + "-" + fechaCaptura.format(FORMATO_FECHA) + "-"
                + String.format("%03d", secuencial));
    }
}
