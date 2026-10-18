package co.unillanos.secct.entities;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

public final class PesoLote {

    public static final String MINIMO_TEXTO = "0.01";
    public static final String MAXIMO_TEXTO = "10000.00";
    public static final int MAX_DECIMALES = 2;

    private static final BigDecimal MINIMO = new BigDecimal(MINIMO_TEXTO);
    private static final BigDecimal MAXIMO = new BigDecimal(MAXIMO_TEXTO);

    private final BigDecimal valor;

    public PesoLote(BigDecimal valor) {
        if (valor == null) {
            throw new IllegalArgumentException(
                    "El peso del lote no puede ser nulo (RN-004).");
        }
        if (valor.stripTrailingZeros().scale() > MAX_DECIMALES) {
            throw new IllegalArgumentException(
                    "El peso del lote admite máximo " + MAX_DECIMALES
                            + " decimales (RN-004); valor recibido: " + valor.toPlainString());
        }
        BigDecimal normalizado = valor.setScale(MAX_DECIMALES, RoundingMode.UNNECESSARY);
        if (normalizado.compareTo(MINIMO) < 0) {
            throw new IllegalArgumentException(
                    "El peso del lote debe ser mayor o igual a 0.01 kg (RN-004); valor recibido: " + valor);
        }
        if (normalizado.compareTo(MAXIMO) > 0) {
            throw new IllegalArgumentException(
                    "El peso del lote no puede superar " + MAXIMO_TEXTO
                            + " kg (RN-004); valor recibido: " + valor.toPlainString());
        }
        this.valor = normalizado;
    }

    public BigDecimal getValor() {
        return valor;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PesoLote)) return false;
        PesoLote that = (PesoLote) o;
        return Objects.equals(valor, that.valor);
    }

    @Override
    public int hashCode() {
        return Objects.hash(valor);
    }

    @Override
    public String toString() {
        return valor.toPlainString() + " kg";
    }
}
