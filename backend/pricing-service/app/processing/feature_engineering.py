import pandas as pd
import numpy as np
import re
import os


class FeatureEngineer:

    def __init__(self, input_path, output_path):
        self.input_path = input_path
        self.output_path = output_path

    # -------------------------
    # LOAD DATA
    # -------------------------
    def load(self):
        df = pd.read_csv(self.input_path)
        print(f"Loaded rows: {len(df)}")
        return df

    # -------------------------
    # TEXT FEATURES
    # -------------------------
    def text_features(self, df):

        # longueur nom
        df["name_length"] = df["nom"].apply(len)

        # nombre de mots
        df["name_word_count"] = df["nom"].apply(lambda x: len(str(x).split()))

        # présence marque (heuristic simple)
        brands = ["lavazza", "monin", "ayala", "sidi", "bio", "nestle"]

        df["brand_detected"] = df["nom"].apply(
            lambda x: any(b in str(x).lower() for b in brands)
        ).astype(int)

        # présence quantité (1L, 500g, 33cl…)
        pattern_qty = r"\d+\s?(g|kg|ml|l|cl)"

        df["has_quantity"] = df["nom"].apply(
            lambda x: 1 if re.search(pattern_qty, str(x).lower()) else 0
        )

        return df

    # -------------------------
    # PRICE FEATURES
    # -------------------------
    def price_features(self, df):

        df["price_log"] = np.log1p(df["price"])

        # bucket pricing
        def bucket(price):
            if price < 20:
                return "low"
            elif price < 60:
                return "medium"
            else:
                return "high"

        df["price_bucket"] = df["price"].apply(bucket)

        return df

    # -------------------------
    # CATEGORY FEATURES
    # -------------------------
    def category_features(self, df):

        # fréquence catégorie (important ML)
        freq = df["categorie"].value_counts(normalize=True)

        df["category_freq"] = df["categorie"].map(freq)

        # catégorie premium
        premium = ["bio", "hygiene-et-beaute", "fruits", "boissons"]

        df["is_premium_category"] = df["categorie"].apply(
            lambda x: 1 if x in premium else 0
        )

        return df

    # -------------------------
    # CLEAN FINAL FEATURES
    # -------------------------
    def clean(self, df):

        df = df.dropna()

        # enlever doublons après features
        df = df.drop_duplicates()

        return df

    # -------------------------
    # SAVE
    # -------------------------
    def save(self, df):

        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

        df.to_csv(self.output_path, index=False, encoding="utf-8-sig")

        print(f"Saved -> {self.output_path}")

    # -------------------------
    # PIPELINE
    # -------------------------
    def run(self):

        df = self.load()

        df = self.text_features(df)
        df = self.price_features(df)
        df = self.category_features(df)

        df = self.clean(df)

        self.save(df)

        return df