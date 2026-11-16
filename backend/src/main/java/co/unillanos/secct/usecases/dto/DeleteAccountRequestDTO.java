package co.unillanos.secct.usecases.dto;

import jakarta.validation.constraints.NotBlank;

/** Request body for POST /api/users/me/delete (HU-08). */
public class DeleteAccountRequestDTO {

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    public DeleteAccountRequestDTO() {
    }

    public DeleteAccountRequestDTO(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
