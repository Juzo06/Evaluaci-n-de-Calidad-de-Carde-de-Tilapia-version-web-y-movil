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

class ExpandSampleRequestDTOTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("ExpandSampleRequestDTO valido dentro de [1, 499] no genera violaciones")
    void validAdditionalUnits() {
        ExpandSampleRequestDTO minDto = new ExpandSampleRequestDTO(1);
        assertThat(validator.validate(minDto)).isEmpty();
        assertThat(minDto.getAdditionalUnits()).isEqualTo(1);

        ExpandSampleRequestDTO maxDto = new ExpandSampleRequestDTO();
        maxDto.setAdditionalUnits(499);
        assertThat(validator.validate(maxDto)).isEmpty();
        assertThat(maxDto.getAdditionalUnits()).isEqualTo(499);
    }

    @Test
    @DisplayName("additionalUnits nulo, 0 o mayor a 499 genera violacion")
    void invalidAdditionalUnits() {
        Set<ConstraintViolation<ExpandSampleRequestDTO>> nullViolations =
                validator.validate(new ExpandSampleRequestDTO());
        assertThat(nullViolations)
                .anyMatch(v -> v.getPropertyPath().toString().equals("additionalUnits"));

        assertThat(validator.validate(new ExpandSampleRequestDTO(0)))
                .anyMatch(v -> v.getPropertyPath().toString().equals("additionalUnits"));

        assertThat(validator.validate(new ExpandSampleRequestDTO(500)))
                .anyMatch(v -> v.getPropertyPath().toString().equals("additionalUnits"));
    }
}
