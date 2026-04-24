from app.processing.feature_engineering import FeatureEngineer


def main():

    input_path = "app/data/processed/mymarket_cleaned.csv"
    output_path = "app/data/processed/mymarket_features.csv"

    fe = FeatureEngineer(input_path, output_path)

    df = fe.run()

    print("\n====================")
    print("FEATURE ENGINEERING DONE")
    print("====================\n")

    print(df.head(10))

    print("\nColumns created:")
    print(df.columns.tolist())


if __name__ == "__main__":
    main()