from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from enum import Enum
from dataclasses import dataclass
import pandas as pd
import numpy as np
import joblib

router = APIRouter()

# -----------------------------
# LOAD MODEL
# -----------------------------
model = joblib.load("pricing_model.pkl")
FEATURES = joblib.load("pricing_features.pkl")

df = pd.read_csv("sales_final.csv")
df.columns = df.columns.str.replace(" ", "_")
df = df.dropna()

# -----------------------------
# REQUEST DTO (INCHANGÉ — compatible Java MlPricingClient)
# -----------------------------
class PricingRequest(BaseModel):
    product_id: int
    current_price: float
    cost: float
    stock_level: float
    competitor_price: float
    promo: int
    month: int
    day_of_week: int


# ================================================================
# SMART PRICING ENGINE
# ================================================================

class PricingStrategy(str, Enum):
    STOCK_CRITICAL = "stock_critical"
    LIQUIDATION    = "liquidation"
    DESTOCKING     = "destocking"
    PENETRATION    = "penetration"
    PREMIUM        = "premium"
    PROMO_SEASONAL = "promo_seasonal"
    COMPETITIVE    = "competitive"

HIGH_SEASON_MONTHS = {11, 12, 1}

@dataclass
class StrategyConfig:
    p_min_factor: float
    p_max_factor: float
    w_revenue:    float
    w_profit:     float
    w_stock_pen:  float
    w_dev_pen:    float
    label:        str

STRATEGY_CONFIGS: dict[PricingStrategy, StrategyConfig] = {
    PricingStrategy.STOCK_CRITICAL: StrategyConfig(
        p_min_factor=1.10, p_max_factor=1.30,
        w_revenue=0.30, w_profit=0.70,
        w_stock_pen=0.80, w_dev_pen=0.10,
        label="Gestion rupture — limiter la demande, maximiser marge/unité",
    ),
    PricingStrategy.LIQUIDATION: StrategyConfig(
        p_min_factor=0.65, p_max_factor=0.95,
        w_revenue=0.70, w_profit=0.20,
        w_stock_pen=1.50, w_dev_pen=0.05,
        label="Liquidation urgente — rotation prioritaire sur marge",
    ),
    PricingStrategy.DESTOCKING: StrategyConfig(
        p_min_factor=0.75, p_max_factor=1.05,
        w_revenue=0.60, w_profit=0.30,
        w_stock_pen=0.80, w_dev_pen=0.15,
        label="Déstockage — prix sous compétiteur pour booster le volume",
    ),
    PricingStrategy.PENETRATION: StrategyConfig(
        p_min_factor=0.85, p_max_factor=1.15,
        w_revenue=0.50, w_profit=0.40,
        w_stock_pen=0.20, w_dev_pen=0.20,
        label="Pénétration — aligner progressivement vers le prix marché",
    ),
    PricingStrategy.PREMIUM: StrategyConfig(
        p_min_factor=0.95, p_max_factor=1.20,
        w_revenue=0.30, w_profit=0.60,
        w_stock_pen=0.20, w_dev_pen=0.05,
        label="Premium — défendre la prime de marque",
    ),
    PricingStrategy.PROMO_SEASONAL: StrategyConfig(
        p_min_factor=0.75, p_max_factor=1.05,
        w_revenue=0.55, w_profit=0.35,
        w_stock_pen=0.30, w_dev_pen=0.10,
        label="Promo / saisonnalité — optimiser volume × marge",
    ),
    PricingStrategy.COMPETITIVE: StrategyConfig(
        p_min_factor=0.85, p_max_factor=1.15,
        w_revenue=0.45, w_profit=0.45,
        w_stock_pen=0.25, w_dev_pen=0.15,
        label="Compétitif équilibré — optimisation profit / revenue",
    ),
}


def detect_strategy(req: PricingRequest) -> tuple[PricingStrategy, StrategyConfig]:
    margin = (req.current_price - req.cost) / max(req.current_price, 1)

    if req.stock_level <= 20:
        key = PricingStrategy.STOCK_CRITICAL
    elif req.stock_level >= 400:
        key = PricingStrategy.LIQUIDATION
    elif req.stock_level > 200:
        key = PricingStrategy.DESTOCKING
    elif req.current_price < req.competitor_price * 0.90:
        key = PricingStrategy.PENETRATION
    elif req.current_price > req.competitor_price * 1.15 and margin > 0.40:
        key = PricingStrategy.PREMIUM
    elif req.promo == 1 or req.month in HIGH_SEASON_MONTHS:
        key = PricingStrategy.PROMO_SEASONAL
    else:
        key = PricingStrategy.COMPETITIVE

    return key, STRATEGY_CONFIGS[key]


