package co.unillanos.secct.usecases.dto;

/** System-wide counts returned to administrators in HU-07 (GET /api/admin/system-info). */
public record SystemInfoResponseDTO(
        long totalUsers,
        long totalBatches,
        long totalEvaluations
) {
}
