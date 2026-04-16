package org.example.productservice.util;

import com.opencsv.CSVReader;
import org.example.productservice.entity.Product;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class CsvProductParser {

    public static List<Product> parse(MultipartFile file) {
        List<Product> products = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {

            List<String[]> rows = reader.readAll();

            for (int i = 1; i < rows.size(); i++) { // skip header
                String[] row = rows.get(i);
                if (row == null || row.length == 0) continue;
                if (row.length < 6) {
                    System.out.println("Ligne ignorée (incomplète): " + String.join(",", row));
                    continue;
                }
                try {
                    Product product = new Product();
                    product.setSku(row[0].trim());
                    product.setName(row[1].trim());
                    product.setCategory(row[2].trim());
                    product.setDescription(row[3].trim());
                    product.setSellingPrice(Double.parseDouble(row[4].trim()));

                    product.setImageUrl(row[5].trim());

                    products.add(product);

                } catch (Exception e) {
                    System.out.println("⚠️ Erreur ligne CSV ignorée: " + String.join(",", row));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur lecture CSV", e);
        }

        return products;
    }
}