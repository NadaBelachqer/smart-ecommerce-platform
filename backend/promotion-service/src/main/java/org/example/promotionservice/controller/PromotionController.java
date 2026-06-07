package org.example.promotionservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.promotionservice.dto.*;
import org.example.promotionservice.service.PromotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4201"})
@RequestMapping("/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotion Service", description = "Gestion des promotions suggérées par le modèle ML")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/suggest")
    @Operation(summary = "Générer des suggestions de promotions via le modèle ML")
    public ResponseEntity<PromotionBatchResponseDTO> suggestPromotions() {
        return ResponseEntity.ok(promotionService.suggestPromotions());
    }

    @PostMapping("/batches/{batchId}/validate")
    @Operation(summary = "Valider un batch de promotions (admin)")
    public ResponseEntity<PromotionBatchResponseDTO> validateBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(promotionService.validateBatch(batchId));
    }

    @PostMapping("/batches/{batchId}/reject")
    @Operation(summary = "Rejeter un batch de promotions (admin)")
    public ResponseEntity<PromotionBatchResponseDTO> rejectBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(promotionService.rejectBatch(batchId));
    }

    @GetMapping("/batches/{batchId}")
    @Operation(summary = "Récupérer un batch avec ses promotions")
    public ResponseEntity<PromotionBatchResponseDTO> getBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(promotionService.getBatch(batchId));
    }

    @GetMapping("/batches")
    @Operation(summary = "Récupérer tous les batches")
    public ResponseEntity<List<PromotionBatchResponseDTO>> getAllBatches() {
        return ResponseEntity.ok(promotionService.getAllBatches());
    }

    @GetMapping("/validated")
    @Operation(summary = "Récupérer toutes les promotions validées (pour le front client)")
    public ResponseEntity<List<PromotionResponseDTO>> getValidatedPromotions() {
        return ResponseEntity.ok(promotionService.getValidatedPromotions());
    }
}
