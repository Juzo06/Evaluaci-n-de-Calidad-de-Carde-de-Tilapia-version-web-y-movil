package co.unillanos.secct.infrastructure.repositories.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EstacionJpaRepository extends JpaRepository<EstacionEntity, Integer> {

    /** Misma regla que el índice único de V2: lower(nombre). */
    @Query("select e from EstacionEntity e where lower(e.nombre) = lower(:nombre)")
    Optional<EstacionEntity> buscarPorNombre(@Param("nombre") String nombre);
}
