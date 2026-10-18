package co.unillanos.secct.infrastructure.repositories.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Tabla {@code evaluacion}. {@code fecha_evaluacion} la rellena la base de datos
 * (DEFAULT now()), por eso no se mapea.
 */
@Entity
@Table(name = "evaluacion")
public class EvaluacionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lote_id", nullable = false)
    private LoteEntity lote;

    @Column(name = "id_imagen", length = 255, nullable = false)
    private String idImagen;

    @Column(name = "clasificacion", nullable = false)
    private int clasificacion;

    public EvaluacionEntity() {
    }

    public EvaluacionEntity(String idImagen, int clasificacion) {
        this.idImagen = idImagen;
        this.clasificacion = clasificacion;
    }

    public Integer getId() { return id; }
    public void setLote(LoteEntity lote) { this.lote = lote; }
    public String getIdImagen() { return idImagen; }
    public int getClasificacion() { return clasificacion; }
}
