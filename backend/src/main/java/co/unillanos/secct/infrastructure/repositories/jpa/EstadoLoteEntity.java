package co.unillanos.secct.infrastructure.repositories.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Tabla {@code estado_lote}: catálogo (ABIERTO, EN_EVALUACION, EVALUADO, REPORTADO). Solo lectura. */
@Entity
@Table(name = "estado_lote")
public class EstadoLoteEntity {

    @Id
    @Column(name = "id")
    private Short id;

    @Column(name = "codigo", length = 20, nullable = false)
    private String codigo;

    public EstadoLoteEntity() {
    }

    public Short getId() { return id; }
    public String getCodigo() { return codigo; }
}
