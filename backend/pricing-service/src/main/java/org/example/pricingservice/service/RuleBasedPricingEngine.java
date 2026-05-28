package org.example.pricingservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Rule-based pricing engine used when the ML service is unavailable.
 * Implements classic retail pricing strategies based on stock, competition, and demand signals.
 */
@Component
public class RuleBasedPricingEngine {

    private static final Logger log = LoggerFactory.getLogger(RuleBasedPricingEngine.class);

    public Map<String, Object> compute(
            Double currentPrice,
            Double cost,
            Integer stockLevel,
            Double competitorPrice,
            int month,
            int dayOfWeek
    ) {
        log.info("[RuleEngine] Computing rule-based price | stock={} competitor={} DH",
                stockLevel, competitorPrice);

        double safeCost = (cost != null && cost > 0) ? cost : currentPrice * 0.6;
        double minMargin = safeCost * 1.10; // never go below 10% margin

        // ── Strategy selection ──────────────────────────────────────────
        String strategy;
        String strategyLabel;
        double optimalPrice;

        boolean lowStock   = stockLevel != null && stockLevel < 10;
        boolean highStock  = stockLevel != null && stockLevel > 100;
        boolean isWeekend  = dayOfWeek >= 6;
        boolean peakSeason = month >= 6 && month <= 8; // summer peak

        if (lowStock) {
            // Scarcity pricing: push price up
            strategy      = "SCARCITY";
            strategyLabel = "Prix de rareté (stock faible)";
            optimalPrice  = currentPrice * 1.10;

        } else if (highStock) {
            // Liquidation: undercut competitor slightly to move inventory
            strategy      = "LIQUIDATION";
            strategyLabel = "Liquidation stock (prix compétitif)";
            optimalPrice  = Math.max(competitorPrice * 0.97, minMargin);

        } else if (competitorPrice < currentPrice * 0.90) {
            // Competitor is significantly cheaper — defensive adjustment
            strategy      = "COMPETITIVE_DEFENSE";
            strategyLabel = "Alignement concurrentiel";
            optimalPrice  = Math.max(competitorPrice * 1.02, minMargin); // match + tiny premium

        } else if (isWeekend || peakSeason) {
            // Demand surge: small premium
            strategy      = "DEMAND_SURGE";
            strategyLabel = "Pic de demande (weekend / saison)";
            optimalPrice  = currentPrice * 1.05;

        } else {
            // Steady state: value pricing at 3% above cost floor
            strategy      = "VALUE";
            strategyLabel = "Prix valeur standard";
            optimalPrice  = Math.max(currentPrice, safeCost * 1.20);
        }

        // Clamp: never below cost+margin, never more than 2× current price
        optimalPrice = Math.min(Math.max(optimalPrice, minMargin), currentPrice * 2.0);
        optimalPrice = Math.round(optimalPrice * 20.0) / 20.0; // round to 0.05 DH

        // ── Demand & revenue estimates (simple elasticity model) ────────
        double elasticity      = -1.5; // typical retail price elasticity
        double priceDelta      = (optimalPrice - currentPrice) / currentPrice;
        double demandBase      = estimateBaseDemand(stockLevel);
        double expectedDemand  = Math.max(1, demandBase * (1 + elasticity * priceDelta));
        double expectedRevenue = optimalPrice * expectedDemand;
        double expectedProfit  = (optimalPrice - safeCost) * expectedDemand;
        double score           = expectedProfit / (safeCost * demandBase); // normalized score

        log.info("[RuleEngine] Strategy={} | optimalPrice={} DH | demand={} | profit={} DH",
                strategy, optimalPrice, Math.round(expectedDemand), Math.round(expectedProfit));

        Map<String, Object> result = new HashMap<>();
        result.put("optimal_price",    optimalPrice);
        result.put("expected_demand",  expectedDemand);
        result.put("expected_revenue", expectedRevenue);
        result.put("expected_profit",  expectedProfit);
        result.put("score",            score);
        result.put("strategy",         strategy);
        result.put("strategy_label",   strategyLabel);
        result.put("source",           "RULE_BASED_FALLBACK");
        return result;
    }

    private double estimateBaseDemand(Integer stockLevel) {
        if (stockLevel == null || stockLevel == 0) return 5.0;
        if (stockLevel < 10)  return 8.0;
        if (stockLevel < 50)  return 20.0;
        if (stockLevel < 200) return 50.0;
        return 100.0;
    }
}