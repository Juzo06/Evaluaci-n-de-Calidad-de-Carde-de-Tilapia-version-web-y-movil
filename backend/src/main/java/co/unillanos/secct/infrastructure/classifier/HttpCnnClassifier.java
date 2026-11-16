package co.unillanos.secct.infrastructure.classifier;

import co.unillanos.secct.usecases.dto.ClassificationResult;
import co.unillanos.secct.usecases.exceptions.BusinessException;
import co.unillanos.secct.usecases.ports.Classifier;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;

/** Calls Google Gemini API (or compatible REST endpoint) and maps its answer to ClassificationResult. */
@Component
public class HttpCnnClassifier implements Classifier {

    private static final Logger log = LoggerFactory.getLogger(HttpCnnClassifier.class);
    private static final String UNAVAILABLE_MESSAGE =
            "El servicio de clasificación no está disponible. Intenta de nuevo más tarde";
    private static final Set<String> EXPECTED_PARTS = Set.of("OJO", "PIEL");

    private static final String NTC_PROMPT = """
            Eres un inspector experto en evaluación organoléptica de frescura para tilapia roja según las normas \
            colombianas NTC 1443 y GTC 157. Analiza la imagen suministrada y evalúa únicamente dos regiones \
            anatómicas: "OJO" (convexidad corneal, brillo pupilar y ausencia de opacidad o hundimiento) y "PIEL" \
            (pigmentación viva característica, adherencia firme de escamas y mucus acuoso transparente). \
            Asigna a cada parte una categoría entera "categoria_ntc" en escala de 1 (rechazo / deterioro severo) \
            a 5 (frescura óptima) y una "confianza" decimal entre 0.0 y 1.0. \
            REGLA IMPERATIVA: si la imagen NO corresponde a un pez o tilapia roja, está completamente ilegible o no \
            permite evaluar claramente ojo y piel, debes devolver exactamente {"partes": []}. \
            Responde estrictamente con el objeto JSON válido según el esquema.""";

    private final Gson gson = new Gson();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final String baseUrl;
    private final String apiKey;

    @Autowired
    public HttpCnnClassifier(@Value("${secct.cnn.url}") String baseUrl,
                             @Value("${secct.cnn.api-key:}") String apiKey) {
        this.baseUrl = trimTrailingSlashes(baseUrl);
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    public HttpCnnClassifier(String baseUrl) {
        this(baseUrl, "");
    }

    @Override
    public List<ClassificationResult> classify(byte[] image) {
        URI endpointUri = resolveEndpointUri();
        String requestJson = gson.toJson(buildRequestBody(image));

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(endpointUri)
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson));

        if (!apiKey.isBlank()) {
            requestBuilder.header("x-goog-api-key", apiKey);
        } else if (isGeminiEndpoint(endpointUri)) {
            log.warn("GEMINI_API_KEY is empty while invoking Gemini endpoint: {}", endpointUri);
        }

        HttpResponse<String> response;
        try {
            response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Classification request interrupted for {}: {}", endpointUri, e.getMessage(), e);
            throw new BusinessException(UNAVAILABLE_MESSAGE, 503);
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Technical error calling classification service at {}: {}", endpointUri, e.getMessage(), e);
            throw new BusinessException(UNAVAILABLE_MESSAGE, 503);
        }

