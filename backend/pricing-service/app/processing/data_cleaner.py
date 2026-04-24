import pandas as pd
import re
import os


class DataCleaner:
    def __init__(self, input_path, output_path):
        self.input_path = input_path
        self.output_path = output_path

        self.unwanted_phrases = [
            "de la plus récente à la plus ancienne",
            "en rupture de stock",
            "en stock",
            "mad ttc",
            "default title",
            "deals of the week",
            "prix",
            "diapositive précédente",
            "diapositive suivante"
        ]

    # -------------------------
    # LOAD CSV
    # -------------------------
    def load_data(self):
        df = pd.read_csv(self.input_path)
        print(f"Loaded rows: {len(df)}")
        return df

    # -------------------------
    # CLEAN TEXT
    # -------------------------
    def clean_text(self, text):
        if pd.isna(text):
            return ""

        text = str(text).lower()

        for phrase in self.unwanted_phrases:
            text = text.replace(phrase, "")

        # nettoyer espaces multiples
        text = re.sub(r"\s+", " ", text).strip()

        return text

    # -------------------------
    # CLEAN NAME + DESC
    # -------------------------
    def clean_names_column(self, df):
        df["nom"] = df["nom"].apply(self.clean_text)
        df["desc"] = df["desc"].apply(self.clean_text)
        return df

    # -------------------------
    # CLEAN CATEGORIES
    # -------------------------
    def clean_categories(self, df):
        df["categorie"] = (
            df["categorie"]
            .astype(str)
            .str.lower()
            .str.strip()
        )
        return df

    # -------------------------
    # REMOVE INVALID PRICES
    # -------------------------
    def clean_prices(self, df):
        before = len(df)

        df = df[df["price"].notnull()]
        df = df[df["price"] > 0]
        df = df[df["price"] < 1000]

        after = len(df)

        print(f"Invalid prices removed: {before - after}")

        return df

    # -------------------------
    # REMOVE DUPLICATES
    # -------------------------
    def remove_duplicates(self, df):
        before = len(df)

        df = df.drop_duplicates(
            subset=["nom", "price", "categorie"]
        )

        after = len(df)

        print(f"Duplicates removed: {before - after}")

        return df

    # -------------------------
    # REMOVE EMPTY NAMES
    # -------------------------
    def drop_empty_names(self, df):
        before = len(df)

        df = df[df["nom"].str.len() > 3]

        after = len(df)

        print(f"Empty names removed: {before - after}")

        return df

    # -------------------------
    # SAVE CLEANED CSV
    # -------------------------
    def save_data(self, df):
        os.makedirs(
            os.path.dirname(self.output_path),
            exist_ok=True
        )

        df.to_csv(
            self.output_path,
            index=False,
            encoding="utf-8-sig"
        )

        print(f"Cleaned file saved -> {self.output_path}")

    # -------------------------
    # MAIN PIPELINE
    # -------------------------
    def run(self):
        df = self.load_data()

        df = self.clean_names_column(df)
        df = self.clean_categories(df)
        df = self.clean_prices(df)
        df = self.remove_duplicates(df)
        df = self.drop_empty_names(df)

        print(f"Final rows: {len(df)}")

        self.save_data(df)

        return df