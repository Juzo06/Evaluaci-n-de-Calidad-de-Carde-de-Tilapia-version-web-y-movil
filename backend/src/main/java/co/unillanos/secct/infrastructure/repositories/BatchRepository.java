package co.unillanos.secct.infrastructure.repositories;

import co.unillanos.secct.entities.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Integer> {

    /** Counts every batch of the date, including logically deleted ones, so codes are never reused. */
    long countByCaptureDate(LocalDate captureDate);
}
