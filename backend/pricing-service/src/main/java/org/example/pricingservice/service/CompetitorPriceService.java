package org.example.pricingservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CompetitorPriceService {

    @Value("${serpapi.key:}")
    private String serpApiKey;

    @Value("${serpapi.enabled:false}")
    private boolean serpApiEnabled;

    @Value("${pricing.fallback.competitor.discount:0.10}")
    private double fallbackDiscount;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, CachedPrice> priceCache = new ConcurrentHashMap<>();

    // Cache de 1 heure pour ne pas gaspiller tes 100 requêtes/mois
    private static final long CACHE_TTL_MS = 3_600_000;

    // ─────────────────────────────────────────────
    // MÉTHODE PRINCIPALE — appelée depuis PricingService
    // ─────────────────────────────────────────────
    public Double getLowestCompetitorPrice(Double sellingPrice, String sku, String productName) {

        System.out.println("📊 [CompetitorPriceService] Recherche prix concurrent pour: " + sku);

        // 1. Vérifier le cache d'abord
        CachedPrice cached = priceCache.get(sku);
        if (cached != null && !cached.isExpired()) {
            System.out.println("💾 [Cache] Prix concurrent trouvé en cache: " + cached.price + " DH");
            return cached.price;
        }

        // 2. Appeler SerpAPI si activé
        if (serpApiEnabled && serpApiKey != null && !serpApiKey.isBlank()) {
            try {
                Double price = fetchFromSerpApi(productName, sellingPrice);
                // Sauvegarder dans le cache
                priceCache.put(sku, new CachedPrice(price));
                System.out.println("🌐 [SerpAPI] Prix concurrent réel trouvé: " + price + " DH");
                return price;
            } catch (Exception e) {
                System.err.println("⚠️ [SerpAPI] Échec — activation du fallback: " + e.getMessage());
            }
        }

        // 3. Fallback si SerpAPI échoue ou est désactivé
        Double fallback = calculateFallbackPrice(sellingPrice, productName);
        System.out.println("⚠️ [Fallback] Prix concurrent estimé: " + fallback + " DH");
        return fallback;
    }

    // ─────────────────────────────────────────────
    // APPEL SERPAPI — Google Shopping
    // ─────────────────────────────────────────────
    private static final double EUR_TO_MAD = 10.8;

    private Double fetchFromSerpApi(String productName, Double sellingPrice) {

        String encodedName = productName.replace(" ", "+");
        String url = "https://serpapi.com/search.json"
                + "?engine=google_shopping"
                + "&q=" + encodedName
                + "&api_key=" + serpApiKey
                + "&gl=fr"
                + "&hl=fr"
                + "&num=10";

        System.out.println("🔍 [SerpAPI] Recherche: " + productName);

        Map response = restTemplate.getForObject(url, Map.class);
        if (response == null) throw new RuntimeException("Réponse SerpAPI null");

        List<Map> results = (List<Map>) response.get("shopping_results");
        if (results == null || results.isEmpty())
            throw new RuntimeException("Aucun résultat Google Shopping pour: " + productName);

        // Convertir les prix € → DH puis filtrer
        Double lowestPrice = results.stream()
                .map(r -> extractPrice(r))
                .filter(p -> p != null && p > 0)
                .map(p -> p * EUR_TO_MAD)           // ← conversion € → DH
                .filter(p -> p > sellingPrice * 0.30 // ← filtre APRÈS conversion
                        && p < sellingPrice * 3.0)
                .min(Double::compareTo)
                .orElseThrow(() -> new RuntimeException("Aucun prix valide après conversion"));

        System.out.println("💱 [SerpAPI] Prix converti en DH: " + lowestPrice);
        return Math.round(lowestPrice * 20) / 20.0;
    }

    // ─────────────────────────────────────────────
    // EXTRACTION DU PRIX depuis un résultat SerpAPI
    // ─────────────────────────────────────────────
    private Double extractPrice(Map result) {
        try {
            // SerpAPI fournit souvent extracted_price (double) directement
            Object extracted = result.get("extracted_price");
            if (extracted != null) {
                return Double.valueOf(extracted.toString());
            }

            // Sinon parser le champ price (string) : "38,50 DH", "$45.99", "52 MAD"
            Object priceObj = result.get("price");
            if (priceObj == null) return null;

            String clean = priceObj.toString()
                    .replaceAll("[^0-9.,]", "")   // garder chiffres, virgule, point
                    .replace(",", ".");             // normaliser séparateur décimal

            // Si plusieurs points (ex: "1.234.56"), garder seulement le dernier
            int lastDot = clean.lastIndexOf('.');
            if (lastDot > 0 && clean.indexOf('.') != lastDot) {
                clean = clean.replace(".", "").substring(0, clean.length() - 1)
                        + "." + clean.substring(lastDot + 1);
            }

            return clean.isEmpty() ? null : Double.parseDouble(clean);

        } catch (Exception e) {
            System.err.println("⚠️ Prix non parseable: " + result.get("price"));
            return null;
        }
    }

    // ─────────────────────────────────────────────
    // FALLBACK INTELLIGENT (si SerpAPI échoue)
    // ─────────────────────────────────────────────
    private Double calculateFallbackPrice(Double sellingPrice, String productName) {
        String nameLower = productName.toLowerCase();
        double ratio;

        if (nameLower.contains("frais") || nameLower.contains("fruit") || nameLower.contains("legume")) {
            ratio = 0.88 + (Math.random() * 0.10);
        } else if (nameLower.contains("electron") || nameLower.contains("tv") || nameLower.contains("ordi")) {
            ratio = 0.93 + (Math.random() * 0.10);
        } else if (nameLower.contains("vetement") || nameLower.contains("robe") || nameLower.contains("jean")) {
            ratio = 0.92 + (Math.random() * 0.12);
        } else {
            ratio = 0.90 + (Math.random() * 0.15);
        }

        return Math.round(sellingPrice * ratio * 20) / 20.0;
    }

    // ─────────────────────────────────────────────
    // CLASSE INTERNE — Cache
    // ─────────────────────────────────────────────
    private static class CachedPrice {
        Double price;
        long timestamp;

        CachedPrice(Double price) {
            this.price = price;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
}