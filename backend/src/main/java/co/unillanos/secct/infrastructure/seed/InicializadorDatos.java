package co.unillanos.secct.infrastructure.seed;
import co.unillanos.secct.usecases.dto.DatosNuevoLote;
import co.unillanos.secct.usecases.services.SecctApp;

import java.math.BigDecimal;
import java.time.LocalDate;


public class InicializadorDatos {

    private final SecctApp app;

    public InicializadorDatos(SecctApp app) {
        this.app = app;
    }

    public void cargar() {
        app.registrarLote(new DatosNuevoLote(
                "piscicultor-demo",
                "Estacion Piscicola Meta",
                LocalDate.of(2025, 5, 24),
                new BigDecimal("120.50"),
                15,
                "ESTACION_PISCICOLA",
                ""));
        app.registrarLote(new DatosNuevoLote(
                "piscicultor-demo",
                "Estacion Piscicola Meta",
                LocalDate.of(2025, 5, 23),
                new BigDecimal("85.00"),
                10,
                "ESTACION_PISCICOLA",
                ""));
    }
}
