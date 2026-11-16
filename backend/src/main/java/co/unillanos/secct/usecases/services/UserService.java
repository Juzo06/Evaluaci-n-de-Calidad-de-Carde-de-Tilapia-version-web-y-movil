package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.Batch;
import co.unillanos.secct.entities.Report;
import co.unillanos.secct.entities.Role;
import co.unillanos.secct.entities.User;
import co.unillanos.secct.infrastructure.repositories.BatchRepository;
import co.unillanos.secct.infrastructure.repositories.ReportRepository;
import co.unillanos.secct.infrastructure.repositories.RoleRepository;
import co.unillanos.secct.infrastructure.repositories.UserRepository;
import co.unillanos.secct.usecases.dto.DeleteAccountRequestDTO;
import co.unillanos.secct.usecases.dto.RegisterUserRequestDTO;
import co.unillanos.secct.usecases.dto.RegisterUserResponseDTO;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Service orchestrating HU-01 user registration and HU-08 account deletion.
 */
@Service
public class UserService {

    private static final String DEFAULT_ROLE_CODE = "PISCICULTOR";
    private static final String USER_REGISTERED_EVENT = "USER_REGISTERED";
    private static final String USER_DELETED_EVENT = "USER_DELETED";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BatchRepository batchRepository;
    private final ReportRepository reportRepository;
    private final PasswordService passwordService;
    private final LogService logService;

    @Autowired
    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       BatchRepository batchRepository,
                       ReportRepository reportRepository,
                       PasswordService passwordService,
                       LogService logService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.batchRepository = batchRepository;
        this.reportRepository = reportRepository;
        this.passwordService = passwordService;
        this.logService = logService;
    }

    /**
     * Normalizes an email by trimming leading/trailing spaces and lowercasing with Locale.ROOT (PU-09, PL-1.17).
     */
    public String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Registers a new piscicultor user enforcing business rules PL-1.01 to PL-1.26.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RegisterUserResponseDTO register(RegisterUserRequestDTO request) {
        if (request == null) {
            throw new BusinessException("La solicitud de registro no puede ser nula", 400);
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        validateBusinessRules(request, normalizedEmail);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("correo ya registrado", 409);
        }

        // PQ-07: Always assign PISCICULTOR role regardless of any external attempt to inject a role
        Role role = roleRepository.findByCode(DEFAULT_ROLE_CODE)
                .orElseThrow(() -> new BusinessException("Rol " + DEFAULT_ROLE_CODE + " no configurado", 500));

        String salt = passwordService.generateSalt();
        String passwordHash = passwordService.hashPassword(request.getPassword(), salt);

        User user = new User();
        user.setRole(role);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.getPhone().trim());
        user.setPasswordHash(passwordHash);
        user.setSalt(salt);
        user.setActive(true);
        user.setDeleted(false);

        User savedUser = userRepository.save(user);

        // PL-1.26: Audit trail recording with masked description
        String auditDescription = "Registro de usuario con correo " + normalizedEmail + " y teléfono " + user.getPhone();
        logService.recordEvent(USER_REGISTERED_EVENT, savedUser.getId(), null, null, auditDescription);

        return RegisterUserResponseDTO.from(savedUser);
    }

    /**
     * HU-08: Verifies the user's password and logically deletes their batches, reports, and account (DS-HU8).
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void deleteAccount(Integer userId, DeleteAccountRequestDTO request) {
        if (userId == null) {
            throw new BusinessException("Usuario no autenticado", 401);
        }

        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado", 404));

        String rawPassword = request != null ? request.getPassword() : null;
        if (rawPassword == null || rawPassword.isBlank()
                || !passwordService.verifyPassword(rawPassword, user.getSalt(), user.getPasswordHash())) {
            throw new BusinessException("Contraseña incorrecta", 403);
        }

        List<Batch> batches = batchRepository.findByOwnerIdAndIsDeletedFalse(userId);
        if (!batches.isEmpty()) {
            for (Batch batch : batches) {
                batch.softDelete(userId);
            }
            batchRepository.saveAll(batches);
        }

        List<Report> reports = reportRepository.findByBatchOwnerIdAndIsDeletedFalse(userId);
        if (!reports.isEmpty()) {
            for (Report report : reports) {
                report.softDelete(userId);
            }
            reportRepository.saveAll(reports);
        }

        user.softDelete(userId);
        userRepository.save(user);

        logService.recordEvent(USER_DELETED_EVENT, userId, null, null,
                "Eliminación lógica de cuenta para " + user.getEmail());
    }

    private void validateBusinessRules(RegisterUserRequestDTO request, String normalizedEmail) {
        if (request.getFirstName() == null || !request.getFirstName().matches("^(?!\\s+$)[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]{2,50}$")) {
            throw new BusinessException("Nombre inválido: debe tener entre 2 y 50 letras y espacios", 400);
        }
        if (request.getLastName() == null || !request.getLastName().matches("^(?!\\s+$)[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]{2,50}$")) {
            throw new BusinessException("Apellido inválido: debe tener entre 2 y 50 letras y espacios", 400);
        }
        if (request.getPhone() == null || !request.getPhone().matches("^3[0-9]{9}$")) {
            throw new BusinessException("Teléfono inválido: debe tener 10 dígitos e iniciar en 3", 400);
        }
        if (request.getPassword() == null || request.getPassword().length() < 8 || request.getPassword().length() > 20
                || request.getPassword().trim().isEmpty()) {
            throw new BusinessException("Contraseña inválida: debe tener entre 8 y 20 caracteres y no consistir solo de espacios", 400);
        }
        if (normalizedEmail == null || normalizedEmail.isEmpty()
                || !normalizedEmail.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
            throw new BusinessException("Correo electrónico no válido", 400);
        }
    }
}
