package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.ReportResponseDTO;
import co.unillanos.secct.usecases.dto.ReportSummaryDTO;
import co.unillanos.secct.usecases.services.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** REST controller for HU-06, HU-10, HU-11, HU-12 and HU-14 report endpoints. */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/batches/{code}")
    public ReportResponseDTO generate(@PathVariable String code) {
        Integer ownerId = AuthenticatedUserHelper.getAuthenticatedUserId();
        return reportService.generate(code, ownerId);
    }

    @PostMapping("/batches/{code}")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportSummaryDTO save(@PathVariable String code) {
        Integer ownerId = AuthenticatedUserHelper.getAuthenticatedUserId();
        return reportService.save(code, ownerId);
    }

    @GetMapping
    public List<ReportSummaryDTO> list() {
        Integer ownerId = AuthenticatedUserHelper.getAuthenticatedUserId();
        return reportService.listByOwner(ownerId);
    }

    @GetMapping("/{id}")
    public ReportResponseDTO getById(@PathVariable Integer id) {
        Integer ownerId = AuthenticatedUserHelper.getAuthenticatedUserId();
        return reportService.getById(id, ownerId);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(@PathVariable Integer id) {
        Integer ownerId = AuthenticatedUserHelper.getAuthenticatedUserId();
        byte[] pdf = reportService.exportPdf(id, ownerId);
        String filename = reportService.resolvePdfFilename(id, ownerId);
        if (filename == null || filename.isBlank()) {
            filename = "reporte-" + id + ".pdf";
        }
        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        if (pdf != null) {
            builder.contentLength(pdf.length);
        }
        return builder.body(pdf);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        Integer ownerId = AuthenticatedUserHelper.getAuthenticatedUserId();
        reportService.delete(id, ownerId);
    }
}
