package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.DeleteAccountRequestDTO;
import co.unillanos.secct.usecases.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Authenticated user account endpoints for HU-08 (DC-HU8, DS-HU8). */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/me/delete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@Valid @RequestBody DeleteAccountRequestDTO request) {
        Integer userId = AuthenticatedUserHelper.getAuthenticatedUserId();
        userService.deleteAccount(userId, request);
    }
}
