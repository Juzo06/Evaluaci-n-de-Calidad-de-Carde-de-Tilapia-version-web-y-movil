package co.unillanos.secct.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Registered user (piscicultor). Only the attributes needed by the batch flow are mapped. */
@Entity
@Table(name = "usuario")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "email", nullable = false)
    private String email;

    protected User() {
    }

    public Integer getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }
}
