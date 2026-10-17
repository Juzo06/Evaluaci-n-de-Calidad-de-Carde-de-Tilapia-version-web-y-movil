package co.unillanos.secct;

import org.springframework.boot.SpringApplication;

public class TestSecctApplication {

	public static void main(String[] args) {
		SpringApplication.from(SecctApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
