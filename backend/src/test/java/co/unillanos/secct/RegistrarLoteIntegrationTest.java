package co.unillanos.secct;

import co.unillanos.secct.entities.EstadoLote;
import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.usecases.dto.DatosNuevoLote;
import co.unillanos.secct.usecases.dto.OperationResult;
import co.unillanos.secct.usecases.services.SecctApp;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * HU03 de punta a punta contra PostgreSQL real (Testcontainers + Flyway V1..V4).
 * Requiere Docker. Usa los piscicultores demo de V3 (ids 1 y 2 en una base nueva).
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class RegistrarLoteIntegrationTest {

    @Autowired
    private SecctApp app;

    private static DatosNuevoLote datos(String piscicultor) {
        return new DatosNuevoLote(piscicultor,
                LocalDate.of(2025, 5, 24), new BigDecimal("120.50"), 15,
                "ESTACION_PISCICOLA", "Agua a 18 grados");
    }

    @Test
    void shouldPersistLoteAbiertoWithUniqueCodesAndOwnerIsolation() {
        String piscicultorA = "1";
        String piscicultorB = "2";
        int yaDeA = app.listarLotesDePiscicultor(piscicultorA).size();

        OperationResult primero = app.registrarLote(datos(piscicultorA));
        OperationResult segundo = app.registrarLote(datos(piscicultorA));
        OperationResult deB = app.registrarLote(datos(piscicultorB));

        assertTrue(primero.isSuccess() && segundo.isSuccess() && deB.isSuccess());
        assertNotEquals(primero.getReferencia(), segundo.getReferencia());
        assertNotEquals(primero.getReferencia(), deB.getReferencia());

        List<Lote> deA = app.listarLotesDePiscicultor(piscicultorA);
        assertEquals(yaDeA + 2, deA.size());
        deA.forEach(l -> {
            assertEquals(EstadoLote.ABIERTO, l.getEstado());
            assertEquals(piscicultorA, l.getPiscicultorId());
        });
        assertEquals(new BigDecimal("120.50"), deA.get(0).getPesoLote().getValor());

        // el piscicultor B no ve los lotes del A
        assertFalse(app.listarLotesDePiscicultor(piscicultorB).stream()
                .anyMatch(l -> l.getId().equals(primero.getReferencia())));
    }

    @Test
    void shouldBuildCodeWithCaptureDate() {
        // la BD exige que el código lleve la fecha de captura (ck_lote_codigo_fecha)
        OperationResult r = app.registrarLote(new DatosNuevoLote("1",
                LocalDate.of(2025, 3, 7), new BigDecimal("10.00"), 5, "ESTACION_PISCICOLA", ""));

        assertTrue(r.isSuccess());
        assertTrue(r.getReferencia().startsWith("SECCT-20250307-"));
    }

    @Test
    void shouldNotPersistWhenDataIsInvalid() {
        String piscicultor = "2";
        int antes = app.listarLotesDePiscicultor(piscicultor).size();

        OperationResult r = app.registrarLote(new DatosNuevoLote(piscicultor,
                LocalDate.of(2025, 5, 24), new BigDecimal("10.00"), 501, "ESTACION_PISCICOLA", ""));

        assertFalse(r.isSuccess());
        assertEquals(antes, app.listarLotesDePiscicultor(piscicultor).size());
    }
}
