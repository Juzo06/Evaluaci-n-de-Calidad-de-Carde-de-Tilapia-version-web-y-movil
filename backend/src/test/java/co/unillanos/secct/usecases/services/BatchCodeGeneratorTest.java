package co.unillanos.secct.usecases.services;

import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BatchCodeGeneratorTest {

    private static final LocalDate CAPTURE_DATE = LocalDate.of(2026, 11, 15);
    private final BatchCodeGenerator generator = new BatchCodeGenerator();

    @Test
    @DisplayName("generate rellena con ceros secuencia de 1 digito")
    void generateFormatsOneDigitSequence() {
        assertEquals("SECCT-20261115-001", generator.generate(CAPTURE_DATE, 1));
    }

    @Test
    @DisplayName("generate rellena con cero secuencia de 2 digitos")
    void generateFormatsTwoDigitSequence() {
        assertEquals("SECCT-20261115-012", generator.generate(CAPTURE_DATE, 12));
    }

    @Test
    @DisplayName("generate conserva secuencia de 3 digitos hasta 999")
    void generateFormatsThreeDigitSequence() {
        assertEquals("SECCT-20261115-345", generator.generate(CAPTURE_DATE, 345));
        assertEquals("SECCT-20261115-999", generator.generate(CAPTURE_DATE, 999));
    }

    @Test
    @DisplayName("generate lanza BusinessException 409 cuando la secuencia supera 999 (4 digitos) o es menor que 1")
    void generateRejectsOutOfRangeSequences() {
        BusinessException overflowEx = assertThrows(BusinessException.class,
                () -> generator.generate(CAPTURE_DATE, 1000));
        assertEquals(409, overflowEx.getHttpStatus());
        assertEquals("Se alcanzó el máximo de 999 lotes para la fecha de captura 2026-11-15",
                overflowEx.getMessage());

        BusinessException zeroEx = assertThrows(BusinessException.class,
                () -> generator.generate(CAPTURE_DATE, 0));
        assertEquals(409, zeroEx.getHttpStatus());
    }
}
