package co.unillanos.secct.usecases.services;

import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.EvaluationRepository;
import co.unillanos.secct.infrastructure.repositories.UserRepository;
import co.unillanos.secct.usecases.dto.SystemInfoResponseDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

/** Service for HU-07 administrator system monitoring according to DC-HU7 and DS-HU7. */
@Service
public class SystemInfoService {

    private static final String SYSTEM_INFO_VIEWED_EVENT = "SYSTEM_INFO_VIEWED";

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final EvaluationRepository evaluationRepository;
    private final LogService logService;

    public SystemInfoService(UserRepository userRepository,
                             BatchRepository batchRepository,
                             EvaluationRepository evaluationRepository,
                             LogService logService) {
        this.userRepository = userRepository;
        this.batchRepository = batchRepository;
        this.evaluationRepository = evaluationRepository;
        this.logService = logService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SystemInfoResponseDTO getSystemInfo(Integer adminId) {
        if (adminId == null) {
            throw new BusinessException("Usuario no autenticado", 401);
        }

        long totalUsers = userRepository.countByIsDeletedFalse();
        long totalBatches = batchRepository.countByIsDeletedFalse();
        long totalEvaluations = evaluationRepository.countByBatchIsDeletedFalse();

        logService.recordEvent(SYSTEM_INFO_VIEWED_EVENT, adminId, null, null,
                "Consulta de información del sistema");

        return new SystemInfoResponseDTO(totalUsers, totalBatches, totalEvaluations);
    }
}
