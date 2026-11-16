package co.unillanos.secct.usecases.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DeleteAccountRequestDTOTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("DeleteAccountRequestDTO con password no vacio es valido")
    void validPassword() {
        DeleteAccountRequestDTO dto = new DeleteAccountRequestDTO("SecretPass123");
        assertThat(validator.validate(dto)).isEmpty();
        assertThat(dto.getPassword()).isEqualTo("SecretPass123");
    }

    @Test
    @DisplayName("DeleteAccountRequestDTO con password nulo, vacio o espacios genera violacion")
    void blankOrNullPasswordGeneratesViolation() {
        DeleteAccountRequestDTO emptyDto = new DeleteAccountRequestDTO();
        emptyDto.setPassword("   ");
        assertThat(validator.validate(emptyDto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("password"));

        assertThat(validator.validate(new DeleteAccountRequestDTO(null)))
                .anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }
}
