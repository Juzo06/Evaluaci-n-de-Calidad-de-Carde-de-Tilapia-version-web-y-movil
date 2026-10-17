package co.unillanos.secct.infrastructure.config;

import co.unillanos.secct.infrastructure.repositories.ClasificadorCnnHttp;
import co.unillanos.secct.infrastructure.repositories.GeneradorCodigoLoteSecuencial;
import co.unillanos.secct.infrastructure.repositories.InMemoryLoteRepository;
import co.unillanos.secct.usecases.ports.ClasificadorCnnPort;
import co.unillanos.secct.usecases.ports.GeneradorCodigoLotePort;
import co.unillanos.secct.usecases.ports.LoteRepository;
import co.unillanos.secct.usecases.services.SecctApp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanConfig {

    @Bean
    public LoteRepository loteRepository() {
        return new InMemoryLoteRepository(); // temporal: lo reemplaza el repositorio JPA
    }

    @Bean
    public ClasificadorCnnPort clasificador(@Value("${secct.cnn.url}") String url) {
        return new ClasificadorCnnHttp(url);
    }

    @Bean
    public GeneradorCodigoLotePort generadorCodigo() {
        return new GeneradorCodigoLoteSecuencial();
    }

    @Bean
    public SecctApp secctApp(LoteRepository repo,
                             ClasificadorCnnPort cnn,
                             GeneradorCodigoLotePort generador) {
        return new SecctApp(repo, cnn, generador);
    }
}