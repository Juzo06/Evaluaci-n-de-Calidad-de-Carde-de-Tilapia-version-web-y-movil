package co.unillanos.secct.entities;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Lote {

    public static final int MIN_UNIDADES_MUESTRA = 1;
    public static final int MAX_UNIDADES_MUESTRA = 500;
    public static final int MAX_OBSERVACIONES = 500;
    public static final int MAX_PISCICULTOR_ID = 100;

    private final CodigoLote codigo;
    private final String piscicultorId;
    private final FechaCaptura fechaCaptura;
    private final PesoLote pesoLote;
    private int numeroUnidadesMuestra;
    private final PuntoEvaluacion puntoEvaluacion;
    private EstadoLote estado;
    private final String observaciones;
    private final List<Evaluacion> evaluaciones;
    private double clasificacionFinal;

    /**
     * Constructor anterior a HU03 (lote sin piscicultor propietario).
     *
     * @deprecated Los lotes nuevos deben crearse con {@link #nuevo}, que exige
     *             el piscicultor propietario. Se conserva solo para no romper
     *             los tests existentes.
     */
    @Deprecated
    public Lote(CodigoLote codigo,
                FechaCaptura fechaCaptura,
                PesoLote pesoLote,
                int numeroUnidadesMuestra,
                PuntoEvaluacion puntoEvaluacion,
                String observaciones) {
        this(codigo, null, fechaCaptura, pesoLote,
                numeroUnidadesMuestra, puntoEvaluacion, observaciones);
    }

    /**
     * Crea un lote nuevo (HU03): nace ABIERTO y asociado a su piscicultor.
     */
    public static Lote nuevo(CodigoLote codigo,
                             String piscicultorId,
                             FechaCaptura fechaCaptura,
                             PesoLote pesoLote,
                             int numeroUnidadesMuestra,
                             PuntoEvaluacion puntoEvaluacion,
                             String observaciones) {
        if (piscicultorId == null || piscicultorId.isBlank()) {
            throw new IllegalArgumentException(
                    "El piscicultor propietario del lote es obligatorio.");
        }
        if (piscicultorId.trim().length() > MAX_PISCICULTOR_ID) {
            throw new IllegalArgumentException(
                    "El identificador del piscicultor no puede superar "
                            + MAX_PISCICULTOR_ID + " caracteres.");
        }
        return new Lote(codigo, piscicultorId.trim(), fechaCaptura,
                pesoLote, numeroUnidadesMuestra, puntoEvaluacion, observaciones);
    }

    private Lote(CodigoLote codigo,
                 String piscicultorId,
                 FechaCaptura fechaCaptura,
                 PesoLote pesoLote,
                 int numeroUnidadesMuestra,
                 PuntoEvaluacion puntoEvaluacion,
                 String observaciones) {

        if (codigo == null) {
            throw new IllegalArgumentException(
                    "El código del lote no puede ser nulo (RN-001).");
        }
        if (fechaCaptura == null) {
            throw new IllegalArgumentException(
                    "La fecha de captura es obligatoria (RN-003).");
        }
        if (pesoLote == null) {
            throw new IllegalArgumentException(
                    "El peso del lote es obligatorio (RN-004).");
        }
        if (numeroUnidadesMuestra < 1) {
            throw new IllegalArgumentException(
                    "El número de unidades de muestra debe ser ≥ 1 (RN-005); valor recibido: "
                            + numeroUnidadesMuestra);
        }
        if (numeroUnidadesMuestra > MAX_UNIDADES_MUESTRA) {
            throw new IllegalArgumentException(
                    "El número de unidades de muestra no puede superar " + MAX_UNIDADES_MUESTRA
                            + " (RN-005); valor recibido: " + numeroUnidadesMuestra);
        }
        if (puntoEvaluacion == null) {
            throw new IllegalArgumentException(
                    "El punto de evaluación es obligatorio (RN-006).");
        }
        String obs = (observaciones != null) ? observaciones : "";
        if (obs.length() > MAX_OBSERVACIONES) {
            throw new IllegalArgumentException(
                    "Las observaciones no pueden superar " + MAX_OBSERVACIONES
                            + " caracteres (RN-008); longitud recibida: " + obs.length());
        }

        this.codigo = codigo;
        this.piscicultorId = piscicultorId;
        this.fechaCaptura = fechaCaptura;
        this.pesoLote = pesoLote;
        this.numeroUnidadesMuestra = numeroUnidadesMuestra;
        this.puntoEvaluacion = puntoEvaluacion;
        this.estado = EstadoLote.ABIERTO;
        this.observaciones = obs;
        this.evaluaciones = new ArrayList<Evaluacion>();
        this.clasificacionFinal = 0.0;
    }

    /** Evaluación ya guardada, usada solo para reconstruir un lote desde persistencia. */
    public record EvaluacionGuardada(String idImagen, int clasificacion) { }

    /**
     * Reconstruye un lote ya persistido, conservando su estado y evaluaciones.
     * Lo usa únicamente el adaptador de persistencia; no valida el estado
     * porque los datos ya fueron validados cuando el lote se registró.
     */
    public static Lote reconstruir(CodigoLote codigo,
                                   String piscicultorId,
                                   FechaCaptura fechaCaptura,
                                   PesoLote pesoLote,
                                   int numeroUnidadesMuestra,
                                   PuntoEvaluacion puntoEvaluacion,
                                   String observaciones,
                                   EstadoLote estado,
                                   List<EvaluacionGuardada> evaluaciones,
                                   double clasificacionFinal) {
        Lote lote = new Lote(codigo, piscicultorId, fechaCaptura, pesoLote,
                numeroUnidadesMuestra, puntoEvaluacion, observaciones);
        for (EvaluacionGuardada e : evaluaciones) {
            lote.evaluaciones.add(new Evaluacion(e.idImagen(), e.clasificacion(), lote));
        }
        lote.estado = estado;
        lote.clasificacionFinal = clasificacionFinal;
        return lote;
    }

    public boolean estaEvaluado() {
        return estado == EstadoLote.EVALUADO;
    }

    public void reportarEvaluacion() {
        if (!estaEvaluado()) {
            throw new IllegalStateException(
                    "El lote '" + codigo.getValor()
                            + "' debe estar en estado EVALUADO para reportar la evaluación (RN-020); estado actual: "
                            + estado);
        }
        double suma = 0.0;
        for (Evaluacion e : evaluaciones) {
            suma += e.getClasificacion();
        }
        this.clasificacionFinal = suma / evaluaciones.size();
        this.estado = EstadoLote.REPORTADO;
    }

    public void registrarEvaluacion(Evaluacion evaluacion) {
        if (evaluacion == null) {
            throw new IllegalArgumentException(
                    "La evaluacion a registrar no puede ser null.");
        }
        if (estado == EstadoLote.EVALUADO || estado == EstadoLote.REPORTADO) {
            throw new IllegalStateException(
                    "El lote '" + codigo.getValor()
                            + "' no acepta nuevas evaluaciones en estado "
                            + estado + " (RN-012).");
        }

        boolean esPrimeraEvaluacion = evaluaciones.isEmpty();
        evaluaciones.add(evaluacion);

        if (esPrimeraEvaluacion && estado == EstadoLote.ABIERTO) {
            estado = EstadoLote.EN_EVALUACION;
        }
        if (evaluaciones.size() == numeroUnidadesMuestra) {
            estado = EstadoLote.EVALUADO;
        }
    }

    public int cantidadEvaluaciones() {
        return evaluaciones.size();
    }

    public boolean estaDisponible() {
        boolean bajoQuota = evaluaciones.size() < numeroUnidadesMuestra;
        boolean estadoAceptable =
                estado == EstadoLote.ABIERTO || estado == EstadoLote.EN_EVALUACION;
        return bajoQuota && estadoAceptable;
    }

    public String getId() {
        return codigo.getValor();
    }

    public CodigoLote getCodigo() {
        return codigo;
    }

    public String getPiscicultorId() {
        return piscicultorId;
    }

    public FechaCaptura getFechaCaptura() {
        return fechaCaptura;
    }

    public PesoLote getPesoLote() {
        return pesoLote;
    }

    public int getNumeroUnidadesMuestra() {
        return numeroUnidadesMuestra;
    }

    public PuntoEvaluacion getPuntoEvaluacion() {
        return puntoEvaluacion;
    }

    public EstadoLote getEstado() {
        return estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public List<Evaluacion> getEvaluaciones() {
        return Collections.unmodifiableList(evaluaciones);
    }

    public double getClasificacionFinal() {
        return clasificacionFinal;
    }
}
