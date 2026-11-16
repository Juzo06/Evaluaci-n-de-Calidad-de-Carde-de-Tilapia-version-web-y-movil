package co.unillanos.secct.entities;

import co.unillanos.secct.usecases.dto.ReportStatistics;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** Versioned quality report stored for a batch according to DC-HU10 through DC-HU14. */
@Entity
@Table(name = "reporte")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lote_id", nullable = false, updatable = false)
    private Batch batch;

    @Column(name = "version", nullable = false, updatable = false)
    private Integer version;

    @Column(name = "vigente", nullable = false)
    private boolean current = true;

    @Column(name = "clasificacion_final", nullable = false, precision = 4, scale = 2)
    private BigDecimal finalClassification;

    @Column(name = "numero_evaluaciones", nullable = false)
    private Integer evaluationCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "estadisticas", nullable = false, columnDefinition = "jsonb")
    private String statistics;

    @Column(name = "fecha_generacion", nullable = false, updatable = false)
    private OffsetDateTime generatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "deleted_by")
    private Integer deletedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Report() {
    }

    public Report(Batch batch, Integer version, ReportStatistics statistics) {
        this.batch = batch;
        this.version = version;
        this.current = true;
        this.finalClassification = statistics.finalClassification();
        this.evaluationCount = Math.toIntExact(statistics.evaluationCount());
        this.statistics = statistics.toJson();
        OffsetDateTime now = OffsetDateTime.now();
        this.generatedAt = now;
        this.isDeleted = false;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public boolean isCurrent() {
        return current;
    }

    /** Marks this report version as historical when a batch sample is expanded. */
    public void markAsPrevious() {
        this.current = false;
    }

    /** Logically deletes this report version and clears the current flag. */
    public void softDelete(Integer userId) {
        this.current = false;
        this.isDeleted = true;
        this.deletedAt = OffsetDateTime.now();
        this.deletedBy = userId;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (this.generatedAt == null) {
            this.generatedAt = now;
        }
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public Batch getBatch() {
        return batch;
    }

    public Integer getVersion() {
        return version;
    }

    public BigDecimal getFinalClassification() {
        return finalClassification;
    }

    public Integer getEvaluationCount() {
        return evaluationCount;
    }

    public String getStatistics() {
        return statistics;
    }

    public OffsetDateTime getGeneratedAt() {
        return generatedAt;
    }

    public boolean isDeleted() {
        return isDeleted;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public Integer getDeletedBy() {
        return deletedBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
