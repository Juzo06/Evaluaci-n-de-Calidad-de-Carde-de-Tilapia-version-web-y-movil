package co.unillanos.secct.usecases.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Request body for POST /api/batches/{code}/expand (HU-13). */
public class ExpandSampleRequestDTO {

    @NotNull(message = "Las unidades adicionales son obligatorias")
    @Min(value = 1, message = "Las unidades adicionales deben ser entre 1 y 499")
    @Max(value = 499, message = "Las unidades adicionales deben ser entre 1 y 499")
    private Integer additionalUnits;

    public ExpandSampleRequestDTO() {
    }

    public ExpandSampleRequestDTO(Integer additionalUnits) {
        this.additionalUnits = additionalUnits;
    }

    public Integer getAdditionalUnits() {
        return additionalUnits;
    }

    public void setAdditionalUnits(Integer additionalUnits) {
        this.additionalUnits = additionalUnits;
    }
}
