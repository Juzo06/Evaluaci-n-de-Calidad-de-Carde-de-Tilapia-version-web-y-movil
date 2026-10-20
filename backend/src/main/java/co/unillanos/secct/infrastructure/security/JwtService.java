package co.unillanos.secct.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/** Validates HS256 tokens and extracts the user id stored in the "sub" claim. */
@Service
public class JwtService {

    private final SecretKey signingKey;

    public JwtService(@Value("${secct.jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public boolean validateToken(String token) {
        try {
            Integer.valueOf(parseClaims(token).getSubject());
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Integer getUserId(String token) {
        return Integer.valueOf(parseClaims(token).getSubject());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
