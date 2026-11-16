package co.unillanos.secct.entities;

import co.unillanos.secct.usecases.dto.ReportStatistics;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EntitiesTest {

    @Test
    @DisplayName("Role entity: getters, setters, constructores, equals, hashCode y toString")
    void testRoleEntity() {
        Role role = new Role((short) 1, "ADMINISTRADOR");
        assertThat(role.getId()).isEqualTo((short) 1);
        assertThat(role.getCode()).isEqualTo("ADMINISTRADOR");

        Role role2 = new Role("ADMINISTRADOR");
        role2.setId((short) 1);
        assertThat(role).isEqualTo(role2);
        assertThat(role.hashCode()).isEqualTo(role2.hashCode());
        assertThat(role.toString()).contains("ADMINISTRADOR");

        Role roleDefault = new Role();
        roleDefault.setCode("PISCICULTOR");
        roleDefault.setId((short) 2);
        assertThat(roleDefault.getCode()).isEqualTo("PISCICULTOR");
        assertThat(role).isNotEqualTo(roleDefault);
        assertThat(role.equals(null)).isFalse();
        assertThat(role.equals(new Object())).isFalse();
    }

    @Test
    @DisplayName("EventType entity: getters, setters, constructores, equals, hashCode y toString")
    void testEventTypeEntity() {
        EventType eventType = new EventType((short) 1, "USER_REGISTERED", "Registro de usuario");
        assertThat(eventType.getId()).isEqualTo((short) 1);
        assertThat(eventType.getCode()).isEqualTo("USER_REGISTERED");
        assertThat(eventType.getDescription()).isEqualTo("Registro de usuario");

        EventType eventType2 = new EventType("USER_REGISTERED", "Registro");
        assertThat(eventType).isEqualTo(eventType2);
        assertThat(eventType.hashCode()).isEqualTo(eventType2.hashCode());
        assertThat(eventType.toString()).contains("USER_REGISTERED");

        EventType eventDefault = new EventType();
        eventDefault.setId((short) 2);
        eventDefault.setCode("LOGIN_SUCCESS");
        eventDefault.setDescription("Login exitoso");
        assertThat(eventDefault.getId()).isEqualTo((short) 2);
        assertThat(eventType).isNotEqualTo(eventDefault);
        assertThat(eventType.equals(null)).isFalse();
        assertThat(eventType.equals(new Object())).isFalse();
    }

    @Test
    @DisplayName("Log entity: getters, setters, constructores y PrePersist")
    void testLogEntity() {
        EventType eventType = new EventType((short) 1, "USER_REGISTERED", "Registro de usuario");
        OffsetDateTime now = OffsetDateTime.now();

        Log log = new Log(eventType, 10, 20, 30, now, "Log description");
        log.setId(100L);

        assertThat(log.getId()).isEqualTo(100L);
        assertThat(log.getEventType()).isEqualTo(eventType);
        assertThat(log.getUserId()).isEqualTo(10);
        assertThat(log.getBatchId()).isEqualTo(20);
        assertThat(log.getEvaluationId()).isEqualTo(30);
        assertThat(log.getOccurredAt()).isEqualTo(now);
        assertThat(log.getDescription()).isEqualTo("Log description");

        Log defaultLog = new Log();
        defaultLog.setEventType(eventType);
        defaultLog.setUserId(5);
        defaultLog.setBatchId(6);
        defaultLog.setEvaluationId(7);
        defaultLog.setDescription("Desc");
        defaultLog.setOccurredAt(now);
        assertThat(defaultLog.getUserId()).isEqualTo(5);

        Log prePersistLog = new Log();
        prePersistLog.onPersist();
        assertThat(prePersistLog.getOccurredAt()).isNotNull();

        Log fiveArgLog = new Log(null, 10, 20, 30, "Evento de auditoría");
        assertThat(fiveArgLog.getUserId()).isEqualTo(10);
        assertThat(fiveArgLog.getBatchId()).isEqualTo(20);
        assertThat(fiveArgLog.getEvaluationId()).isEqualTo(30);
        assertThat(fiveArgLog.getDescription()).isEqualTo("Evento de auditoría");
        assertThat(fiveArgLog.getOccurredAt()).isNotNull();
    }

    @Test
    @DisplayName("User entity: getters, setters, constructores y PrePersist/PreUpdate")
    void testUserEntity() {
        Role role = new Role((short) 2, "PISCICULTOR");
        OffsetDateTime now = OffsetDateTime.now();

        User user = new User(1, role, "Juan", "Perez", "juan@correo.com", "3101234567",
                "hash", "salt", true, false, null, null, now, now);

        assertThat(user.getId()).isEqualTo(1);
        assertThat(user.getRole()).isEqualTo(role);
        assertThat(user.getFirstName()).isEqualTo("Juan");
        assertThat(user.getLastName()).isEqualTo("Perez");
        assertThat(user.getEmail()).isEqualTo("juan@correo.com");
        assertThat(user.getPhone()).isEqualTo("3101234567");
        assertThat(user.getPasswordHash()).isEqualTo("hash");
        assertThat(user.getSalt()).isEqualTo("salt");
        assertThat(user.isActive()).isTrue();
        assertThat(user.isDeleted()).isFalse();
        assertThat(user.getDeletedAt()).isNull();
        assertThat(user.getDeletedBy()).isNull();
        assertThat(user.getCreatedAt()).isEqualTo(now);
        assertThat(user.getUpdatedAt()).isEqualTo(now);

        User defaultUser = new User();
        defaultUser.setId(2);
        defaultUser.setRole(role);
        defaultUser.setFirstName("Maria");
        defaultUser.setLastName("Gomez");
        defaultUser.setEmail("maria@correo.com");
        defaultUser.setPhone("3201234567");
        defaultUser.setPasswordHash("h2");
        defaultUser.setSalt("s2");
        defaultUser.setActive(false);
        defaultUser.setDeleted(true);
        defaultUser.setDeletedAt(now);
        defaultUser.setDeletedBy(1);

        defaultUser.onCreate();
        assertThat(defaultUser.getCreatedAt()).isNotNull();
        assertThat(defaultUser.getUpdatedAt()).isNotNull();

        defaultUser.onUpdate();
        assertThat(defaultUser.getUpdatedAt()).isNotNull();

        user.softDelete(1);
        assertThat(user.isDeleted()).isTrue();
        assertThat(user.isActive()).isFalse();
        assertThat(user.getDeletedAt()).isNotNull();
        assertThat(user.getDeletedBy()).isEqualTo(1);
    }

    @Test
    @DisplayName("Batch entity: estados, markReported, revertToEvaluated, expandSample y softDelete")
    void testBatchDomainMethods() {
        Role role = new Role((short) 2, "PISCICULTOR");
        User owner = new User(role, "Carlos", "Pérez", "carlos@correo.com", "3101234567", "hash", "salt");
        BatchStatus open = new BatchStatus((short) 1, BatchStatus.OPEN);
        BatchStatus inEvaluation = new BatchStatus((short) 2, BatchStatus.IN_EVALUATION);
        BatchStatus evaluated = new BatchStatus((short) 3, BatchStatus.EVALUATED);
        BatchStatus reported = new BatchStatus((short) 4, BatchStatus.REPORTED);

        Batch batch = new Batch("SECCT-20261020-001", LocalDate.of(2026, 10, 20),
                new BigDecimal("100.00"), 10, "Estanque 1", owner, open);

        assertThat(batch.isEvaluated()).isFalse();
        assertThat(batch.canBeReported()).isFalse();
        assertThat(batch.isReported()).isFalse();

        assertThatThrownBy(() -> batch.markReported(reported))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(409);

        assertThatThrownBy(() -> batch.expandSample(2, inEvaluation))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(409);

        batch.startEvaluation(inEvaluation);
        batch.close(new BigDecimal("3.75"), evaluated);
        assertThat(batch.isEvaluated()).isTrue();
        assertThat(batch.canBeReported()).isTrue();
        assertThat(batch.isReported()).isFalse();

        batch.markReported(reported);
        assertThat(batch.isEvaluated()).isTrue();
        assertThat(batch.canBeReported()).isFalse();
        assertThat(batch.isReported()).isTrue();

        assertThatThrownBy(() -> batch.expandSample(0, inEvaluation))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(400);

        assertThatThrownBy(() -> batch.expandSample(491, inEvaluation))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(400);

        batch.expandSample(5, inEvaluation);
        assertThat(batch.getSampleUnitCount()).isEqualTo(15);
        assertThat(batch.getStatus()).isEqualTo(inEvaluation);
        assertThat(batch.getFinalClassification()).isNull();

        batch.revertToEvaluated(evaluated);
        assertThat(batch.getStatus()).isEqualTo(evaluated);

        batch.softDelete(99);
        assertThat(batch.isDeleted()).isTrue();
        assertThat(batch.getDeletedAt()).isNotNull();
        assertThat(batch.getDeletedBy()).isEqualTo(99);
    }

    @Test
    @DisplayName("Report entity y ReportStatistics: constructor, serialización JSON, markAsPrevious y softDelete")
    void testReportEntityAndStatistics() {
        Role role = new Role((short) 2, "PISCICULTOR");
        User owner = new User(role, "Carlos", "Pérez", "carlos@correo.com", "3101234567", "hash", "salt");
        BatchStatus evaluated = new BatchStatus((short) 3, BatchStatus.EVALUATED);
        Batch batch = new Batch("SECCT-20261020-001", LocalDate.of(2026, 10, 20),
                new BigDecimal("100.00"), 3, "Notas", owner, evaluated);

        ReportStatistics stats = new ReportStatistics(
                3L,
                new BigDecimal("3.67"),
                new BigDecimal("4.00"),
                new BigDecimal("3.33"),
                Map.of((short) 1, 0L, (short) 2, 0L, (short) 3, 1L, (short) 4, 2L, (short) 5, 0L)
        );

        Report report = new Report(batch, 1, stats);
        ReflectionTestUtils.setField(report, "id", 7);

        assertThat(report.getId()).isEqualTo(7);
        assertThat(report.getBatch()).isEqualTo(batch);
        assertThat(report.getVersion()).isEqualTo(1);
        assertThat(report.isCurrent()).isTrue();
        assertThat(report.getFinalClassification()).isEqualTo(new BigDecimal("3.67"));
        assertThat(report.getEvaluationCount()).isEqualTo(3);
        assertThat(report.getGeneratedAt()).isNotNull();
        assertThat(report.isDeleted()).isFalse();

        ReportStatistics restored = ReportStatistics.fromJson(report.getStatistics());
        assertThat(restored.evaluationCount()).isEqualTo(3L);
        assertThat(restored.finalClassification()).isEqualByComparingTo("3.67");
        assertThat(restored.countByCategory().get((short) 4)).isEqualTo(2L);

        report.markAsPrevious();
        assertThat(report.isCurrent()).isFalse();

        report.softDelete(42);
        assertThat(report.isCurrent()).isFalse();
        assertThat(report.isDeleted()).isTrue();
        assertThat(report.getDeletedAt()).isNotNull();
        assertThat(report.getDeletedBy()).isEqualTo(42);

        report.onCreate();
        report.onUpdate();
        assertThat(report.getCreatedAt()).isNotNull();
        assertThat(report.getUpdatedAt()).isNotNull();
    }
}
