package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.dto.ExpandSampleRequestDTO;
import co.unillanos.secct.usecases.dto.RegisterBatchRequestDTO;
import co.unillanos.secct.usecases.services.BatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BatchResponseDTO register(@Valid @RequestBody RegisterBatchRequestDTO request) {
        Integer ownerId = getAuthenticatedUserId();
        return batchService.register(request, ownerId);
    }

    /** HU-05: own batches with status EVALUADO (DC-HU5, DS-HU5). */
    @GetMapping("/evaluated")
    public List<BatchResponseDTO> listEvaluated() {
        Integer ownerId = getAuthenticatedUserId();
        return batchService.listEvaluated(ownerId);
    }

    /**
     * Lists batches for authenticated user.
     * When estado is "EVALUADO", delegates to listEvaluated (homologating Infraestructura del proyecto web_2.md).
     * Supports both /api/batches and /api/batches/available (DS-HU4).
     */
    @GetMapping({"", "/available"})
    public List<BatchResponseDTO> listAvailable(@RequestParam(name = "estado", required = false) String estado) {
        Integer ownerId = getAuthenticatedUserId();
        if ("EVALUADO".equalsIgnoreCase(estado)) {
            return batchService.listEvaluated(ownerId);
        }
        return batchService.listAvailable(ownerId);
    }

    /** HU-04: one own batch by code. */
    @GetMapping("/{code}")
    public BatchResponseDTO getByCode(@PathVariable String code) {
        Integer ownerId = getAuthenticatedUserId();
        return batchService.getByCodeAndOwner(code, ownerId);
    }

    /** HU-09: logically deletes an own batch in any status alongside its active reports. */
    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String code) {
        Integer ownerId = getAuthenticatedUserId();
        batchService.delete(code, ownerId);
    }

    /** HU-13: expands the sample size of an evaluated or reported batch. */
    @PostMapping("/{code}/expand")
    public BatchResponseDTO expandSample(@PathVariable String code,
                                         @Valid @RequestBody ExpandSampleRequestDTO request) {
        Integer ownerId = getAuthenticatedUserId();
        return batchService.expandSample(code, ownerId, request);
    }

    private Integer getAuthenticatedUserId() {
        return AuthenticatedUserHelper.getAuthenticatedUserId();
    }
}
