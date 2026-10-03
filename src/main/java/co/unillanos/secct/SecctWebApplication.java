package co.unillanos.secct;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SecctWebApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecctWebApplication.class, args);
        System.out.println("¡El sistema web está funcionando en http://localhost:8080 !");
    }
}