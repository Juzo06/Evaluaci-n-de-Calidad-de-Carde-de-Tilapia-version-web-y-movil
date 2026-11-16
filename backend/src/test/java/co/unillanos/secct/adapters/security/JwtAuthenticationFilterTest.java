package co.unillanos.secct.adapters.security;

import co.unillanos.secct.infrastructure.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("PU-15: Solicitud a endpoint protegido sin header Authorization responde 401 Unauthorized y no invoca la cadena")
    void testPU15_MissingAuthorizationHeader_Responds401AndHalts() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/logout");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("Tu sesión no es válida o expiró");
        verify(filterChain, never()).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("PU-15: Solicitud con header Authorization sin prefijo Bearer responde 401 Unauthorized")
    void testPU15_InvalidHeaderPrefix_Responds401() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/batches/available");
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("PU-15: Solicitud con token inválido o expirado responde 401 Unauthorized y no llama al controlador")
    void testPU15_InvalidToken_Responds401() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/evaluations/unit");
        request.addHeader("Authorization", "Bearer invalid.expired.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.validateToken("invalid.expired.token")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("PU-16: Token válido coloca userId y rol en SecurityContext y continúa la cadena")
    void testPU16_ValidToken_SetsSecurityContextAndProceeds() throws ServletException, IOException {
        String token = "valid.jwt.token";
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/logout");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.getUserId(token)).thenReturn(55);
        when(jwtService.getRoleCode(token)).thenReturn("PISCICULTOR");

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        verify(filterChain).doFilter(request, response);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(55);
        assertThat(auth.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .containsExactly("ROLE_PISCICULTOR");
    }

    @Test
    @DisplayName("PU-16: Token válido con rol ADMINISTRADOR asigna ROLE_ADMINISTRADOR")
    void testPU16_ValidTokenWithAdminRole() throws ServletException, IOException {
        String token = "admin.jwt.token";
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/metrics");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.getUserId(token)).thenReturn(1);
        when(jwtService.getRoleCode(token)).thenReturn("ADMINISTRADOR");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .containsExactly("ROLE_ADMINISTRADOR");
    }

    @Test
    @DisplayName("CB-12: Endpoints públicos permiten paso libre sin requerir token")
    void testCB12_PublicEndpointsBypassFilter() throws ServletException, IOException {
        // POST /api/users
        MockHttpServletRequest postUsers = new MockHttpServletRequest("POST", "/api/users");
        MockHttpServletResponse response1 = new MockHttpServletResponse();
        filter.doFilterInternal(postUsers, response1, filterChain);
        verify(filterChain).doFilter(postUsers, response1);

        // POST /api/auth/login
        MockHttpServletRequest postLogin = new MockHttpServletRequest("POST", "/api/auth/login");
        MockHttpServletResponse response2 = new MockHttpServletResponse();
        filter.doFilterInternal(postLogin, response2, filterChain);
        verify(filterChain).doFilter(postLogin, response2);

        // POST /api/auth/registro
        MockHttpServletRequest postRegistro = new MockHttpServletRequest("POST", "/api/auth/registro");
        MockHttpServletResponse response3 = new MockHttpServletResponse();
        filter.doFilterInternal(postRegistro, response3, filterChain);
        verify(filterChain).doFilter(postRegistro, response3);

        // GET /actuator/health
        MockHttpServletRequest health = new MockHttpServletRequest("GET", "/actuator/health");
        MockHttpServletResponse response4 = new MockHttpServletResponse();
        filter.doFilterInternal(health, response4, filterChain);
        verify(filterChain).doFilter(health, response4);

        // OPTIONS (CORS preflight)
        MockHttpServletRequest options = new MockHttpServletRequest("OPTIONS", "/api/any");
        MockHttpServletResponse response5 = new MockHttpServletResponse();
        filter.doFilterInternal(options, response5, filterChain);
        verify(filterChain).doFilter(options, response5);
    }

    @Test
    @DisplayName("Token válido con roleCode nulo o en blanco establece contexto sin autoridades")
    void testValidToken_WithNullOrBlankRole() throws ServletException, IOException {
        String token = "no-role.jwt.token";
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/batches/available");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.getUserId(token)).thenReturn(99);
        when(jwtService.getRoleCode(token)).thenReturn("");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities()).isEmpty();
    }

    @Test
    @DisplayName("Endpoints públicos con context-path no nulo permiten paso libre")
    void testPublicEndpoints_WithContextPath() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/context/api/auth/login");
        request.setContextPath("/context");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }
}
