package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.infrastructure.repositories.UserRepository;
import co.unillanos.secct.infrastructure.security.JwtService;
import co.unillanos.secct.usecases.dto.LoginRequestDTO;
import co.unillanos.secct.usecases.dto.LoginResponseDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordService passwordService;

    @Mock
    private JwtService jwtService;

    @Mock
    private LogService logService;

    private AuthService authService;

    private User validUser;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordService, jwtService, logService);

        Role role = new Role((short) 2, "PISCICULTOR");
        validUser = new User(role, "Carlos", "Pérez", "carlos@example.com", "3001234567",
                "hashedpassword64charsabcdef1234567890abcdef1234567890abcdef1234", "saltValue123");
        validUser.setId(10);
        validUser.setActive(true);
        validUser.setDeleted(false);
    }

    @Test
    @DisplayName("CB-01 Branch 1: request nulo lanza excepción 401 y registra LOGIN_FAILED")
    void testLogin_NullRequest_Throws401AndRecordsEvent() {
        assertThatThrownBy(() -> authService.login(null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), contains("desconocido"));
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 2: rawEmail nulo lanza excepción 401 y no consulta BD")
    void testLogin_NullEmail_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO(null, "Password123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 3: contraseña nula lanza excepción 401 y no consulta BD")
    void testLogin_NullPassword_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", null);
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), contains("***@***.***"));
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 4: contraseña con longitud menor a 8 caracteres lanza 401 y no consulta BD")
    void testLogin_PasswordTooShort_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "short1");
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 5: contraseña con longitud mayor a 20 caracteres lanza 401 y no consulta BD")
    void testLogin_PasswordTooLong_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "123456789012345678901"); // 21 chars
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 6: contraseña consistente solo de espacios lanza 401 y no consulta BD")
    void testLogin_PasswordOnlySpaces_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "          "); // 10 spaces
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 7: correo recortado con longitud menor a 6 caracteres lanza 401 y no consulta BD")
    void testLogin_EmailTrimmedLengthLessThanSix_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO(" a@b ", "Password123");
        when(logService.maskSensitiveData("a@b")).thenReturn("***@***.***");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 8: correo recortado con longitud mayor a 100 caracteres lanza 401 y no consulta BD")
    void testLogin_EmailTrimmedLengthGreaterThanHundred_Throws401() {
        String longEmail = "a".repeat(95) + "@test.co"; // 103 chars
        LoginRequestDTO request = new LoginRequestDTO(longEmail, "Password123");
        when(logService.maskSensitiveData(longEmail.toLowerCase())).thenReturn("***@***.***");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CB-01 Branch 9 / PL-2.09 / CN-02: usuario inexistente en BD lanza 401 y registra LOGIN_FAILED con userId nulo")
    void testLogin_UserNotFound_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO("noexiste@example.com", "Password123");
        when(logService.maskSensitiveData("noexiste@example.com")).thenReturn("***@***.***");
        when(userRepository.findByEmail("noexiste@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), isNull(), contains("***@***.***"));
    }

    @Test
    @DisplayName("CB-01 Branch 10 / PL-2.11: usuario eliminado (isDeleted = true) lanza 401 y registra LOGIN_FAILED con userId")
    void testLogin_UserDeleted_Throws401() {
        validUser.setDeleted(true);
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "Password123");
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");
        when(userRepository.findByEmail("carlos@example.com")).thenReturn(Optional.of(validUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), eq(10), contains("***@***.***"));
        verify(passwordService, never()).verifyPassword(any(), any(), any());
    }

    @Test
    @DisplayName("CB-01 Branch 11: usuario inactivo (active = false) lanza 401 y registra LOGIN_FAILED con userId")
    void testLogin_UserInactive_Throws401() {
        validUser.setActive(false);
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "Password123");
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");
        when(userRepository.findByEmail("carlos@example.com")).thenReturn(Optional.of(validUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), eq(10), contains("***@***.***"));
        verify(passwordService, never()).verifyPassword(any(), any(), any());
    }

    @Test
    @DisplayName("CB-01 Branch 12 / PL-2.09 / CN-03: contraseña incorrecta lanza 401 y registra LOGIN_FAILED con userId")
    void testLogin_WrongPassword_Throws401() {
        LoginRequestDTO request = new LoginRequestDTO("carlos@example.com", "WrongPassword123");
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");
        when(userRepository.findByEmail("carlos@example.com")).thenReturn(Optional.of(validUser));
        when(passwordService.verifyPassword("WrongPassword123", validUser.getSalt(), validUser.getPasswordHash()))
                .thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("credenciales inválidas")
                .satisfies(e -> assertThat(((BusinessException) e).getHttpStatus()).isEqualTo(401));

        verify(logService).recordSecurityFailure(eq("LOGIN_FAILED"), eq(10), contains("***@***.***"));
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("CB-01 Branch 13 / PL-2.10 / PL-2.21: credenciales válidas generan token, registran LOGIN_SUCCESS y retornan LoginResponseDTO")
    void testLogin_SuccessfulAuthentication() {
        // Normalización de correo: espacios y mayúsculas
        LoginRequestDTO request = new LoginRequestDTO("  Carlos@Example.COM  ", "ValidPass123");
        when(logService.maskSensitiveData("carlos@example.com")).thenReturn("***@***.***");
        when(userRepository.findByEmail("carlos@example.com")).thenReturn(Optional.of(validUser));
        when(passwordService.verifyPassword("ValidPass123", validUser.getSalt(), validUser.getPasswordHash()))
                .thenReturn(true);
        when(jwtService.generateToken(validUser)).thenReturn("mock.jwt.token");
        when(jwtService.getExpirationMinutes()).thenReturn(30);

        LoginResponseDTO response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(10);
        assertThat(response.email()).isEqualTo("carlos@example.com");
        assertThat(response.roleCode()).isEqualTo("PISCICULTOR");
        assertThat(response.accessToken()).isEqualTo("mock.jwt.token");
        assertThat(response.expiresInMinutes()).isEqualTo(30);

        verify(logService).recordEvent(eq("LOGIN_SUCCESS"), eq(10), isNull(), isNull(),
                contains("Inicio de sesión exitoso"));
    }

    @Test
    @DisplayName("DS-HU2-logout / PI-05 / PL-2.23: logout registra evento LOGOUT con 'Sesión cerrada'")
    void testLogout_RecordsLogoutEvent() {
        authService.logout(10);

        verify(logService).recordEvent(eq("LOGOUT"), eq(10), isNull(), isNull(), eq("Sesión cerrada"));
    }
}