# ── CORRECTIF competitor_price ────────────────────────────────────────────────
# Problème : p_max_factor × current_price peut dépasser competitor_price pour
# DESTOCKING et PROMO_SEASONAL (ex: 85 × 1.05 = 89.25 > comp 80).
# Le modèle ML converge alors vers ce plafond car le revenue y est maximal.
#
# Solution : pour les stratégies qui doivent rester SOUS le compétiteur,
# on prend le minimum entre le plafond actuel et competitor_price × cap.
#
#   LIQUIDATION    → min(p_max_factor × current, comp × 0.95)
#   DESTOCKING     → min(p_max_factor × current, comp × 0.98)
#   PROMO_SEASONAL → min(p_max_factor × current, comp × 0.98)
#   Autres         → p_max_factor × current  (inchangé)
# ─────────────────────────────────────────────────────────────────────────────
def _compute_p_max(req: PricingRequest, cfg: StrategyConfig, strategy_key: PricingStrategy) -> float:
    base = req.current_price * cfg.p_max_factor
    if strategy_key == PricingStrategy.LIQUIDATION:
        return min(base, req.competitor_price * 0.95)
    if strategy_key in (PricingStrategy.DESTOCKING, PricingStrategy.PROMO_SEASONAL):
        return min(base, req.competitor_price * 0.98)
    return base


def smart_score(
    price: float,
    demand: float,
    req: PricingRequest,
    cfg: StrategyConfig,
) -> float:
    revenue = price * demand
    profit  = (price - req.cost) * demand

    if profit <= 0:
        return -1e9

    stock_penalty = 0.0
    if req.stock_level <= 20:
        stock_penalty = (20 - req.stock_level) * profit * 0.30
    elif req.stock_level >= 400:
        days = req.stock_level / max(demand, 1)
        stock_penalty = days * req.cost * 0.15
    elif req.stock_level > 200:
        stock_penalty = (req.stock_level - 200) * req.cost * 0.08

    dev_pct = (price - req.competitor_price) / max(req.competitor_price, 1e-6)
    dev_penalty = 0.0
    if dev_pct > 0.15:
        dev_penalty = dev_pct * revenue * 0.25
    elif dev_pct < -0.20:
        dev_penalty = abs(dev_pct) * profit * 0.15

    return (
        cfg.w_revenue   * revenue
      + cfg.w_profit    * profit
      - cfg.w_stock_pen * stock_penalty
      - cfg.w_dev_pen   * dev_penalty
    )


def build_features(row, req: PricingRequest, price: float) -> pd.DataFrame:
    row = row.copy()
    row["Price"]              = price
    row["Inventory_Level"]    = req.stock_level
    row["Competitor_Pricing"] = req.competitor_price
    row["Promotion"]          = req.promo
    row["Month"]              = req.month
    row["DayOfWeek"]          = req.day_of_week
    row["Stock_Ratio"]        = row["Inventory_Level"] / (row["Units_Sold"] + 1)
    row["Price_vs_Comp"]      = price - row["Competitor_Pricing"]
    row["Price_Ratio"]        = price / (row["Competitor_Pricing"] + 1)

    df_input = pd.DataFrame([row])
    df_input = df_input.reindex(columns=FEATURES, fill_value=0)
    return df_input


def predict_demand(row, price: float, req: PricingRequest) -> float:
    X = build_features(row, req, price)
    return float(np.expm1(model.predict(X)[0]))


def optimize_price(row, req: PricingRequest) -> dict:
    strategy_key, cfg = detect_strategy(req)

    p_min = max(req.current_price * cfg.p_min_factor, req.cost * 1.03)
    p_max = _compute_p_max(req, cfg, strategy_key)          # ← seule ligne changée
    prices = np.linspace(p_min, p_max, 150)

    best: dict = {"score": -1e18}

    for p in prices:
        d = predict_demand(row, p, req)
        s = smart_score(p, d, req, cfg)

        if s > best["score"]:
            best = {
                "price":          p,
                "demand":         d,
                "revenue":        p * d,
                "profit":         (p - req.cost) * d,
                "score":          s,
                "strategy":       strategy_key.value,
                "strategy_label": cfg.label,
            }

    return best


def get_product(pid: int):
    row = df[df["Product_ID"] == pid]
    if row.empty:
        return None
    return row.iloc[-1].copy()


# ================================================================
# API ENDPOINT (INCHANGÉ — rétro-compatible Java)
# ================================================================
@router.post("/optimize-price")
def optimize(req: PricingRequest):
    row = get_product(req.product_id)

    if row is None:
        raise HTTPException(404, "Product not found")

    result = optimize_price(row, req)

    return {
        "product_id":       req.product_id,
        "optimal_price":    round(result["price"], 2),
        "expected_demand":  round(result["demand"], 2),
        "expected_revenue": round(result["revenue"], 2),
        "expected_profit":  round(result["profit"], 2),
        "score":            round(result["score"], 2),
        "strategy":         result["strategy"],
        "strategy_label":   result["strategy_label"],
    }