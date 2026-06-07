from flask import Flask, request, jsonify
import joblib
import json
import numpy as np
from datetime import date, timedelta
import random

app = Flask(__name__)

model = joblib.load("promotion_model.pkl")
scaler = joblib.load("scaler.pkl")

with open("features.json") as f:
    feature_names = json.load(f)

with open("model_metrics.json") as f:
    metrics = json.load(f)

MAX_DISCOUNT = metrics.get("max_discount_normal", 30)
MAX_STOCK_REF = 500  # valeur de référence pour normaliser stock_ratio


def build_features(product):
    today = date.today()
    day_of_week = today.weekday()
    month = today.month
    quarter = (month - 1) // 3 + 1
    is_weekend = 1 if day_of_week >= 5 else 0
    day_of_year = today.timetuple().tm_yday

    # --- Données réelles issues de la DB ---
    price = float(product.get("sellingPrice") or 0.0)
    stock_level = int(product.get("stockLevel") or 0)
    reorder_threshold = int(product.get("reorderThreshold") or 0)
    reserved_stock = int(product.get("reservedStock") or 0)
    available_stock = max(stock_level - reserved_stock, 0)

    stock_ratio = min(available_stock / MAX_STOCK_REF, 1.0)

    # stock_turnover : ratio stock disponible / seuil de réapprovisionnement
    stock_turnover = (available_stock / reorder_threshold) if reorder_threshold > 0 else 0.5
    stock_turnover = min(stock_turnover, 3.0) / 3.0  # normaliser entre 0 et 1

    # jours avant expiration : non stocké dans inventory, on utilise une valeur neutre
    days_to_expire = 90

    # product_demand_rank : basé sur le stock restant par rapport au seuil
    # Plus le stock est bas par rapport au seuil, plus la demande est supposée élevée
    if reorder_threshold > 0:
        demand_rank = max(1, int(10 * (1 - available_stock / (reorder_threshold * 2))))
    else:
        demand_rank = 5

    row = {
        "inventory_level": available_stock,
        "price": price,
        "discount": 0,
        "promotion": 0,
        "competitor_pricing": price * 0.95,
        "day_of_week": day_of_week,
        "month": month,
        "quarter": quarter,
        "is_weekend": is_weekend,
        "day_of_year": day_of_year,
        "is_black_friday": 0,
        "is_christmas": 1 if month == 12 else 0,
        "is_new_year": 1 if month == 1 else 0,
        "is_holiday": 0,
        "stock_ratio": stock_ratio,
        "very_high_stock": 1 if stock_ratio > 0.8 else 0,
        "high_stock": 1 if 0.6 < stock_ratio <= 0.8 else 0,
        "medium_stock": 1 if 0.4 < stock_ratio <= 0.6 else 0,
        "low_stock": 1 if stock_ratio <= 0.4 else 0,
        "stock_turnover": stock_turnover,
        "price_advantage": 1 if price > 0 else 0,
        "is_promoted": 0,
        "days_to_expire": days_to_expire,
        "expiry_urgent": 0,
        "expiry_very_near": 0,
        "expiry_near": 0,
        "expiry_medium": 1,
        "expiry_far": 0,
        "expiry_risk_score": max(0.0, 1 - days_to_expire / 180),
        "sell_through_rate": stock_turnover,
        "margin_rate": 0.3,
        "potential_profit": price * 0.3 * available_stock,
        "product_popularity": demand_rank,
        "product_popularity_pct": demand_rank / 10.0,
        "product_demand_rank": demand_rank,
        "category_encoded": abs(hash(product.get("category") or "")) % 10,
        "region_encoded": 1,
        "weather_condition_encoded": 1,
        "seasonality_encoded": quarter,
        "epidemic": 0,
    }
    return [row[f] for f in feature_names]


def build_reason(product, discount):
    reasons = []
    stock_level = int(product.get("stockLevel") or 0)
    reserved = int(product.get("reservedStock") or 0)
    reorder = int(product.get("reorderThreshold") or 0)
    available = max(stock_level - reserved, 0)

    if available > reorder * 2:
        reasons.append("Stock élevé — écoulement recommandé")
    if product.get("lowStock"):
        reasons.append("Stock bas — promotion pour stimuler la rotation")
    if discount >= 20:
        reasons.append("Forte réduction suggérée par le modèle XGBoost")
    if not reasons:
        reasons.append("Optimisation des ventes recommandée par le modèle ML")
    return " | ".join(reasons)


@app.post("/suggest-promotions")
def suggest_promotions():
    products = request.get_json()
    if not products:
        return jsonify({"error": "No products provided"}), 400

    suggestions = []
    for product in products:
        features = np.array([build_features(product)])
        features_scaled = scaler.transform(features)
        predicted_discount = float(model.predict(features_scaled)[0])
        discount = max(5.0, min(predicted_discount, MAX_DISCOUNT))
        discount = round(discount, 1)

        price = float(product.get("sellingPrice") or 0.0)
        promotional_price = round(price * (1 - discount / 100), 2)
        suggested_date = (date.today() + timedelta(days=random.randint(1, 7))).isoformat()

        suggestions.append({
            "productId": product.get("id"),
            "productName": product.get("name"),
            "category": product.get("category"),
            "currentPrice": price,
            "suggestedDiscount": discount,
            "promotionalPrice": promotional_price,
            "suggestedDate": suggested_date,
            "reason": build_reason(product, discount)
        })

    return jsonify(suggestions)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": metrics.get("model_type"), "r2": metrics.get("r2_score")})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
