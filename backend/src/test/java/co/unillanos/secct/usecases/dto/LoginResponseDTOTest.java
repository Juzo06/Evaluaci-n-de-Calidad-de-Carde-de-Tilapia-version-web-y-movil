package co.unillanos.secct.usecases.dto;

import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LoginResponseDTOTest {

    @Test
    @DisplayName("PU-10: LoginResponseDTO expone únicamente los 5 campos definidos (id, email, roleCode, accessToken, expiresInMinutes) sin datos sensibles")
    void testPU10_ExposesOnlyFiveFieldsWithoutSensitiveData() {
        Role role = new Role((short) 2, "PISCICULTOR");
        User user = new User(role, "Carlos", "Gómez", "carlos@example.com", "3001234567",
                "hashedpassword64characterslength1234567890abcdef1234567890abcdef12", "saltBase64==");
        user.setId(42);

        String token = "jwt.token.mock";
        int expiresInMinutes = 30;

        LoginResponseDTO dto = LoginResponseDTO.from(user, token, expiresInMinutes);

        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(42);
        assertThat(dto.email()).isEqualTo("carlos@example.com");
        assertThat(dto.roleCode()).isEqualTo("PISCICULTOR");
        assertThat(dto.accessToken()).isEqualTo(token);
        assertThat(dto.expiresInMinutes()).isEqualTo(30);

        // PU-10: Reflection check confirming exactly 5 fields and absence of sensitive attributes
        Field[] fields = LoginResponseDTO.class.getDeclaredFields();
        List<String> fieldNames = Arrays.stream(fields).map(Field::getName).toList();

        assertThat(fieldNames).containsExactlyInAnyOrder("id", "email", "roleCode", "accessToken", "expiresInMinutes");
        assertThat(fieldNames).doesNotContain("password", "passwordHash", "salt", "active", "isDeleted");
    }

    @Test
    @DisplayName("LoginResponseDTO.from con usuario nulo retorna null")
    void testFrom_NullUser_ReturnsNull() {
        LoginResponseDTO dto = LoginResponseDTO.from(null, "token", 30);
        assertThat(dto).isNull();
    }

    @Test
    @DisplayName("LoginResponseDTO.from con usuario sin rol asignado maneja roleCode nulo")
    void testFrom_UserWithoutRole_ReturnsNullRoleCode() {
        User user = new User(null, "Pedro", "Ruiz", "pedro@example.com", "3112223344", "hash", "salt");
        user.setId(10);

        LoginResponseDTO dto = LoginResponseDTO.from(user, "token", 30);
        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(10);
        assertThat(dto.roleCode()).isNull();
    }
}
