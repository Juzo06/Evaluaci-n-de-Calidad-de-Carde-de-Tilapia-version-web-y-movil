package co.unillanos.secct.infrastructure.repositories;

import co.unillanos.secct.entities.LogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogRepository extends JpaRepository<LogEntry, Long> {
}
