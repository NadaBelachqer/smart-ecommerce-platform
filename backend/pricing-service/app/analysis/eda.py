import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


class MarketEDA:

    def __init__(self, path):
        self.path = path
        pd.set_option("display.max_columns", None)

    # -------------------------
    # LOAD
    # -------------------------
    def load_data(self):
        df = pd.read_csv(self.path)
        print(f"📦 Loaded dataset: {df.shape}")
        return df

    # -------------------------
    # OVERVIEW
    # -------------------------
    def overview(self, df):

        print("\n====================")
        print("📊 OVERVIEW")
        print("====================")

        print(df.head(10))

        print("\nMissing values:")
        print(df.isnull().sum())

        print("\nUnique categories:", df["categorie"].nunique())

        print("\nUnique products:", df["nom"].nunique())

    # -------------------------
    # PRICE DISTRIBUTION (IMPORTANT ML STEP)
    # -------------------------
    def price_distribution(self, df):

        print("\n====================")
        print("💰 PRICE DISTRIBUTION ANALYSIS")
        print("====================")

        print(df["price"].describe())

        plt.figure()
        sns.histplot(df["price"], bins=50, kde=True)
        plt.title("Price Distribution")
        plt.xlabel("Price (MAD)")
        plt.show()

        # log distribution (IMPORTANT for pricing models)
        plt.figure()
        sns.histplot(np.log1p(df["price"]), bins=50, kde=True)
        plt.title("Log Price Distribution")
        plt.xlabel("Log Price")
        plt.show()

    # -------------------------
    # CATEGORY INSIGHT (BUSINESS VALUE)
    # -------------------------
    def category_analysis(self, df):

        print("\n====================")
        print("📦 CATEGORY ANALYSIS")
        print("====================")

        cat = df.groupby("categorie")["price"].agg([
            "count", "mean", "median", "min", "max"
        ]).sort_values("count", ascending=False)

        print(cat)

        plt.figure(figsize=(12,6))
        sns.barplot(data=df, x="categorie", y="price", estimator=np.mean)
        plt.xticks(rotation=45)
        plt.title("Average Price per Category")
        plt.show()

    # -------------------------
    # CATEGORY PRICE VARIABILITY (IMPORTANT FOR PRICING ENGINE)
    # -------------------------
    def category_variability(self, df):

        print("\n====================")
        print("📊 PRICE VARIABILITY BY CATEGORY")
        print("====================")

        variability = df.groupby("categorie")["price"].std().sort_values(ascending=False)
        print(variability)

        plt.figure(figsize=(12,6))
        variability.plot(kind="bar")
        plt.title("Price Variability per Category")
        plt.xticks(rotation=45)
        plt.show()

    # -------------------------
    # BRAND IMPACT ANALYSIS
    # -------------------------
    def brand_analysis(self, df):

        print("\n====================")
        print("🏷️ BRAND ANALYSIS")
        print("====================")

        brands = ["lavazza", "monin", "ayala", "sidi", "nestle", "bio"]

        df["brand"] = df["nom"].apply(
            lambda x: next((b for b in brands if b in str(x).lower()), "other")
        )

        brand_stats = df.groupby("brand")["price"].mean().sort_values(ascending=False)

        print(brand_stats)

        plt.figure(figsize=(10,5))
        brand_stats.plot(kind="bar")
        plt.title("Average Price per Brand")
        plt.show()

    # -------------------------
    # TOP PRODUCTS
    # -------------------------
    def top_products(self, df):

        print("\n====================")
        print("🏆 TOP PRODUCTS")
        print("====================")

        print(df.sort_values("price", ascending=False)[["nom", "price", "categorie"]].head(10))

    # -------------------------
    # PRICE INSIGHT (VERY IMPORTANT)
    # -------------------------
    def price_insights(self, df):

        print("\n====================")
        print("📈 PRICE INSIGHTS")
        print("====================")

        print("Min price:", df["price"].min())
        print("Max price:", df["price"].max())
        print("Median price:", df["price"].median())

        print("\nPrice segments:")
        print("Low (<20):", len(df[df["price"] < 20]))
        print("Mid (20-60):", len(df[(df["price"] >= 20) & (df["price"] < 60)]))
        print("High (>60):", len(df[df["price"] >= 60]))

    # -------------------------
    # CORRELATION (ML READY INSIGHT)
    # -------------------------
    def correlation(self, df):

        print("\n====================")
        print("📊 CORRELATION ANALYSIS")
        print("====================")

        numeric_df = df[["price"]].copy()

        # features simples
        numeric_df["name_length"] = df["nom"].apply(len)
        numeric_df["word_count"] = df["nom"].apply(lambda x: len(str(x).split()))

        corr = numeric_df.corr()
        print(corr)

        plt.figure()
        sns.heatmap(corr, annot=True, cmap="coolwarm")
        plt.title("Correlation Heatmap")
        plt.show()

    # -------------------------
    # RUN ALL
    # -------------------------
    def run(self):

        df = self.load_data()

        self.overview(df)
        self.price_distribution(df)
        self.category_analysis(df)
        self.category_variability(df)
        self.brand_analysis(df)
        self.price_insights(df)
        self.correlation(df)
        self.top_products(df)

        print("\n✅ ADVANCED EDA COMPLETED (PRICING READY INSIGHTS)")

        return df