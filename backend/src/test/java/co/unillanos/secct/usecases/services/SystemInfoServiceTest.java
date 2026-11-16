package co.unillanos.secct.usecases.services;

import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.EvaluationRepository;
import co.unillanos.secct.infrastructure.repositories.UserRepository;
import co.unillanos.secct.usecases.dto.SystemInfoResponseDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemInfoServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private LogService logService;

    private SystemInfoService systemInfoService;

    @BeforeEach
    void setUp() {
        systemInfoService = new SystemInfoService(userRepository, batchRepository, evaluationRepository, logService);
    }

    @Test
    @DisplayName("HU-07 getSystemInfo: retorna conteos de registros no borrados y registra SYSTEM_INFO_VIEWED")
    void getSystemInfo_Success() {
        when(userRepository.countByIsDeletedFalse()).thenReturn(18L);
        when(batchRepository.countByIsDeletedFalse()).thenReturn(42L);
        when(evaluationRepository.countByBatchIsDeletedFalse()).thenReturn(310L);

        SystemInfoResponseDTO result = systemInfoService.getSystemInfo(1);

        assertThat(result.totalUsers()).isEqualTo(18L);
        assertThat(result.totalBatches()).isEqualTo(42L);
        assertThat(result.totalEvaluations()).isEqualTo(310L);
        verify(logService).recordEvent(eq("SYSTEM_INFO_VIEWED"), eq(1), isNull(), isNull(), any());
    }

    @Test
    @DisplayName("HU-07 getSystemInfo: lanza 401 si adminId es nulo")
    void getSystemInfo_NullAdminId_Throws401() {
        assertThatThrownBy(() -> systemInfoService.getSystemInfo(null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Usuario no autenticado")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(401);

        verifyNoInteractions(userRepository, batchRepository, evaluationRepository, logService);
    }
}
