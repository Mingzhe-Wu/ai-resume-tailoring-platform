package com.mingzhe.resumetailor;

import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Calls the OpenAI chat completion API to generate resume content.
 */
@Service
public class OpenAiService {

    // get api key from system environment to avoid risky behaviors
    private final String apiKey = System.getenv("OPENAI_API_KEY");

    public String generate(String prompt) {
        try {
            URL url = new URL("https://api.openai.com/v1/chat/completions");

            // configure the connection
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String safePrompt = prompt
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\r", "\\r")
                    .replace("\n", "\\n")
                    .replace("\t", "\\t");

            String body = """
            {
              "model": "gpt-5.5",
              "messages": [
                {"role": "user", "content": "%s"}
              ]
            }
            """.formatted(safePrompt);

            // send request
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }

            int statusCode = conn.getResponseCode();

            InputStream inputStream;

            if (statusCode >= 200 && statusCode < 300) {
                inputStream = conn.getInputStream();
            } else {
                inputStream = conn.getErrorStream();
            }

            BufferedReader br = new BufferedReader(
                    new InputStreamReader(inputStream, StandardCharsets.UTF_8)
            );

            // store response in string builder
            StringBuilder response = new StringBuilder();
            String line;

            while ((line = br.readLine()) != null) {
                response.append(line);
            }

            String responseBody = response.toString();

            System.out.println("OpenAI status code: " + statusCode);
            System.out.println("OpenAI response: " + responseBody);

            if (statusCode < 200 || statusCode >= 300) {
                throw new RuntimeException("OpenAI API call failed with status code: " + statusCode);
            }

            // extract the content
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(responseBody);

            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asString();

        } catch (Exception e) {
            e.printStackTrace();
            return "AI call failed";
        }
    }
}