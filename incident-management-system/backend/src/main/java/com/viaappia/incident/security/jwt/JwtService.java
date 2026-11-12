package com.viaappia.incident.security.jwt;

import com.viaappia.incident.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Generates and validates JWT access tokens.
 *
 * The secret comes from {@code app.jwt.secret} (env JWT_SECRET) and must have at least
 * 32 characters. The multiplayer room server of the game uses the SAME secret to verify
 * tokens, so both must be configured together. With a 64+ byte secret, jjwt signs with HS512.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationInMilliseconds;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationInMilliseconds
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationInMilliseconds = expirationInMilliseconds;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId().toString())
                .claim("name", user.getName())
                .claim(
                        "roles",
                        user.getRoles()
                                .stream()
                                .map(role -> role.getName().name())
                                .toList()
                )
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationInMilliseconds)))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String username) {
        String extractedUsername = extractUsername(token);

        return extractedUsername.equals(username) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token)
                .getExpiration()
                .before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
