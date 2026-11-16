package co.unillanos.secct.usecases.services;

import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageValidatorTest {

    private static final long FIVE_MB = 5L * 1024 * 1024;
    private final ImageValidator validator = new ImageValidator();

    @Test
    @DisplayName("validateFormat acepta encabezado magico JPEG valido")
    void validateFormatAcceptsValidJpeg() {
        byte[] jpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};

        assertDoesNotThrow(() -> validator.validateFormat(jpeg));
    }

    @Test
    @DisplayName("validateFormat acepta encabezado magico PNG valido")
    void validateFormatAcceptsValidPng() {
        byte[] png = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01};

        assertDoesNotThrow(() -> validator.validateFormat(png));
    }

    @Test
    @DisplayName("validateFormat rechaza arreglo nulo o vacio con estado 400")
    void validateFormatRejectsNullAndEmpty() {
        BusinessException nullEx = assertThrows(BusinessException.class,
                () -> validator.validateFormat(null));
        assertEquals(400, nullEx.getHttpStatus());
        assertEquals("La imagen está vacía", nullEx.getMessage());

        BusinessException emptyEx = assertThrows(BusinessException.class,
                () -> validator.validateFormat(new byte[0]));
        assertEquals(400, emptyEx.getHttpStatus());
        assertEquals("La imagen está vacía", emptyEx.getMessage());
    }

    @Test
    @DisplayName("validateFormat rechaza bytes no JPG/PNG o encabezado incompleto con estado 400")
    void validateFormatRejectsUnsupportedBytes() {
        byte[] gif = new byte[]{'G', 'I', 'F', '8', '9', 'a', 0x01, 0x02};
        BusinessException gifEx = assertThrows(BusinessException.class,
                () -> validator.validateFormat(gif));
        assertEquals(400, gifEx.getHttpStatus());
        assertEquals("El archivo no es una imagen JPG o PNG válida", gifEx.getMessage());

        byte[] truncatedJpeg = new byte[]{(byte) 0xFF, (byte) 0xD8};
        BusinessException shortEx = assertThrows(BusinessException.class,
                () -> validator.validateFormat(truncatedJpeg));
        assertEquals(400, shortEx.getHttpStatus());
        assertEquals("El archivo no es una imagen JPG o PNG válida", shortEx.getMessage());
    }

    @Test
    @DisplayName("validateSize permite tamaño exacto al limite y nulo")
    void validateSizeAcceptsWithinLimit() {
        assertDoesNotThrow(() -> validator.validateSize(null, FIVE_MB));
        assertDoesNotThrow(() -> validator.validateSize(new byte[1024], 1024));
    }

    @Test
    @DisplayName("validateSize rechaza imagenes que superan 5 MB con estado 413")
    void validateSizeRejectsOverLimitWith413() {
        byte[] oversized = new byte[(int) FIVE_MB + 1];

        BusinessException ex = assertThrows(BusinessException.class,
                () -> validator.validateSize(oversized, FIVE_MB));

        assertEquals(413, ex.getHttpStatus());
        assertEquals("La imagen supera el tamaño máximo de 5 MB", ex.getMessage());
    }
}
