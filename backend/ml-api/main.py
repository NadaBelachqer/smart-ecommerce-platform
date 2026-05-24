from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

# -----------------------------
# INIT API
# -----------------------------
app = FastAPI(
    title="Forecast ML API",
    description="Prediction demand using LightGBM",
    version="1.0"
)

# -----------------------------
# LOAD MODEL
# -----------------------------
model = joblib.load("champion_lightgbm_model.pkl")

# -----------------------------
# LOAD DATA CONTEXT
# -----------------------------
df_context = pd.read_csv("sales_final.csv")
df_context.columns = df_context.columns.str.replace(' ', '_')

if "Demand" in df_context.columns:
    X_context = df_context.drop(columns=["Demand"])
else:
    X_context = df_context

# Index par Product_ID pour recherche instantanée
X_context_indexed = {pid: grp for pid, grp in X_context.groupby("Product_ID")}

# -----------------------------
# REQUEST MODEL (JAVA DTO)
# -----------------------------
class ForecastRequest(BaseModel):
    productId: int
    month: int
    dayOfWeek: int
    promo: int
    stockLevel: float
    price: float = 0.0
    discount: float = 0.0
    unitsSold: int = 0
    unitsOrdered: int = 0

# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.get("/")
def home():
    return {"message": "ML Forecast API Running 🚀"}

# -----------------------------
# PREDICT
# -----------------------------
@app.post("/predict")
def predict(data: ForecastRequest):

    try:
        
        product_history = X_context_indexed.get(data.productId)

        if product_history is None or product_history.empty:
            raise HTTPException(status_code=404, detail="Product not found")

        
        last_known_state = product_history.iloc[-1].copy()

        
        last_known_state["Month"] = data.month
        last_known_state["DayOfWeek"] = data.dayOfWeek
        last_known_state["Promotion"] = data.promo
        last_known_state["Inventory_Level"] = data.stockLevel
        last_known_state["Price"] = data.price if data.price > 0 else last_known_state["Price"]
        last_known_state["Discount"] = data.discount / 100.0
        last_known_state["Units_Sold"] = data.unitsSold if data.unitsSold > 0 else last_known_state["Units_Sold"]
        last_known_state["Units_Ordered"] = data.unitsOrdered if data.unitsOrdered > 0 else last_known_state["Units_Ordered"]
        last_known_state["Rolling_7"] = data.unitsSold if data.unitsSold > 0 else last_known_state["Rolling_7"]
        last_known_state["Lag_1"] = data.unitsSold if data.unitsSold > 0 else last_known_state["Lag_1"]
        # Saison calculee depuis le mois
        season_map = {12: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3}
        last_known_state["Seasonality_enc"] = season_map.get(data.month, 1)
        last_known_state["Stock_Ratio"] = data.stockLevel / (last_known_state["Units_Sold"] + 1)

        # 📦 5. transformer en dataframe
        df_predict = pd.DataFrame([last_known_state])

        # 🧹 5.1 LE FILTRE INTELLIGENT : Demander au modèle ses colonnes exactes
        if hasattr(model, "feature_name_"):
            expected_features = model.feature_name_  
        elif hasattr(model, "booster_"):
            expected_features = model.booster_.feature_name() 
        else:
            expected_features = model.feature_name() 

        
        df_predict = df_predict[expected_features]

       
        for col in df_predict.select_dtypes(include=['object']).columns:
            df_predict[col] = df_predict[col].astype('category')

        
        prediction = model.predict(df_predict)[0]

        
        return {
            "prediction": round(float(prediction), 2)
        }

    except Exception as e:
        print("🔥 ERROR ML API:", str(e))
        raise HTTPException(status_code=500, detail=str(e))