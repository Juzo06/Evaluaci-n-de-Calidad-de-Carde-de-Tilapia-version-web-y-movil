package co.unillanos.secct.infrastructure.repositories.config;

import co.unillanos.secct.infrastructure.repositories.ClasificadorCnnHttp;
import co.unillanos.secct.infrastructure.repositories.GeneradorCodigoLoteJdbc;
import co.unillanos.secct.infrastructure.repositories.LogLoteAdapter;
import co.unillanos.secct.infrastructure.repositories.jpa.EstadoLoteJpaRepository;
import co.unillanos.secct.infrastructure.repositories.jpa.LoteJpaRepository;
import co.unillanos.secct.infrastructure.repositories.jpa.LoteRepositoryJpa;
import co.unillanos.secct.usecases.ports.ClasificadorCnnPort;
import co.unillanos.secct.usecases.ports.GeneradorCodigoLotePort;
import co.unillanos.secct.usecases.ports.LogLotePort;
import co.unillanos.secct.usecases.ports.LoteRepository;
import co.unillanos.secct.usecases.services.SecctApp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;


@Configuration
public class BeanConfig {

    @Bean
    public LoteRepository loteRepository(LoteJpaRepository lotes,
                                         EstadoLoteJpaRepository estados) {
        return new LoteRepositoryJpa(lotes, estados);
    }

    @Bean
    public ClasificadorCnnPort clasificador(@Value("${secct.cnn.url}") String url) {
        return new ClasificadorCnnHttp(url);
    }

    @Bean
    public GeneradorCodigoLotePort generadorCodigo(JdbcTemplate jdbcTemplate) {
        return new GeneradorCodigoLoteJdbc(jdbcTemplate);
    }

    @Bean
    public LogLotePort logLote(JdbcTemplate jdbcTemplate) {
        return new LogLoteAdapter(jdbcTemplate);
    }

    @Bean
    public SecctApp secctApp(LoteRepository repo,
                             ClasificadorCnnPort cnn,
                             GeneradorCodigoLotePort generador,
                             LogLotePort logLote) {
        return new SecctApp(repo, cnn, generador, logLote);
    }
}
