package co.unillanos.secct.infrastructure.repositories.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Tabla {@code estacion}: catálogo de estaciones piscícolas (nombre único sin distinguir mayúsculas). */
@Entity
@Table(name = "estacion")
public class EstacionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    public EstacionEntity() {
    }

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }
}
