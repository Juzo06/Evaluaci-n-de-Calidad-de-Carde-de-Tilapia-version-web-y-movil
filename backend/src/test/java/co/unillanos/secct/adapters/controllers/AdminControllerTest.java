package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.SystemInfoResponseDTO;
import co.unillanos.secct.usecases.services.SystemInfoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SystemInfoService systemInfoService;

    @BeforeEach
    void setUp() {
        AdminController adminController = new AdminController(systemInfoService);
        mockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(7, null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/admin/system-info retorna 200 OK con SystemInfoResponseDTO")
    void getSystemInfo_Returns200() throws Exception {
        when(systemInfoService.getSystemInfo(7)).thenReturn(new SystemInfoResponseDTO(18L, 42L, 310L));

        mockMvc.perform(get("/api/admin/system-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(18))
                .andExpect(jsonPath("$.totalBatches").value(42))
                .andExpect(jsonPath("$.totalEvaluations").value(310));

        verify(systemInfoService).getSystemInfo(7);
    }

    @Test
    @DisplayName("GET /api/admin/system-info retorna 401 si no hay autenticación en contexto")
    void getSystemInfo_Unauthenticated_Returns401() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/admin/system-info"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario no autenticado"));

        verifyNoInteractions(systemInfoService);
    }
}
