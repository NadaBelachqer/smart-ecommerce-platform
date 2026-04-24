from app.processing.data_cleaner import DataCleaner


def main():
    cleaner = DataCleaner(
        input_path="app/data/raw/mymarket_products.csv",
        output_path="app/data/processed/mymarket_cleaned.csv"
    )

    cleaned_df = cleaner.run()

    print("\nSample after cleaning:")
    print(cleaned_df.head(10))


if __name__ == "__main__":
    main()