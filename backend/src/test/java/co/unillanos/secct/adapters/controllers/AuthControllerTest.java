package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.LoginRequestDTO;
import co.unillanos.secct.usecases.dto.LoginResponseDTO;
import co.unillanos.secct.usecases.services.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/auth/login delega en authService.login y retorna LoginResponseDTO (200 OK)")
    void testLogin_Returns200WithDto() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "Password123");
        LoginResponseDTO expectedResponse = new LoginResponseDTO(1, "carlos@example.com", "PISCICULTOR", "jwt.token", 30);

        when(authService.login(request)).thenReturn(expectedResponse);

        LoginResponseDTO result = authController.login(request);

        assertThat(result).isEqualTo(expectedResponse);
        verify(authService).login(request);
    }

    @Test
    @DisplayName("POST /api/auth/logout extrae userId Integer de SecurityContext y llama a authService.logout")
    void testLogout_WithIntegerPrincipal_CallsAuthService() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(42, null, null));

        authController.logout();

        verify(authService).logout(42);
    }

    @Test
    @DisplayName("POST /api/auth/logout extrae userId String parseable de SecurityContext")
    void testLogout_WithStringPrincipal_CallsAuthService() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("99", null, null));

        authController.logout();

        verify(authService).logout(99);
    }

    @Test
    @DisplayName("POST /api/auth/logout con string no numérico pasa userId nulo")
    void testLogout_WithUnparseableStringPrincipal_PassesNullUserId() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("not-a-number", null, null));

        authController.logout();

        verify(authService).logout(null);
    }

    @Test
    @DisplayName("POST /api/auth/logout con principal de tipo no soportado pasa userId nulo")
    void testLogout_WithUnsupportedPrincipalType_PassesNullUserId() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(new Object(), null, null));

        authController.logout();

        verify(authService).logout(null);
    }

    @Test
    @DisplayName("POST /api/auth/logout con contexto nulo pasa userId nulo a authService.logout")
    void testLogout_WithoutAuthentication_PassesNullUserId() {
        SecurityContextHolder.clearContext();

        authController.logout();

        verify(authService).logout(null);
    }
}
