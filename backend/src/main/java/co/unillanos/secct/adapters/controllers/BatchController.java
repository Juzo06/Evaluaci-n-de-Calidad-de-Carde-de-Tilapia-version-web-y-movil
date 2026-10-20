package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.dto.RegisterBatchRequestDTO;
import co.unillanos.secct.usecases.services.BatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
        Integer ownerId = (Integer) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return batchService.register(request, ownerId);
    }

    /** HU-04: own batches available to evaluate (ABIERTO or EN_EVALUACION). */
    @GetMapping
    public List<BatchResponseDTO> listAvailable() {
        Integer ownerId = (Integer) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return batchService.listAvailable(ownerId);
    }

    /** HU-04: one own batch by code. */
    @GetMapping("/{code}")
    public BatchResponseDTO getByCode(@PathVariable String code) {
        Integer ownerId = (Integer) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return batchService.getByCodeAndOwner(code, ownerId);
    }
}
