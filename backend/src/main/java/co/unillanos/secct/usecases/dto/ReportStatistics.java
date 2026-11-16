package co.unillanos.secct.usecases.dto;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** Aggregated statistics of a batch evaluation, serializable to JSONB for saved report versions. */
public record ReportStatistics(
        long evaluationCount,
        BigDecimal finalClassification,
        BigDecimal eyeAverage,
        BigDecimal skinAverage,
        Map<Short, Long> countByCategory
) {

    private static final Gson GSON = new GsonBuilder().serializeNulls().create();

    public String toJson() {
        return GSON.toJson(this);
    }

    public static ReportStatistics fromJson(String json) {
        ReportStatistics parsed = GSON.fromJson(json, ReportStatistics.class);
        Map<Short, Long> normalized = new LinkedHashMap<>();
        for (short category = 1; category <= 5; category++) {
            long count = 0L;
            if (parsed != null && parsed.countByCategory() != null) {
                Long value = parsed.countByCategory().get(category);
                if (value != null) {
                    count = value;
                }
            }
            normalized.put(category, count);
        }
        if (parsed == null) {
            return new ReportStatistics(0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, normalized);
        }
        return new ReportStatistics(
                parsed.evaluationCount(),
                parsed.finalClassification(),
                parsed.eyeAverage(),
                parsed.skinAverage(),
                normalized
        );
    }
}
