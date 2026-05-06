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

# ✨ LA MAGIE EST ICI : On remplace tous les espaces par des tirets du bas (_)
# Ainsi, "Product ID" devient "Product_ID", exactement comme le modèle l'exige !
df_context.columns = df_context.columns.str.replace(' ', '_')

# supprimer target si présente
if "Demand" in df_context.columns:
    X_context = df_context.drop(columns=["Demand"])
else:
    X_context = df_context

# -----------------------------
# REQUEST MODEL (JAVA DTO)
# -----------------------------
class ForecastRequest(BaseModel):
    productId: int
    month: int
    dayOfWeek: int
    promo: int
    stockLevel: float

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
        
        product_history = X_context[X_context["Product_ID"] == data.productId]

        if product_history.empty:
            raise HTTPException(status_code=404, detail="Product not found")

        
        last_known_state = product_history.iloc[-1].copy()

        
        last_known_state["Month"] = data.month
        last_known_state["DayOfWeek"] = data.dayOfWeek
        last_known_state["Promotion"] = data.promo
        last_known_state["Inventory_Level"] = data.stockLevel

        # 📊 4. recalcul feature métier
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