package co.unillanos.secct.usecases.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRequestDTOTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("LoginRequestDTO válido no produce violaciones")
    void testValidRequest_NoViolations() {
        LoginRequestDTO dto = new LoginRequestDTO("usuario@unillanos.edu.co", "Password123");
        Set<ConstraintViolation<LoginRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("PL-2.05: Correo con longitud recortada menor a 6 caracteres es rechazado")
    void testPL205_EmailTrimmedLengthLessThanSix() {
        LoginRequestDTO dto = new LoginRequestDTO(" a@b ", "Password123");
        Set<ConstraintViolation<LoginRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("email")
                && v.getMessage().contains("entre 6 y 100 caracteres"));
    }

    @Test
    @DisplayName("PL-2.06: Correo con longitud recortada mayor a 100 caracteres es rechazado")
    void testPL206_EmailTrimmedLengthGreaterThanHundred() {
        String longEmail = "a".repeat(95) + "@test.co"; // 103 characters
        LoginRequestDTO dto = new LoginRequestDTO(longEmail, "Password123");
        Set<ConstraintViolation<LoginRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("email")
                && v.getMessage().contains("entre 6 y 100 caracteres"));
    }

    @Test
    @DisplayName("Correo con espacios en los extremos pero longitud válida es aceptado")
    void testEmail_SurroundingWhitespaceWithValidTrimmedLength_Accepted() {
        LoginRequestDTO dto = new LoginRequestDTO("   user@test.co   ", "Password123");
        Set<ConstraintViolation<LoginRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Correo en blanco o nulo genera violación")
    void testEmail_BlankOrNull_GeneratesViolation() {
        LoginRequestDTO dto = new LoginRequestDTO("", "Password123");
        Set<ConstraintViolation<LoginRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("email"));

        LoginRequestDTO nullDto = new LoginRequestDTO(null, "Password123");
        Set<ConstraintViolation<LoginRequestDTO>> nullViolations = validator.validate(nullDto);
        assertThat(nullViolations).anyMatch(v -> v.getPropertyPath().toString().equals("email"));
    }

    @Test
    @DisplayName("Contraseña en blanco o nula genera violación")
    void testPassword_BlankOrNull_GeneratesViolation() {
        LoginRequestDTO dto = new LoginRequestDTO("user@test.co", "");
        Set<ConstraintViolation<LoginRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));

        LoginRequestDTO nullDto = new LoginRequestDTO("user@test.co", null);
        Set<ConstraintViolation<LoginRequestDTO>> nullViolations = validator.validate(nullDto);
        assertThat(nullViolations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }

    @Test
    @DisplayName("toString() enmascara la contraseña y nunca la expone en texto claro (RNF-SEC-04)")
    void testToString_MasksPassword() {
        LoginRequestDTO dto = new LoginRequestDTO("secret@test.co", "SuperSecretPass123");
        String str = dto.toString();
        assertThat(str).doesNotContain("SuperSecretPass123");
        assertThat(str).contains("[PROTECTED]");
        assertThat(str).contains("secret@test.co");
    }

    @Test
    @DisplayName("Getters y setters funcionan adecuadamente")
    void testGettersAndSetters() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("nuevo@test.co");
        dto.setPassword("NewPass123");

        assertThat(dto.getEmail()).isEqualTo("nuevo@test.co");
        assertThat(dto.getPassword()).isEqualTo("NewPass123");
    }
}
