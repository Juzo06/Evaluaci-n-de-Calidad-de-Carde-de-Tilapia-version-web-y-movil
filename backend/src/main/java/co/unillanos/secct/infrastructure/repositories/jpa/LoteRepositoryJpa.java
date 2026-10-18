package co.unillanos.secct.infrastructure.repositories.jpa;

import co.unillanos.secct.entities.CodigoLote;
import co.unillanos.secct.entities.EstadoLote;
import co.unillanos.secct.entities.FechaCaptura;
import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.entities.PesoLote;
import co.unillanos.secct.entities.PuntoEvaluacion;
import co.unillanos.secct.usecases.ports.LoteRepository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Adaptador de salida: implementa el puerto {@link LoteRepository} con JPA sobre
 * el esquema de Supabase/PostgreSQL (lote, estado_lote).
 * Traduce entre el dominio ({@link Lote}) y las entidades JPA.
 *
 * Las evaluaciones aún no se persisten (HU de evaluación).
 *
 * Notas del esquema: {@code lote.usuario_id} es INT (el dominio usa String) y
 * la tabla no tiene columna para el punto de evaluación, por lo que al
 * reconstruir un lote se asume ESTACION_PISCICOLA.
 */
@Transactional(readOnly = true)
public class LoteRepositoryJpa implements LoteRepository {

    private final LoteJpaRepository lotes;
    private final EstadoLoteJpaRepository estados;

    public LoteRepositoryJpa(LoteJpaRepository lotes,
                             EstadoLoteJpaRepository estados) {
        this.lotes = lotes;
        this.estados = estados;
    }

    @Override
    public Optional<Lote> findById(String id) {
        return lotes.findByCodigo(id).map(LoteRepositoryJpa::aDominio);
    }

    @Override
    public List<Lote> findByEstadoIn(EstadoLote... estadosBuscados) {
        if (estadosBuscados == null || estadosBuscados.length == 0) {
            return List.of();
        }
        List<String> codigos = Arrays.stream(estadosBuscados).map(Enum::name).toList();
        return lotes.findByEstadoLoteCodigoInOrderByIdAsc(codigos)
                .stream().map(LoteRepositoryJpa::aDominio).toList();
    }

    @Override
    @Transactional
    public void save(Lote lote) {
        LoteEntity entidad = lotes.findByCodigo(lote.getId()).orElseGet(LoteEntity::new);
        if (entidad.getId() == null) {
            entidad.setCodigo(lote.getId());
            entidad.setUsuarioId(aUsuarioId(lote.getPiscicultorId()));
            entidad.setFechaCaptura(lote.getFechaCaptura().getValor());
            entidad.setPeso(lote.getPesoLote().getValor());
            entidad.setNumeroUnidadesMuestra(lote.getNumeroUnidadesMuestra());
            entidad.setObservaciones(lote.getObservaciones());
        }
        entidad.setEstadoLote(estados.findByCodigo(lote.getEstado().name()).orElseThrow(() ->
                new IllegalStateException("Falta el estado '" + lote.getEstado()
                        + "' en la tabla estado_lote (migración V2).")));
        entidad.setClasificacionFinal(clasificacionParaGuardar(lote));

        lotes.save(entidad);
    }

    @Override
    public boolean existsByCodigo(CodigoLote codigo) {
        return lotes.existsByCodigo(codigo.getValor());
    }

    @Override
    public List<Lote> findByPiscicultorId(String piscicultorId) {
        Integer usuarioId = aUsuarioIdONull(piscicultorId);
        if (usuarioId == null) {
            return List.of();
        }
        return lotes.findByUsuarioIdOrderByIdDesc(usuarioId)
                .stream().map(LoteRepositoryJpa::aDominio).toList();
    }

    // ----- apoyo -----

    /**
     * La BD exige (ck_lote_estado_clasificacion) clasificación_final NO nula solo en
     * EVALUADO y REPORTADO. En EVALUADO el dominio aún no la calcula: se usa el promedio.
     */
    private static BigDecimal clasificacionParaGuardar(Lote lote) {
        if (lote.getEstado() != EstadoLote.EVALUADO && lote.getEstado() != EstadoLote.REPORTADO) {
            return null;
        }
        double valor = lote.getClasificacionFinal();
        if (valor < 1 && !lote.getEvaluaciones().isEmpty()) {
            valor = lote.getEvaluaciones().stream()
                    .mapToInt(e -> e.getClasificacion()).average().orElse(valor);
        }
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
    }

    private static Integer aUsuarioId(String piscicultorId) {
        Integer id = aUsuarioIdONull(piscicultorId);
        if (id == null) {
            throw new IllegalArgumentException("Identificador de piscicultor inválido: " + piscicultorId);
        }
        return id;
    }

    private static Integer aUsuarioIdONull(String piscicultorId) {
        try {
            return piscicultorId == null ? null : Integer.valueOf(piscicultorId.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Lote aDominio(LoteEntity e) {
        return Lote.reconstruir(
                new CodigoLote(e.getCodigo()),
                String.valueOf(e.getUsuarioId()),
                new FechaCaptura(e.getFechaCaptura()),
                new PesoLote(e.getPeso()),
                e.getNumeroUnidadesMuestra(),
                PuntoEvaluacion.ESTACION_PISCICOLA,
                e.getObservaciones(),
                EstadoLote.valueOf(e.getEstadoLote().getCodigo()),
                List.of(), // evaluaciones: pendiente de la HU de evaluación
                e.getClasificacionFinal() == null ? 0.0 : e.getClasificacionFinal().doubleValue());
    }
}
