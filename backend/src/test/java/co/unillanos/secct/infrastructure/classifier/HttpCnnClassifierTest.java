package co.unillanos.secct.infrastructure.classifier;

import co.unillanos.secct.usecases.dto.ClassificationResult;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class HttpCnnClassifierTest {

    private static final byte[] JPEG_SAMPLE = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x10};
    private static final byte[] PNG_SAMPLE = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final Gson gson = new Gson();
    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("classify envia header x-goog-api-key, detecta MIME JPEG/PNG y desempaqueta sobre Gemini")
    void classifySupportsGeminiEnvelopeAndDetectsMimeTypes() throws IOException {
        AtomicReference<String> capturedApiKey = new AtomicReference<>();
        AtomicReference<String> capturedPath = new AtomicReference<>();
        AtomicReference<String> capturedBody = new AtomicReference<>();

        String geminiEnvelope = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"partes\\":[{\\"parte\\":\\"OJO\\",\\"categoria_ntc\\":5,\\"confianza\\":0.94},{\\"parte\\":\\"PIEL\\",\\"categoria_ntc\\":4,\\"confianza\\":0.89}]}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        String endpointUrl = startMockServer("/v1beta/models/gemini-2.5-flash:generateContent", 200,
                geminiEnvelope, capturedApiKey, capturedPath, capturedBody);

        HttpCnnClassifier classifier = new HttpCnnClassifier(endpointUrl, "secret-gemini-key");

        List<ClassificationResult> jpegResults = classifier.classify(JPEG_SAMPLE);
        assertEquals(2, jpegResults.size());
        assertEquals("OJO", jpegResults.get(0).fishPartCode);
        assertEquals((short) 5, jpegResults.get(0).ntcCategory);
        assertEquals(new BigDecimal("0.94"), jpegResults.get(0).confidence);
        assertEquals("PIEL", jpegResults.get(1).fishPartCode);
        assertEquals((short) 4, jpegResults.get(1).ntcCategory);
        assertEquals("secret-gemini-key", capturedApiKey.get());
        assertEquals("/v1beta/models/gemini-2.5-flash:generateContent", capturedPath.get());
        assertEquals("image/jpeg", extractInlineMimeType(capturedBody.get()));

        List<ClassificationResult> pngResults = classifier.classify(PNG_SAMPLE);
        assertEquals(2, pngResults.size());
        assertEquals("image/png", extractInlineMimeType(capturedBody.get()));
    }

    @Test
    @DisplayName("classify acepta formato directo legacy sin sobre Gemini")
    void classifySupportsDirectPartesFormat() throws IOException {
        AtomicReference<String> capturedApiKey = new AtomicReference<>();
        AtomicReference<String> capturedPath = new AtomicReference<>();
        AtomicReference<String> capturedBody = new AtomicReference<>();

        String directBody = """
                {
                  "partes": [
                    { "parte": "OJO", "categoria_ntc": 3, "confianza": 0.80 },
                    { "parte": "PIEL", "categoria_ntc": 4, "confianza": 0.91 }
                  ]
                }
                """;

        String baseUrl = startMockServer("/evaluar", 200, directBody,
                capturedApiKey, capturedPath, capturedBody);

        HttpCnnClassifier classifier = new HttpCnnClassifier(baseUrl);
        List<ClassificationResult> results = classifier.classify(JPEG_SAMPLE);

        assertNull(capturedApiKey.get());
        assertEquals("/evaluar", capturedPath.get());
        assertEquals(2, results.size());
        assertEquals((short) 3, results.get(0).ntcCategory);
        assertEquals((short) 4, results.get(1).ntcCategory);
    }

    @Test
    @DisplayName("classify lanza BusinessException 503 cuando la imagen no corresponde a tilapia (partes vacio)")
    void classifyRejectsNonTilapiaEmptyPartesWith503() throws IOException {
        String emptyGemini = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          { "text": "{\\"partes\\": []}" }
                        ]
                      }
                    }
                  ]
                }
                """;

        String endpointUrl = startMockServer("/v1beta/models/gemini-2.5-flash:generateContent", 200,
                emptyGemini, new AtomicReference<>(), new AtomicReference<>(), new AtomicReference<>());

        HttpCnnClassifier classifier = new HttpCnnClassifier(endpointUrl, "key");
        BusinessException geminiEx = assertThrows(BusinessException.class, () -> classifier.classify(JPEG_SAMPLE));
        assertEquals(503, geminiEx.getHttpStatus());

        HttpCnnClassifier directClassifier = new HttpCnnClassifier("http://localhost");
        BusinessException directEx = assertThrows(BusinessException.class,
                () -> directClassifier.parseResults("{\"partes\": []}"));
        assertEquals(503, directEx.getHttpStatus());
    }

    @Test
    @DisplayName("parseResults lanza BusinessException 503 ante categorias, confianzas o partes invalidas")
    void parseResultsRejectsOutOfRangeAndInvalidParts() {
        HttpCnnClassifier classifier = new HttpCnnClassifier("http://localhost");

        String categoryZero = """
                {"partes":[{"parte":"OJO","categoria_ntc":0,"confianza":0.9},{"parte":"PIEL","categoria_ntc":3,"confianza":0.8}]}
                """;
        String categorySix = """
                {"partes":[{"parte":"OJO","categoria_ntc":6,"confianza":0.9},{"parte":"PIEL","categoria_ntc":3,"confianza":0.8}]}
                """;
        String confidenceOverOne = """
                {"partes":[{"parte":"OJO","categoria_ntc":4,"confianza":1.05},{"parte":"PIEL","categoria_ntc":3,"confianza":0.8}]}
                """;
        String duplicatePart = """
                {"partes":[{"parte":"OJO","categoria_ntc":4,"confianza":0.9},{"parte":"OJO","categoria_ntc":3,"confianza":0.8}]}
                """;
        String missingPart = """
                {"partes":[{"parte":"OJO","categoria_ntc":4,"confianza":0.9}]}
                """;

        for (String invalid : List.of(categoryZero, categorySix, confidenceOverOne, duplicatePart, missingPart)) {
            BusinessException ex = assertThrows(BusinessException.class, () -> classifier.parseResults(invalid));
            assertEquals(503, ex.getHttpStatus());
        }
    }

    @Test
    @DisplayName("classify lanza BusinessException 503 ante errores HTTP 400/500 o JSON corrupto")
    void classifyRejectsHttpErrorsAndCorruptedJson() throws IOException {
        String errorUrl = startMockServer("/evaluar", 500, "{\"error\":\"internal\"}",
                new AtomicReference<>(), new AtomicReference<>(), new AtomicReference<>());
        HttpCnnClassifier failingClassifier = new HttpCnnClassifier(errorUrl);
        BusinessException httpEx = assertThrows(BusinessException.class,
                () -> failingClassifier.classify(JPEG_SAMPLE));
        assertEquals(503, httpEx.getHttpStatus());

        stopServer();
        String badRequestUrl = startMockServer("/evaluar", 400, "{\"error\":\"bad request\"}",
                new AtomicReference<>(), new AtomicReference<>(), new AtomicReference<>());
        HttpCnnClassifier badReqClassifier = new HttpCnnClassifier(badRequestUrl);
        BusinessException badReqEx = assertThrows(BusinessException.class,
                () -> badReqClassifier.classify(JPEG_SAMPLE));
        assertEquals(503, badReqEx.getHttpStatus());

        BusinessException corruptEx = assertThrows(BusinessException.class,
                () -> badReqClassifier.parseResults("{corrupt-json"));
        assertEquals(503, corruptEx.getHttpStatus());
    }

    private String startMockServer(String expectedPath,
                                   int statusCode,
                                   String responseBody,
                                   AtomicReference<String> capturedApiKey,
                                   AtomicReference<String> capturedPath,
                                   AtomicReference<String> capturedBody) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            capturedPath.set(exchange.getRequestURI().getPath());
            capturedApiKey.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            byte[] reqBytes = exchange.getRequestBody().readAllBytes();
            capturedBody.set(new String(reqBytes, StandardCharsets.UTF_8));

            byte[] respBytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(statusCode, respBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(respBytes);
            }
        });
        server.start();
        int port = server.getAddress().getPort();
        if ("/evaluar".equals(expectedPath)) {
            return "http://127.0.0.1:" + port;
        }
        return "http://127.0.0.1:" + port + expectedPath;
    }

    private String extractInlineMimeType(String jsonBody) {
        JsonObject root = gson.fromJson(jsonBody, JsonObject.class);
        JsonArray parts = root.getAsJsonArray("contents")
                .get(0).getAsJsonObject()
                .getAsJsonArray("parts");
        return parts.get(1).getAsJsonObject()
                .getAsJsonObject("inlineData")
                .get("mimeType").getAsString();
    }
}
