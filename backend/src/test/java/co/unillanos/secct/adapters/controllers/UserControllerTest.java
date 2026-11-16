package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.DeleteAccountRequestDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.services.UserService;
import com.google.gson.Gson;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private final Gson gson = new Gson();

    @Mock
    private UserService userService;

    @BeforeEach
    void setUp() {
        UserController userController = new UserController(userService);
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(15, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/users/me/delete retorna 204 No Content cuando la eliminación es exitosa")
    void deleteAccount_Success_Returns204() throws Exception {
        mockMvc.perform(post("/api/users/me/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gson.toJson(new DeleteAccountRequestDTO("MiClave2026"))))
                .andExpect(status().isNoContent());

        verify(userService).deleteAccount(eq(15), any(DeleteAccountRequestDTO.class));
    }

    @Test
    @DisplayName("POST /api/users/me/delete con password vacío retorna 400 Bad Request")
    void deleteAccount_BlankPassword_Returns400() throws Exception {
        mockMvc.perform(post("/api/users/me/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gson.toJson(new DeleteAccountRequestDTO("   "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"));

        verifyNoInteractions(userService);
    }

    @Test
    @DisplayName("POST /api/users/me/delete con contraseña incorrecta retorna 403 Forbidden")
    void deleteAccount_WrongPassword_Returns403() throws Exception {
        doThrow(new BusinessException("Contraseña incorrecta", 403))
                .when(userService).deleteAccount(eq(15), any(DeleteAccountRequestDTO.class));

        mockMvc.perform(post("/api/users/me/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gson.toJson(new DeleteAccountRequestDTO("Erronea123"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Contraseña incorrecta"));
    }

    @Test
    @DisplayName("POST /api/users/me/delete cuando el usuario no existe retorna 404 Not Found")
    void deleteAccount_NotFound_Returns404() throws Exception {
        doThrow(new BusinessException("Usuario no encontrado", 404))
                .when(userService).deleteAccount(eq(15), any(DeleteAccountRequestDTO.class));

        mockMvc.perform(post("/api/users/me/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gson.toJson(new DeleteAccountRequestDTO("MiClave2026"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Usuario no encontrado"));
    }
}
