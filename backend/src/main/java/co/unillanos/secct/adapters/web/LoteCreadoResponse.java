package co.unillanos.secct.adapters.web;

/** Respuesta del POST /api/lotes: el código que generó el sistema y el estado inicial. */
public record LoteCreadoResponse(String codigo, String estado, String mensaje) { }
