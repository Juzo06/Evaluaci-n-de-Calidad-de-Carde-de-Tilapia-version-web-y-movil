package co.unillanos.secct.infrastructure.repositories.jpa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Tabla {@code lote}. Detalle de infraestructura: el dominio usa {@code entities.Lote}. */
@Entity
@Table(name = "lote")
public class LoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private Integer usuarioId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "estacion_id", nullable = false, updatable = false)
    private EstacionEntity estacion;

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

    @OneToMany(mappedBy = "lote", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<EvaluacionEntity> evaluaciones = new ArrayList<>();

    public LoteEntity() {
    }

    public void agregarEvaluacion(EvaluacionEntity evaluacion) {
        evaluacion.setLote(this);
        evaluaciones.add(evaluacion);
    }

    public Integer getId() { return id; }
    public Integer getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Integer usuarioId) { this.usuarioId = usuarioId; }
    public EstacionEntity getEstacion() { return estacion; }
    public void setEstacion(EstacionEntity estacion) { this.estacion = estacion; }
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
    public List<EvaluacionEntity> getEvaluaciones() { return evaluaciones; }
}
