package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.BatchStatusRepository;
import co.unillanos.secct.infrastructure.repositories.UserRepository;
import co.unillanos.secct.usecases.dto.BatchResponseDTO;
import co.unillanos.secct.usecases.dto.RegisterBatchRequestDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BatchService {

    private static final String INITIAL_STATUS_CODE = "ABIERTO";
    private static final String BATCH_REGISTERED_EVENT = "BATCH_REGISTERED";

    private final UserRepository userRepository;
    private final BatchStatusRepository statusRepository;
    private final BatchRepository batchRepository;
    private final BatchCodeGenerator codeGenerator;
    private final LogService logService;

    public BatchService(UserRepository userRepository,
                        BatchStatusRepository statusRepository,
                        BatchRepository batchRepository,
                        BatchCodeGenerator codeGenerator,
                        LogService logService) {
        this.userRepository = userRepository;
        this.statusRepository = statusRepository;
        this.batchRepository = batchRepository;
        this.codeGenerator = codeGenerator;
        this.logService = logService;
    }

    @Transactional
    public BatchResponseDTO register(RegisterBatchRequestDTO request, Integer ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado", 401));

        BatchStatus status = statusRepository.findByCode(INITIAL_STATUS_CODE)
                .orElseThrow(() -> new BusinessException(
                        "El estado " + INITIAL_STATUS_CODE + " no está configurado", 500));

        long dailyCount = batchRepository.countByCaptureDate(request.captureDate);
        String code = codeGenerator.generate(request.captureDate, dailyCount + 1);

        Batch batch = new Batch(code, request.captureDate, request.weightKg, request.sampleUnitCount,
                request.notes, owner, status);
        Batch saved = batchRepository.save(batch);

        logService.recordEvent(BATCH_REGISTERED_EVENT, ownerId, saved.getId(), null,
                "Lote " + saved.getCode() + " registrado");

        return BatchResponseDTO.from(saved, 0);
    }
}
