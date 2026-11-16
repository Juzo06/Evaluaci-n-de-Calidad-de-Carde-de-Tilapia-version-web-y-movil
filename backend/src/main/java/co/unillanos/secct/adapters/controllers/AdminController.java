package co.unillanos.secct.adapters.controllers;

import co.unillanos.secct.usecases.dto.SystemInfoResponseDTO;
import co.unillanos.secct.usecases.services.SystemInfoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Administrator endpoints for HU-07 system monitoring (DC-HU7, DS-HU7). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SystemInfoService systemInfoService;

    public AdminController(SystemInfoService systemInfoService) {
        this.systemInfoService = systemInfoService;
    }

    @GetMapping("/system-info")
    public SystemInfoResponseDTO getSystemInfo() {
        Integer adminId = AuthenticatedUserHelper.getAuthenticatedUserId();
        return systemInfoService.getSystemInfo(adminId);
    }
}
