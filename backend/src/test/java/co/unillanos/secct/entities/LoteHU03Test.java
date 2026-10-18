package co.unillanos.secct.entities;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Reglas de HU03 sobre la entidad Lote: rangos, piscicultor propietario y estado inicial. */
class LoteHU03Test {

    private static final CodigoLote CODIGO = new CodigoLote("SECCT-20250524-001");

    private static Lote nuevo(String piscicultor, String estacion, int unidades, String obs) {
        return Lote.nuevo(CODIGO, piscicultor, estacion,
                new FechaCaptura(LocalDate.of(2025, 5, 24)),
                new PesoLote(new BigDecimal("120.50")),
                unidades, PuntoEvaluacion.ESTACION_PISCICOLA, obs);
    }

    @Test
    void shouldBeAbiertoAndAssociatedToPiscicultorWhenCreated() {
        Lote lote = nuevo("piscicultor1", "Estacion Meta", 15, "");

        assertEquals(EstadoLote.ABIERTO, lote.getEstado());
        assertEquals("piscicultor1", lote.getPiscicultorId());
    }

    @Test
    void shouldRejectMissingPiscicultor() {
        assertThrows(IllegalArgumentException.class, () -> nuevo(null, "Estacion Meta", 15, ""));
        assertThrows(IllegalArgumentException.class, () -> nuevo("   ", "Estacion Meta", 15, ""));
    }

    @Test
    void shouldAcceptEstacionWithExactlyThreeCharacters() {
        assertEquals("ABC", nuevo("p1", "ABC", 1, "").getEstacionOrigen());
    }

    @Test
    void shouldRejectEstacionShorterThanThreeCharacters() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> nuevo("p1", "AB", 1, ""));
        assertTrue(ex.getMessage().contains("RN-002"));
    }

    @Test
    void shouldCountEstacionLengthWithoutSurroundingSpaces() {
        assertThrows(IllegalArgumentException.class, () -> nuevo("p1", "  AB  ", 1, ""));
        assertEquals("Estacion Meta", nuevo("p1", "  Estacion Meta  ", 1, "").getEstacionOrigen());
    }

    @Test
    void shouldAcceptEstacionWithExactlyOneHundredCharacters() {
        assertEquals(100, nuevo("p1", "E".repeat(100), 1, "").getEstacionOrigen().length());
    }

    @Test
    void shouldAcceptUnidadesBetweenOneAndFiveHundred() {
        assertEquals(1, nuevo("p1", "Estacion Meta", 1, "").getNumeroUnidadesMuestra());
        assertEquals(500, nuevo("p1", "Estacion Meta", 500, "").getNumeroUnidadesMuestra());
    }

    @Test
    void shouldRejectUnidadesAboveFiveHundred() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> nuevo("p1", "Estacion Meta", 501, ""));
        assertTrue(ex.getMessage().contains("RN-005"));
    }

    @Test
    void shouldRejectUnidadesBelowOne() {
        assertThrows(IllegalArgumentException.class, () -> nuevo("p1", "Estacion Meta", 0, ""));
    }

    @Test
    void shouldAcceptObservacionesWithExactlyFiveHundredCharacters() {
        assertEquals(500, nuevo("p1", "Estacion Meta", 1, "x".repeat(500)).getObservaciones().length());
    }

    @Test
    void shouldTreatNullObservacionesAsEmpty() {
        assertEquals("", nuevo("p1", "Estacion Meta", 1, null).getObservaciones());
    }

    @Test
    void shouldRebuildPersistedLoteKeepingStateAndEvaluaciones() {
        Lote lote = Lote.reconstruir(CODIGO, "p1", "Estacion Meta",
                new FechaCaptura(LocalDate.of(2025, 5, 24)),
                new PesoLote(new BigDecimal("10.00")), 2,
                PuntoEvaluacion.ESTACION_PISCICOLA, "obs", EstadoLote.EN_EVALUACION,
                List.of(new Lote.EvaluacionGuardada("img-1.jpg", 3)), 0.0);

        assertEquals(EstadoLote.EN_EVALUACION, lote.getEstado());
        assertEquals(1, lote.cantidadEvaluaciones());
        assertEquals("p1", lote.getPiscicultorId());
        assertTrue(lote.estaDisponible());
    }
}
