package co.unillanos.secct.entities;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/** Batch of tilapia registered by a piscicultor. */
@Entity
@Table(name = "lote")
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "codigo", nullable = false, unique = true, updatable = false)
    private String code;

    @Column(name = "fecha_captura", nullable = false)
    private LocalDate captureDate;

    @Column(name = "peso_kg", nullable = false, precision = 7, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "numero_unidades_muestra", nullable = false)
    private Integer sampleUnitCount;

    @Column(name = "observaciones", length = 500)
    private String notes;

    @Column(name = "clasificacion_final", precision = 4, scale = 2)
    private BigDecimal finalClassification;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false, updatable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estado_lote", nullable = false)
    private BatchStatus status;

    @Column(name = "eliminado", nullable = false)
    private boolean isDeleted;

    @Column(name = "eliminado_en")
    private OffsetDateTime deletedAt;

    @Column(name = "eliminado_por")
    private Integer deletedBy;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "actualizado_en", nullable = false)
    private OffsetDateTime updatedAt;

    protected Batch() {
    }

    public Batch(String code, LocalDate captureDate, BigDecimal weightKg, Integer sampleUnitCount,
                 String notes, User owner, BatchStatus status) {
        this.code = code;
        this.captureDate = captureDate;
        this.weightKg = weightKg;
        this.sampleUnitCount = sampleUnitCount;
        this.notes = notes;
        this.owner = owner;
        this.status = status;
        this.isDeleted = false;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
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

    public String getCode() {
        return code;
    }

    public LocalDate getCaptureDate() {
        return captureDate;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public Integer getSampleUnitCount() {
        return sampleUnitCount;
    }

    public String getNotes() {
        return notes;
    }

    public BigDecimal getFinalClassification() {
        return finalClassification;
    }

    public User getOwner() {
        return owner;
    }

    public BatchStatus getStatus() {
        return status;
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
