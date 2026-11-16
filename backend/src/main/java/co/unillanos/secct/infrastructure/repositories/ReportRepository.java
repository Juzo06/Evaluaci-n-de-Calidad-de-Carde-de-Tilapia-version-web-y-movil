package co.unillanos.secct.infrastructure.repositories;

import co.unillanos.secct.entities.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    List<Report> findByBatchOwnerIdAndIsDeletedFalse(Integer ownerId);

    List<Report> findByBatchIdAndIsDeletedFalse(Integer batchId);

    Optional<Report> findByIdAndBatchOwnerIdAndIsDeletedFalse(Integer id, Integer ownerId);

    Optional<Report> findByBatchIdAndCurrentTrueAndIsDeletedFalse(Integer batchId);

    @Query("SELECT COALESCE(MAX(r.version), 0) FROM Report r WHERE r.batch.id = :batchId")
    int findMaxVersionByBatchId(@Param("batchId") Integer batchId);
}
