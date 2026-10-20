package co.unillanos.secct.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Lifecycle status of a batch: ABIERTO, EN_EVALUACION or EVALUADO. */
@Entity
@Table(name = "estado_lote")
public class BatchStatus {

    @Id
    private Short id;

    @Column(name = "codigo", nullable = false, unique = true)
    private String code;

    protected BatchStatus() {
    }

    public Short getId() {
        return id;
    }

    public String getCode() {
        return code;
    }
}
