package org.example.productservice.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public String saveImage(MultipartFile file, Long productId) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "product_" + productId + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        return "/uploads/" + filename;
    }

    public void deleteImage(String imageUrl) throws IOException {
        if (imageUrl != null && imageUrl.startsWith("/uploads/")) {
            String filename = imageUrl.substring(9);
            Path filePath = Paths.get(uploadDir, filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        }
    }
}