package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.ErrorResponseDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("PL-1.18: DataIntegrityViolationException por correo duplicado retorna 409 y mensaje de correo")
    void handleConflict_duplicateEmail() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement", new RuntimeException("duplicate key value violates unique constraint \"usuario_correo_key\""));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/users");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("correo ya registrado");
    }

    @Test
    @DisplayName("PL-4.20: DataIntegrityViolationException por imagen duplicada retorna 409 y mensaje de imagen evaluada")
    void handleConflict_duplicateImage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement", new RuntimeException("duplicate key value violates unique constraint \"uq_evaluacion_imagen\""));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/evaluations/batches/B1/units");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("Esta imagen ya fue evaluada anteriormente");
    }

    @Test
    @DisplayName("PL-3.21: DataIntegrityViolationException por código de lote duplicado retorna 409")
    void handleConflict_duplicateBatchCode() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement", new RuntimeException("duplicate key value violates unique constraint \"lote_codigo_key\""));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/batches");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("No se pudo generar un código único para el lote");
    }

    @Test
    @DisplayName("DataIntegrityViolationException sin patrón específico en /api/users devuelve mensaje contextual")
    void handleConflict_genericUser() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement", new RuntimeException("generic foreign key constraint"));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/users");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("registro");
    }

    @Test
    @DisplayName("MethodArgumentTypeMismatchException retorna 400 Bad Request con el nombre del parámetro")
    void handleTypeMismatch_returnsBadRequest() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("id");

        ResponseEntity<ErrorResponseDTO> response = handler.handleTypeMismatch(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Parámetro inválido: id");
    }

    @Test
    @DisplayName("DataIntegrityViolationException con constraint de reporte vigente devuelve 409 contextual")
    void handleConflict_reportConstraint() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement",
                new RuntimeException("duplicate key value violates unique constraint \"uq_reporte_vigente\""));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/batches/2026-10-20-001/reports");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("reporte vigente");
    }

    @Test
    @DisplayName("DataIntegrityViolationException en URI /reports sin constraint específico devuelve mensaje de reporte")
    void handleConflict_reportUriFallback() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement", new RuntimeException("generic integrity error"));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/batches/2026-10-20-001/reports");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("reporte");
    }

    @Test
    @DisplayName("DataIntegrityViolationException sin patrón ni URI conocida devuelve mensaje general seguro")
    void handleConflict_genericSafeFallback() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement", new RuntimeException("internal schema detail"));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/other");

        ResponseEntity<ErrorResponseDTO> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo(
                "Conflicto de integridad de datos. La operación no pudo completarse.");
    }
}
