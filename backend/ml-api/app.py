from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

app = FastAPI()

model = joblib.load("model.pkl")

class ForecastRequest(BaseModel):
    stockLevel: float
    salesLastWeek: float
    salesLastMonth: float
    price: float
    promotion: int
    supplierDelay: int

@app.post("/predict")
def predict(data: ForecastRequest):

    df = pd.DataFrame([data.dict()])

    pred = model.predict(df)[0]

    return {
        "predictedDemand": round(float(pred),2),
        "recommendedStock": round(float(pred*1.2),2)
    }