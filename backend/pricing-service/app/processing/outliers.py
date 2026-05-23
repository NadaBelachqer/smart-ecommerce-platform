import pandas as pd
import numpy as np
import os


class OutlierDetector:

    def __init__(self, input_path, output_path):
        self.input_path = input_path
        self.output_path = output_path

    # -------------------------
    # LOAD DATA
    # -------------------------
    def load_data(self):
        df = pd.read_csv(self.input_path)
        print(f"Loaded rows: {len(df)}")
        return df

    # -------------------------
    # IQR OUTLIER DETECTION
    # -------------------------
    def detect_outliers_iqr(self, df):

        Q1 = df["price"].quantile(0.25)
        Q3 = df["price"].quantile(0.75)
        IQR = Q3 - Q1

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        print("\n📊 IQR STATS")
        print(f"Q1 = {Q1}")
        print(f"Q3 = {Q3}")
        print(f"IQR = {IQR}")
        print(f"Lower bound = {lower_bound}")
        print(f"Upper bound = {upper_bound}")

        # 👉 FLAG OUTLIERS (NO DELETION)
        df["is_outlier"] = (
            (df["price"] < lower_bound) |
            (df["price"] > upper_bound)
        )

        outliers_count = df["is_outlier"].sum()

        print(f"\nDetected outliers: {outliers_count}")

        return df, lower_bound, upper_bound

    # -------------------------
    # BUSINESS RULES OUTLIERS (OPTIONAL)
    # -------------------------
    def apply_business_rules(self, df):
        """
        Exemple:
        - prix négatif = invalide
        - prix > 5000 = suspect (mais pas supprimé)
        """

        df["is_invalid_price"] = df["price"] <= 0

        return df

    # -------------------------
    # SUMMARY STATS
    # -------------------------
    def summary(self, df):

        print("\n====================")
        print(f"FINAL DATA: {len(df)} rows")
        print("====================\n")

        print("Outlier ratio:")
        print(df["is_outlier"].value_counts(normalize=True) * 100)

    # -------------------------
    # SAVE DATA
    # -------------------------
    def save_data(self, df):

        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

        df.to_csv(self.output_path, index=False, encoding="utf-8-sig")

        print(f"\nClean file saved -> {self.output_path}")

    # -------------------------
    # MAIN PIPELINE
    # -------------------------
    def run(self):

        df = self.load_data()

        df = self.apply_business_rules(df)

        df, _, _ = self.detect_outliers_iqr(df)

        self.summary(df)

        self.save_data(df)

        return df