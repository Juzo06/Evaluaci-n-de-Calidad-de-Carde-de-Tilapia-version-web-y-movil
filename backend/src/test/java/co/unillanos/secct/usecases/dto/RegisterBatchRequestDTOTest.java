package co.unillanos.secct.usecases.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RegisterBatchRequestDTOTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("RegisterBatchRequestDTO valido no genera violaciones")
    void validRequestHasNoViolations() {
        RegisterBatchRequestDTO dto = validDto();
        Set<ConstraintViolation<RegisterBatchRequestDTO>> violations = validator.validate(dto);
        assertThat(violations).isEmpty();
        assertThat(dto.toString()).contains("weightKg=125.50");
    }

    @Test
    @DisplayName("captureDate nulo o futuro genera violacion")
    void captureDateValidation() {
        RegisterBatchRequestDTO nullDate = validDto();
        nullDate.setCaptureDate(null);
        assertThat(validator.validate(nullDate))
                .anyMatch(v -> v.getPropertyPath().toString().equals("captureDate"));

        RegisterBatchRequestDTO futureDate = validDto();
        futureDate.setCaptureDate(LocalDate.now().plusDays(1));
        assertThat(validator.validate(futureDate))
                .anyMatch(v -> v.getPropertyPath().toString().equals("captureDate")
                        && v.getMessage().contains("no puede ser futura"));
    }

    @Test
    @DisplayName("weightKg fuera de rango o con mas de 2 decimales genera violacion")
    void weightValidation() {
        RegisterBatchRequestDTO zeroWeight = validDto();
        zeroWeight.setWeightKg(BigDecimal.ZERO);
        assertThat(validator.validate(zeroWeight))
                .anyMatch(v -> v.getPropertyPath().toString().equals("weightKg"));

        RegisterBatchRequestDTO tooHeavy = validDto();
        tooHeavy.setWeightKg(new BigDecimal("10000.01"));
        assertThat(validator.validate(tooHeavy))
                .anyMatch(v -> v.getPropertyPath().toString().equals("weightKg"));

        RegisterBatchRequestDTO threeDecimals = validDto();
        threeDecimals.setWeightKg(new BigDecimal("10.123"));
        assertThat(validator.validate(threeDecimals))
                .anyMatch(v -> v.getPropertyPath().toString().equals("weightKg")
                        && v.getMessage().contains("máximo 2 decimales"));
    }

    @Test
    @DisplayName("sampleUnitCount fuera de [1, 500] o notes mayor a 500 caracteres genera violacion")
    void sampleUnitCountAndNotesValidation() {
        RegisterBatchRequestDTO zeroUnits = validDto();
        zeroUnits.setSampleUnitCount(0);
        assertThat(validator.validate(zeroUnits))
                .anyMatch(v -> v.getPropertyPath().toString().equals("sampleUnitCount"));

        RegisterBatchRequestDTO overUnits = validDto();
        overUnits.setSampleUnitCount(501);
        assertThat(validator.validate(overUnits))
                .anyMatch(v -> v.getPropertyPath().toString().equals("sampleUnitCount"));

        RegisterBatchRequestDTO longNotes = validDto();
        longNotes.setNotes("a".repeat(501));
        assertThat(validator.validate(longNotes))
                .anyMatch(v -> v.getPropertyPath().toString().equals("notes"));
    }

    private static RegisterBatchRequestDTO validDto() {
        RegisterBatchRequestDTO dto = new RegisterBatchRequestDTO();
        dto.setCaptureDate(LocalDate.now());
        dto.setWeightKg(new BigDecimal("125.50"));
        dto.setSampleUnitCount(25);
        dto.setNotes("Estanque norte");
        return dto;
    }
}
