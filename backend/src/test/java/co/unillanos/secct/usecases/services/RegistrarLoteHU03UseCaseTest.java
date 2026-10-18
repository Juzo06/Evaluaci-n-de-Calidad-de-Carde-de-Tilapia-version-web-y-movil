package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.CodigoLote;
import co.unillanos.secct.entities.EstadoLote;
import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.infrastructure.repositories.GeneradorCodigoLoteSecuencial;
import co.unillanos.secct.infrastructure.repositories.InMemoryLoteRepository;
import co.unillanos.secct.usecases.dto.DatosNuevoLote;
import co.unillanos.secct.usecases.dto.OperationResult;
import co.unillanos.secct.usecases.ports.LogLotePort;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/** HU03 - Registrar lote: criterios de aceptación a nivel de caso de uso. */
class RegistrarLoteHU03UseCaseTest {

    private static class LogEspia implements LogLotePort {
        final List<String> registrados = new ArrayList<>();
        final List<String> rechazados = new ArrayList<>();

        public void loteRegistrado(Lote lote) {
            registrados.add(lote.getId() + "|" + lote.getPiscicultorId());
        }

        public void registroLoteRechazado(String piscicultorId, String motivo) {
            rechazados.add(piscicultorId + "|" + motivo);
        }
    }

    private final InMemoryLoteRepository repo = new InMemoryLoteRepository();
    private final GeneradorCodigoLoteSecuencial generador = new GeneradorCodigoLoteSecuencial();
    private final LogEspia log = new LogEspia();
    private final RegistrarLoteUseCase useCase = new RegistrarLoteUseCase(repo, generador, log);

    private static DatosNuevoLote datos(String piscicultor, LocalDate fecha, BigDecimal peso, int unidades) {
        return new DatosNuevoLote(piscicultor, fecha, peso,
                unidades, "ESTACION_PISCICOLA", "");
    }

    private static DatosNuevoLote datosValidos(String piscicultor) {
        return datos(piscicultor, LocalDate.of(2025, 5, 24), new BigDecimal("120.50"), 15);
    }

    @Test
    void shouldSaveLoteAsAbiertoAssociatedToPiscicultorAndReturnItsCode() {
        OperationResult r = useCase.execute(datosValidos("piscicultor1"));

        assertTrue(r.isSuccess());
        Optional<Lote> guardado = repo.findById(r.getReferencia());
        assertTrue(guardado.isPresent());
        assertEquals(EstadoLote.ABIERTO, guardado.get().getEstado());
        assertEquals("piscicultor1", guardado.get().getPiscicultorId());
    }

    @Test
    void shouldGenerateDifferentCodeForEachLote() {
        String a = useCase.execute(datosValidos("piscicultor1")).getReferencia();
        String b = useCase.execute(datosValidos("piscicultor1")).getReferencia();

        assertNotEquals(a, b);
    }

    @Test
    void shouldLogRegistrationWithCodeAndPiscicultor() {
        OperationResult r = useCase.execute(datosValidos("piscicultor1"));

        assertEquals(1, log.registrados.size());
        assertEquals(r.getReferencia() + "|piscicultor1", log.registrados.get(0));
    }

    @Test
    void shouldNotSaveNorConsumeCodeWhenDataIsInvalid() {
        OperationResult invalido = useCase.execute(
                datos("piscicultor1", LocalDate.of(2025, 5, 24), new BigDecimal("10000.01"), 15));
        OperationResult valido = useCase.execute(datosValidos("piscicultor1"));

        assertFalse(invalido.isSuccess());
        assertEquals(1, repo.findByPiscicultorId("piscicultor1").size());
        assertTrue(valido.getReferencia().endsWith("-001"), "el código no se consume si el dato es inválido");
    }

    @Test
    void shouldLogRejectedRegistration() {
        useCase.execute(datos("piscicultor1", LocalDate.now().plusDays(1), new BigDecimal("10.00"), 5));

        assertEquals(0, log.registrados.size());
        assertEquals(1, log.rechazados.size());
    }

    @Test
    void shouldRejectPesoWithMoreThanTwoDecimals() {
        OperationResult r = useCase.execute(
                datos("piscicultor1", LocalDate.of(2025, 5, 24), new BigDecimal("1.234"), 5));

        assertFalse(r.isSuccess());
        assertTrue(r.getMessage().contains("RN-004"));
    }

    @Test
    void shouldRejectUnidadesAboveFiveHundred() {
        OperationResult r = useCase.execute(
                datos("piscicultor1", LocalDate.of(2025, 5, 24), new BigDecimal("10.00"), 501));

        assertFalse(r.isSuccess());
        assertTrue(r.getMessage().contains("RN-005"));
    }

    @Test
    void shouldRejectMissingPiscicultor() {
        OperationResult r = useCase.execute(datosValidos(null));

        assertFalse(r.isSuccess());
        assertTrue(repo.findByEstadoIn(EstadoLote.ABIERTO).isEmpty());
    }

    @Test
    void shouldRejectWhenCodeAlreadyExists() {
        GeneradorCodigoLoteSecuencial fijo = new GeneradorCodigoLoteSecuencial() {
            @Override
            public CodigoLote generarCodigoLote() {
                return new CodigoLote("SECCT-20250524-001");
            }
        };
        RegistrarLoteUseCase uc = new RegistrarLoteUseCase(repo, fijo, log);

        assertTrue(uc.execute(datosValidos("piscicultor1")).isSuccess());
        OperationResult duplicado = uc.execute(datosValidos("piscicultor1"));

        assertFalse(duplicado.isSuccess());
        assertEquals(1, repo.findByPiscicultorId("piscicultor1").size());
    }

    @Test
    void shouldListOnlyOwnLotes() {
        useCase.execute(datosValidos("piscicultor1"));
        useCase.execute(datosValidos("piscicultor1"));
        useCase.execute(datosValidos("piscicultor2"));
        SeleccionarLoteUseCase consulta = new SeleccionarLoteUseCase(repo);

        assertEquals(2, consulta.listarDePiscicultor("piscicultor1").size());
        assertEquals(1, consulta.listarDePiscicultor("piscicultor2").size());
        assertTrue(consulta.listarDePiscicultor("otro").isEmpty());
        assertTrue(consulta.listarDePiscicultor(null).isEmpty());
    }
}
