package co.unillanos.secct.adapters.web;

import co.unillanos.secct.entities.CodigoLote;
import co.unillanos.secct.entities.FechaCaptura;
import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.entities.PesoLote;
import co.unillanos.secct.entities.PuntoEvaluacion;
import co.unillanos.secct.usecases.dto.OperationResult;
import co.unillanos.secct.usecases.services.SecctApp;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import co.unillanos.secct.usecases.dto.DatosNuevoLote;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Prueba de la capa web de HU03 sin levantar Spring completo ni base de datos. */
class LoteControllerTest {

    private static final String CODIGO = "SECCT-20250524-001";

    private SecctApp app;
    private MockMvc mvc;

    @BeforeEach
    void preparar() {
        app = Mockito.mock(SecctApp.class);
        mvc = MockMvcBuilders.standaloneSetup(new LoteController(app))
                .setControllerAdvice(new ManejadorErrores())
                .build();
    }

    private static Lote loteDe(String piscicultor) {
        return Lote.nuevo(new CodigoLote(CODIGO), piscicultor,
                new FechaCaptura(LocalDate.of(2025, 5, 24)),
                new PesoLote(new BigDecimal("120.50")), 15,
                PuntoEvaluacion.ESTACION_PISCICOLA, "Agua a 18 grados");
    }

    private static String json(String fecha, String peso, String unidades) {
        return "{\"fechaCaptura\":" + fecha
                + ",\"peso\":" + peso + ",\"numeroUnidadesMuestra\":" + unidades + "}";
    }

    private static String jsonValido() {
        return json("\"2025-05-24\"", "120.50", "15");
    }

    @Test
    void shouldReturn201WithCodeAndAbiertoWhenRegistrationSucceeds() throws Exception {
        when(app.registrarLote(any())).thenReturn(OperationResult.ok("registrado", CODIGO));

        mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(jsonValido()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/lotes/" + CODIGO))
                .andExpect(jsonPath("$.codigo").value(CODIGO))
                .andExpect(jsonPath("$.estado").value("ABIERTO"));
    }

    @Test
    void shouldAssociateLoteToAuthenticatedPiscicultorNotToBodyData() throws Exception {
        when(app.registrarLote(any())).thenReturn(OperationResult.ok("registrado", CODIGO));

        mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                .contentType(MediaType.APPLICATION_JSON).content(jsonValido()));

        ArgumentCaptor<DatosNuevoLote> captor = ArgumentCaptor.forClass(DatosNuevoLote.class);
        verify(app).registrarLote(captor.capture());
        assertEquals("1", captor.getValue().getPiscicultorId());
    }

    @Test
    void shouldReturn400NamingEachFieldWhenSeveralAreMissingOrOutOfRange() throws Exception {
        String futura = "\"" + LocalDate.now().plusDays(1) + "\"";

        mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fechaCaptura\":" + futura
                                + ",\"numeroUnidadesMuestra\":501}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[?(@.campo=='fechaCaptura')]").exists())
                .andExpect(jsonPath("$.errores[?(@.campo=='peso')]").exists())
                .andExpect(jsonPath("$.errores[?(@.campo=='numeroUnidadesMuestra')]").exists());

        verify(app, never()).registrarLote(any());
    }

    @Test
    void shouldReturn400ForPesoAboveMaximumZeroAndMoreThanTwoDecimals() throws Exception {
        for (String peso : List.of("10000.01", "0", "1.234", "-5")) {
            mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json("\"2025-05-24\"", peso, "5")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errores[?(@.campo=='peso')]").exists());
        }
        verify(app, never()).registrarLote(any());
    }

    @Test
    void shouldAcceptPesoAtLimits() throws Exception {
        when(app.registrarLote(any())).thenReturn(OperationResult.ok("registrado", CODIGO));

        for (String peso : List.of("0.01", "10000.00")) {
            mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json("\"2025-05-24\"", peso, "5")))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    void shouldReturn400ForUnidadesOutOfRange() throws Exception {
        for (String unidades : List.of("0", "501")) {
            mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json("\"2025-05-24\"", "10.00", unidades)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errores[?(@.campo=='numeroUnidadesMuestra')]").exists());
        }
    }

    @Test
    void shouldReturn400WhenObservacionesExceedFiveHundredCharacters() throws Exception {
        mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fechaCaptura\":\"2025-05-24\","
                                + "\"peso\":10.00,\"numeroUnidadesMuestra\":5,\"observaciones\":\""
                                + "x".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[?(@.campo=='observaciones')]").exists());
    }

    @Test
    void shouldReturn400WhenBodyIsNotValidJson() throws Exception {
        mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{esto no es json"))
                .andExpect(status().isBadRequest());
        verify(app, never()).registrarLote(any());
    }

    @Test
    void shouldReturn400WithDomainMessageWhenUseCaseRejects() throws Exception {
        when(app.registrarLote(any())).thenReturn(OperationResult.fail("mensaje del dominio"));

        mvc.perform(post("/api/lotes").header("X-Usuario-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(jsonValido()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("mensaje del dominio"));
    }

    @Test
    void shouldListLotesOfAuthenticatedPiscicultorOnly() throws Exception {
        when(app.listarLotesDePiscicultor("1")).thenReturn(List.of(loteDe("1")));

        mvc.perform(get("/api/lotes").header("X-Usuario-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").value(CODIGO));

        verify(app).listarLotesDePiscicultor(eq("1"));
    }

    @Test
    void shouldReturn400WhenUsuarioHeaderIsMissing() throws Exception {
        mvc.perform(post("/api/lotes")
                        .contentType(MediaType.APPLICATION_JSON).content(jsonValido()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/lotes")).andExpect(status().isBadRequest());

        verify(app, never()).registrarLote(any());
    }
}
