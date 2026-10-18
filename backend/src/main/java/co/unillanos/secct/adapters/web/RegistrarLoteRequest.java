package co.unillanos.secct.adapters.web;

import co.unillanos.secct.entities.Lote;
import co.unillanos.secct.entities.PesoLote;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Cuerpo del POST /api/lotes (HU03). Los límites salen de las constantes del
 * dominio para tener una sola fuente de verdad. El código del lote y el
 * piscicultor NO se reciben: los asigna el sistema.
 */
public record RegistrarLoteRequest(

        @NotBlank(message = "La estación de origen es obligatoria")
        @Size(min = Lote.MIN_ESTACION_ORIGEN, max = Lote.MAX_ESTACION_ORIGEN,
                message = "La estación de origen debe tener entre 3 y 100 caracteres")
        String estacionOrigen,

        @NotNull(message = "La fecha de captura es obligatoria")
        @PastOrPresent(message = "La fecha de captura no puede ser futura")
        LocalDate fechaCaptura,

        @NotNull(message = "El peso es obligatorio")
        @DecimalMin(value = PesoLote.MINIMO_TEXTO, message = "El peso debe ser mayor que 0 (mínimo 0.01)")
        @DecimalMax(value = PesoLote.MAXIMO_TEXTO, message = "El peso no puede superar 10000.00")
        @Digits(integer = 5, fraction = PesoLote.MAX_DECIMALES,
                message = "El peso admite máximo 2 decimales")
        BigDecimal peso,

        @NotNull(message = "El número de unidades de muestra es obligatorio")
        @Min(value = Lote.MIN_UNIDADES_MUESTRA, message = "Las unidades de muestra deben ser al menos 1")
        @Max(value = Lote.MAX_UNIDADES_MUESTRA, message = "Las unidades de muestra no pueden superar 500")
        Integer numeroUnidadesMuestra,

        @Size(max = Lote.MAX_OBSERVACIONES, message = "Las observaciones no pueden superar 500 caracteres")
        String observaciones) {
}
