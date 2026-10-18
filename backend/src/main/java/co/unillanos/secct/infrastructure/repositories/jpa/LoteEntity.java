package co.unillanos.secct.infrastructure.repositories.jpa;

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
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Tabla {@code lote}. Detalle de infraestructura: el dominio usa {@code entities.Lote}.
 * Las evaluaciones (tabla evaluacion) NO se mapean: pertenecen a la HU de evaluación,
 * cuyo diseño de tablas cambió.
 */
@Entity
@Table(name = "lote")
// borrado lógico: las consultas ignoran los lotes marcados como eliminados
@SQLRestriction("is_deleted = false")
public class LoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private Integer usuarioId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "estado_lote_id", nullable = false)
    private EstadoLoteEntity estadoLote;

    @Column(name = "codigo", length = 30, nullable = false, updatable = false)
    private String codigo;

    @Column(name = "fecha_captura", nullable = false, updatable = false)
    private LocalDate fechaCaptura;

    @Column(name = "peso", nullable = false, precision = 10, scale = 2, updatable = false)
    private BigDecimal peso;

    @Column(name = "numero_unidades_muestra", nullable = false, updatable = false)
    private int numeroUnidadesMuestra;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "clasificacion_final", precision = 4, scale = 2)
    private BigDecimal clasificacionFinal;

    // Columnas de auditoría / borrado lógico (la BD las exige NOT NULL)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private Integer deletedBy;

    public LoteEntity() {
    }

    @PrePersist
    void alCrear() {
        Instant ahora = Instant.now();
        createdAt = ahora;
        updatedAt = ahora;
        deleted = false;
    }

    @PreUpdate
    void alActualizar() {
        updatedAt = Instant.now();
    }

    public Integer getId() { return id; }
    public Integer getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Integer usuarioId) { this.usuarioId = usuarioId; }
    public EstadoLoteEntity getEstadoLote() { return estadoLote; }
    public void setEstadoLote(EstadoLoteEntity estadoLote) { this.estadoLote = estadoLote; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public LocalDate getFechaCaptura() { return fechaCaptura; }
    public void setFechaCaptura(LocalDate fechaCaptura) { this.fechaCaptura = fechaCaptura; }
    public BigDecimal getPeso() { return peso; }
    public void setPeso(BigDecimal peso) { this.peso = peso; }
    public int getNumeroUnidadesMuestra() { return numeroUnidadesMuestra; }
    public void setNumeroUnidadesMuestra(int n) { this.numeroUnidadesMuestra = n; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public BigDecimal getClasificacionFinal() { return clasificacionFinal; }
    public void setClasificacionFinal(BigDecimal c) { this.clasificacionFinal = c; }
}
