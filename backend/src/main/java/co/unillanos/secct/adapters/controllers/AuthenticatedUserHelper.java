package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.exceptions.BusinessException;
import org.springframework.security.core.context.SecurityContextHolder;

/** Shared helper for extracting the authenticated user ID from Spring SecurityContext. */
final class AuthenticatedUserHelper {

    private AuthenticatedUserHelper() {
    }

    static Integer getAuthenticatedUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new BusinessException("Usuario no autenticado", 401);
        }
        if (auth.getPrincipal() instanceof Integer id) {
            return id;
        }
        try {
            return Integer.valueOf(auth.getName());
        } catch (NumberFormatException e) {
            throw new BusinessException("Usuario no autenticado", 401);
        }
    }
}
