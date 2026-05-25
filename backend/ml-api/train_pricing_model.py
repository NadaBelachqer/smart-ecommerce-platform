import pandas as pd
import numpy as np
import joblib
from lightgbm import LGBMRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# -----------------------------
# LOAD DATA
# -----------------------------
df = pd.read_csv("sales_final.csv")
df.columns = df.columns.str.replace(" ", "_")
df = df.dropna()

print("Dataset shape:", df.shape)

# -----------------------------
# FEATURE ENGINEERING
# -----------------------------
df["Stock_Ratio"] = df["Inventory_Level"] / (df["Units_Sold"] + 1)
df["Price_vs_Comp"] = df["Price"] - df["Competitor_Pricing"]
df["Price_Ratio"] = df["Price"] / (df["Competitor_Pricing"] + 1)

# -----------------------------
# TARGET
# -----------------------------
df["Log_Demand"] = np.log1p(df["Demand"])
y = df["Log_Demand"]

# -----------------------------
# FEATURES
# -----------------------------
X = df.drop(columns=["Demand", "Log_Demand"])

# garder uniquement numériques
X = X.select_dtypes(include=[np.number])

# -----------------------------
# SPLIT
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -----------------------------
# MODEL
# -----------------------------
model = LGBMRegressor(
    n_estimators=500,
    learning_rate=0.05,
    num_leaves=31,
    random_state=42
)

print("🚀 Training pricing model...")
model.fit(X_train, y_train)

# -----------------------------
# EVALUATION
# -----------------------------
preds = np.expm1(model.predict(X_test))
y_true = np.expm1(y_test)

mae = mean_absolute_error(y_true, preds)
print("✅ MAE:", mae)

# -----------------------------
# SAVE
# -----------------------------
joblib.dump(model, "pricing_model.pkl")
joblib.dump(list(X.columns), "pricing_features.pkl")

print("💾 Model saved")