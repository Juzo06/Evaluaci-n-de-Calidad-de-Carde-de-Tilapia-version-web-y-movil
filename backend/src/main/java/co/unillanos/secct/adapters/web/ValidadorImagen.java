package co.unillanos.secct.adapters.web;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Component
public class ValidadorImagen {

    private static final long MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    public void validar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar un archivo de imagen.");
        }

        if (archivo.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo permitido de 5 MB.");
        }

        try (InputStream is = archivo.getInputStream()) {
            byte[] header = new byte[8];
            int read = is.read(header, 0, 8);
            if (read < 8) {
                throw new IllegalArgumentException("El archivo está dañado o está vacío.");
            }

            boolean esJpg = (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF);
            boolean esPng = (header[0] == (byte) 0x89 && header[1] == (byte) 0x50 &&
                             header[2] == (byte) 0x4E && header[3] == (byte) 0x47);

            if (!esJpg && !esPng) {
                throw new IllegalArgumentException("Formato no soportado. Debe ser una imagen JPG o PNG válida.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo leer el contenido de la imagen.");
        }
    }
}