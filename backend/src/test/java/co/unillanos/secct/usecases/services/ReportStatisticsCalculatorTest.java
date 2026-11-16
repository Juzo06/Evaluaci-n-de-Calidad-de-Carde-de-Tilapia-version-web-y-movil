package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.BatchStatus;
import co.unillanos.secct.entities.Evaluation;
import co.unillanos.secct.entities.FishPart;
import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReportStatisticsCalculatorTest {

    private ReportStatisticsCalculator calculator;
    private Batch batch;
    private FishPart eyePart;
    private FishPart skinPart;

    @BeforeEach
    void setUp() {
        calculator = new ReportStatisticsCalculator();
        Role role = new Role((short) 2, "PISCICULTOR");
        User owner = new User(role, "Carlos", "Pérez", "carlos@correo.com", "3101234567", "hash", "salt");
        batch = new Batch("SECCT-20261020-001", LocalDate.of(2026, 10, 20),
                new BigDecimal("12.50"), 3, "Estanque 2", owner, new BatchStatus((short) 3, BatchStatus.EVALUATED));

        eyePart = mock(FishPart.class);
        when(eyePart.getCode()).thenReturn("OJO");
        skinPart = mock(FishPart.class);
        when(skinPart.getCode()).thenReturn("PIEL");
    }

    private Evaluation createUnit(String ref, short eyeCat, short skinCat) {
        Evaluation evaluation = new Evaluation(batch, ref);
        evaluation.addPoint(eyePart, eyeCat, new BigDecimal("0.9300"));
        evaluation.addPoint(skinPart, skinCat, new BigDecimal("0.8800"));
        return evaluation;
    }

    @Test
    @DisplayName("calculate retorna ceros y mapa de categorías 1..5 inicializado para lista vacía")
    void calculate_EmptyList_ReturnsZeros() {
        ReportStatistics stats = calculator.calculate(List.of());

        assertThat(stats.evaluationCount()).isZero();
        assertThat(stats.finalClassification()).isEqualByComparingTo("0.00");
        assertThat(stats.eyeAverage()).isEqualByComparingTo("0.00");
        assertThat(stats.skinAverage()).isEqualByComparingTo("0.00");
        assertThat(stats.countByCategory()).containsKeys((short) 1, (short) 2, (short) 3, (short) 4, (short) 5);
        assertThat(stats.countByCategory().values()).containsOnly(0L);
    }

    @Test
    @DisplayName("calculate calcula promedios de OJO, PIEL, clasificación final y conteo por categoría NTC 1..5")
    void calculate_MultipleEvaluations_ComputesExactAveragesAndCategoryCounts() {
        List<Evaluation> evaluations = List.of(
                createUnit("img-1", (short) 3, (short) 3), // unit avg = 3.0 -> cat 3
                createUnit("img-2", (short) 5, (short) 3), // unit avg = 4.0 -> cat 4
                createUnit("img-3", (short) 4, (short) 4)  // unit avg = 4.0 -> cat 4
        );

        ReportStatistics stats = calculator.calculate(evaluations);

        assertThat(stats.evaluationCount()).isEqualTo(3L);
        assertThat(stats.eyeAverage()).isEqualByComparingTo("4.00");
        assertThat(stats.skinAverage()).isEqualByComparingTo("3.33");
        assertThat(stats.finalClassification()).isEqualByComparingTo("3.67");
        assertThat(stats.countByCategory()).containsEntry((short) 1, 0L)
                .containsEntry((short) 2, 0L)
                .containsEntry((short) 3, 1L)
                .containsEntry((short) 4, 2L)
                .containsEntry((short) 5, 0L);
    }
}
