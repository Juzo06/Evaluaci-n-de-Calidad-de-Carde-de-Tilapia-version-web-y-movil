package co.unillanos.secct.infrastructure.repositories.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoLoteJpaRepository extends JpaRepository<EstadoLoteEntity, Short> {

    Optional<EstadoLoteEntity> findByCodigo(String codigo);
}
