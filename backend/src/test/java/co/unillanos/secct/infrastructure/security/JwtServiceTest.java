package co.unillanos.secct.infrastructure.security;

import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String TEST_SECRET = "super-secret-jwt-signing-key-for-testing-purposes-only-32bytes";
    private static final int EXPIRATION_MINUTES = 30;

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, EXPIRATION_MINUTES);

        Role role = new Role((short) 2, "PISCICULTOR");
        testUser = new User(role, "Carlos", "Pérez", "carlos@example.com", "3001234567", "hash", "salt");
        testUser.setId(101);
    }

    @Test
    @DisplayName("PU-11: validateToken devuelve true solo para tokens válidos, con firma íntegra y no expirados")
    void testPU11_ValidateToken_ValidToken() {
        String token = jwtService.generateToken(testUser);

        assertThat(token).isNotNull().isNotBlank();
        assertThat(jwtService.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("PU-12: validateToken devuelve false para tokens alterados o con firma inválida")
    void testPU12_ValidateToken_TamperedToken() {
        String token = jwtService.generateToken(testUser);

        // Tamper signature by replacing characters
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertThat(jwtService.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("PU-13: validateToken devuelve false para tokens expirados (PL-2.18)")
    void testPU13_ValidateToken_ExpiredToken() {
        // Create service with negative expiration
        JwtService expiredJwtService = new JwtService(TEST_SECRET, -5);
        String expiredToken = expiredJwtService.generateToken(testUser);

        assertThat(jwtService.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("PQ-08: validateToken rechaza tokens no seguros con algoritmo 'none' o malformados")
    void testPQ08_RejectUnsecuredOrMalformedToken() {
        // Token malformed or unsecured "none" algorithm simulation
        String noneAlgToken = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMDEiLCJyb2xlQ29kZSI6IlBJU0NJQ1VMVE9SIn0.";
        assertThat(jwtService.validateToken(noneAlgToken)).isFalse();

        assertThat(jwtService.validateToken("not.a.valid.jwt")).isFalse();
        assertThat(jwtService.validateToken("")).isFalse();
        assertThat(jwtService.validateToken("   ")).isFalse();
        assertThat(jwtService.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("PU-14: getUserId y getRoleCode extraen las afirmaciones (claims) correctamente del token")
    void testPU14_ExtractClaims() {
        String token = jwtService.generateToken(testUser);

        Integer userId = jwtService.getUserId(token);
        String roleCode = jwtService.getRoleCode(token);

        assertThat(userId).isEqualTo(101);
        assertThat(roleCode).isEqualTo("PISCICULTOR");
    }

    @Test
    @DisplayName("generateToken lanza IllegalArgumentException si el usuario o su ID son nulos")
    void testGenerateToken_NullUserOrId_ThrowsException() {
        assertThatThrownBy(() -> jwtService.generateToken(null))
                .isInstanceOf(IllegalArgumentException.class);

        User userWithoutId = new User();
        assertThatThrownBy(() -> jwtService.generateToken(userWithoutId))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("generateToken con usuario sin rol asigna roleCode nulo en el token")
    void testGenerateToken_UserWithNullRole() {
        testUser.setRole(null);
        String token = jwtService.generateToken(testUser);

        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.getUserId(token)).isEqualTo(101);
        assertThat(jwtService.getRoleCode(token)).isNull();
    }

    @Test
    @DisplayName("validateToken retorna false cuando el subject del token no es numérico o es nulo")
    void testValidateToken_NonNumericOrNullSubject() {
        // Build signed token with string subject
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        String nonNumericToken = Jwts.builder()
                .subject("not-an-int")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        assertThat(jwtService.validateToken(nonNumericToken)).isFalse();

        String nullSubjectToken = Jwts.builder()
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        assertThat(jwtService.validateToken(nullSubjectToken)).isFalse();
    }

    @Test
    @DisplayName("getExpirationMinutes retorna el valor configurado (CB-05)")
    void testGetExpirationMinutes() {
        assertThat(jwtService.getExpirationMinutes()).isEqualTo(30);
    }
}
