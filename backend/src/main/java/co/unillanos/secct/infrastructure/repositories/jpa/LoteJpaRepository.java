package co.unillanos.secct.infrastructure.repositories.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Spring Data JPA: solo lo usa el adaptador {@link LoteRepositoryJpa}. */
public interface LoteJpaRepository extends JpaRepository<LoteEntity, Integer> {

    Optional<LoteEntity> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<LoteEntity> findByUsuarioIdOrderByIdDesc(Integer usuarioId);

    List<LoteEntity> findByEstadoLoteCodigoInOrderByIdAsc(Collection<String> codigos);
}