        if (response.statusCode() != 200) {
            log.warn("Classification service responded with HTTP {}: {}",
                    response.statusCode(), response.body());
            throw new BusinessException(UNAVAILABLE_MESSAGE, 503);
        }
        return parseResults(response.body());
    }

    private boolean isGeminiEndpoint(URI endpointUri) {
        String uriText = endpointUri.toString();
        return uriText.contains("generativelanguage.googleapis.com") || uriText.contains(":generateContent");
    }

    private URI resolveEndpointUri() {
        if (baseUrl.contains(":generateContent") || baseUrl.endsWith("/evaluar")) {
            return URI.create(baseUrl);
        }
        return URI.create(baseUrl + "/evaluar");
    }

    private String detectMimeType(byte[] image) {
        if (image != null && image.length >= 4
                && (image[0] & 0xFF) == 0x89
                && (image[1] & 0xFF) == 0x50
                && (image[2] & 0xFF) == 0x4E
                && (image[3] & 0xFF) == 0x47) {
            return "image/png";
        }
        return "image/jpeg";
    }

    private JsonObject buildRequestBody(byte[] image) {
        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", NTC_PROMPT);

        JsonObject inlineData = new JsonObject();
        inlineData.addProperty("mimeType", detectMimeType(image));
        inlineData.addProperty("data", Base64.getEncoder().encodeToString(image));

        JsonObject imagePart = new JsonObject();
        imagePart.add("inlineData", inlineData);

        JsonArray parts = new JsonArray();
        parts.add(textPart);
        parts.add(imagePart);

        JsonObject content = new JsonObject();
        content.add("parts", parts);

        JsonArray contents = new JsonArray();
        contents.add(content);

        JsonObject generationConfig = new JsonObject();
        generationConfig.addProperty("temperature", 0.1);
        generationConfig.addProperty("responseMimeType", "application/json");
        generationConfig.add("responseSchema", buildResponseSchema());

        JsonObject root = new JsonObject();
        root.add("contents", contents);
        root.add("generationConfig", generationConfig);
        return root;
    }

    private JsonObject buildResponseSchema() {
        JsonArray partEnum = new JsonArray();
        partEnum.add("OJO");
        partEnum.add("PIEL");

        JsonObject parteSchema = new JsonObject();
        parteSchema.addProperty("type", "STRING");
        parteSchema.add("enum", partEnum);

        JsonObject categoriaSchema = new JsonObject();
        categoriaSchema.addProperty("type", "INTEGER");

        JsonObject confianzaSchema = new JsonObject();
        confianzaSchema.addProperty("type", "NUMBER");

        JsonObject itemProperties = new JsonObject();
        itemProperties.add("parte", parteSchema);
        itemProperties.add("categoria_ntc", categoriaSchema);
        itemProperties.add("confianza", confianzaSchema);

        JsonArray itemRequired = new JsonArray();
        itemRequired.add("parte");
        itemRequired.add("categoria_ntc");
        itemRequired.add("confianza");

        JsonObject itemSchema = new JsonObject();
        itemSchema.addProperty("type", "OBJECT");
        itemSchema.add("properties", itemProperties);
        itemSchema.add("required", itemRequired);

        JsonObject partesArraySchema = new JsonObject();
        partesArraySchema.addProperty("type", "ARRAY");
        partesArraySchema.add("items", itemSchema);

        JsonObject rootProperties = new JsonObject();
        rootProperties.add("partes", partesArraySchema);

        JsonArray rootRequired = new JsonArray();
        rootRequired.add("partes");

        JsonObject schema = new JsonObject();
        schema.addProperty("type", "OBJECT");
        schema.add("properties", rootProperties);
        schema.add("required", rootRequired);
        return schema;
    }

    List<ClassificationResult> parseResults(String body) {
        try {
            JsonObject payload = unwrapPayload(body);
            JsonArray parts = payload.getAsJsonArray("partes");
            if (parts == null || parts.isEmpty()) {
                throw new IllegalStateException("The classification answer does not contain parts");
            }
            List<ClassificationResult> results = new ArrayList<>();
            for (JsonElement element : parts) {
                JsonObject part = element.getAsJsonObject();
                String fishPartCode = part.get("parte").getAsString();
                BigDecimal rawCategory = part.get("categoria_ntc").getAsBigDecimal();
                short ntcCategory = rawCategory.shortValueExact();
                BigDecimal confidence = part.get("confianza").getAsBigDecimal();
                if (!EXPECTED_PARTS.contains(fishPartCode) || ntcCategory < 1 || ntcCategory > 5
                        || confidence.signum() < 0 || confidence.compareTo(BigDecimal.ONE) > 0) {
                    throw new IllegalStateException("Unexpected value in the classification answer: " + part);
                }
                results.add(new ClassificationResult(fishPartCode, ntcCategory, confidence));
            }
            boolean hasAllParts = results.stream().map(result -> result.fishPartCode).distinct().count()
                    == EXPECTED_PARTS.size() && results.size() == EXPECTED_PARTS.size();
            if (!hasAllParts) {
                throw new IllegalStateException("The classification answer must contain OJO and PIEL once each");
            }
            return results;
        } catch (JsonParseException | IllegalStateException | NullPointerException | NumberFormatException
                 | ClassCastException | ArithmeticException | IndexOutOfBoundsException e) {
            log.warn("Classification response rejected by parser ({}): {}", e.getMessage(), body);
            throw new BusinessException(UNAVAILABLE_MESSAGE, 503);
        }
    }

    private JsonObject unwrapPayload(String body) {
        JsonObject root = gson.fromJson(body, JsonObject.class);
        if (root == null) {
            throw new IllegalStateException("Empty JSON response");
        }
        if (root.has("candidates") && root.get("candidates").isJsonArray()) {
            String rawText = root.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();
            JsonObject inner = gson.fromJson(stripMarkdownFences(rawText), JsonObject.class);
            if (inner == null) {
                throw new IllegalStateException("Empty JSON text inside Gemini candidate");
            }
            return inner;
        }
        if (root.has("partes")) {
            return root;
        }
        throw new IllegalStateException("Missing candidates or partes in JSON response");
    }

    private String stripMarkdownFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    private static String trimTrailingSlashes(String value) {
        String result = value == null ? "" : value.trim();
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }
}
