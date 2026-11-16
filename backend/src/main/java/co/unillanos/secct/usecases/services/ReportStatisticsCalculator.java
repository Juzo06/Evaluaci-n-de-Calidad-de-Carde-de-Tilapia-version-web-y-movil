package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Evaluation;
import co.unillanos.secct.entities.EvaluationPoint;
import co.unillanos.secct.usecases.dto.ReportStatistics;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Calculates aggregated quality statistics from a batch's unit evaluations (HU-06, HU-10). */
@Component
public class ReportStatisticsCalculator {

    private static final String EYE_PART_CODE = "OJO";
    private static final String SKIN_PART_CODE = "PIEL";

    public ReportStatistics calculate(List<Evaluation> evaluations) {
        Map<Short, Long> countByCategory = new LinkedHashMap<>();
        for (short category = 1; category <= 5; category++) {
            countByCategory.put(category, 0L);
        }

        if (evaluations == null || evaluations.isEmpty()) {
            BigDecimal zero = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            return new ReportStatistics(0L, zero, zero, zero, countByCategory);
        }

        long eyeSum = 0L;
        long eyeCount = 0L;
        long skinSum = 0L;
        long skinCount = 0L;
        long totalSum = 0L;
        long totalCount = 0L;

        for (Evaluation evaluation : evaluations) {
            List<EvaluationPoint> points = evaluation.getPoints();
            if (points == null || points.isEmpty()) {
                continue;
            }

            long unitSum = 0L;
            long unitCount = 0L;
            for (EvaluationPoint point : points) {
                if (point.getNtcCategory() == null) {
                    continue;
                }
                int category = point.getNtcCategory();
                totalSum += category;
                totalCount++;
                unitSum += category;
                unitCount++;

                String partCode = point.getFishPart() != null ? point.getFishPart().getCode() : null;
                if (EYE_PART_CODE.equals(partCode)) {
                    eyeSum += category;
                    eyeCount++;
                } else if (SKIN_PART_CODE.equals(partCode)) {
                    skinSum += category;
                    skinCount++;
                }
            }

            if (unitCount > 0) {
                short unitCategory = (short) Math.max(1, Math.min(5,
                        BigDecimal.valueOf(unitSum)
                                .divide(BigDecimal.valueOf(unitCount), 0, RoundingMode.HALF_UP)
                                .intValue()));
                countByCategory.merge(unitCategory, 1L, Long::sum);
            }
        }

        return new ReportStatistics(
                evaluations.size(),
                average(totalSum, totalCount),
                average(eyeSum, eyeCount),
                average(skinSum, skinCount),
                countByCategory
        );
    }

    private BigDecimal average(long sum, long count) {
        if (count == 0L) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(sum).divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }
}
