from app.processing.outliers import OutlierDetector


def main():

    detector = OutlierDetector()

    input_path = "app/data/processed/mymarket_cleaned.csv"
    output_path = "app/data/processed/mymarket_no_outliers.csv"

    df_clean, outliers = detector.run(input_path, output_path)

    print("\nSample outliers:")
    print(outliers.head(10))


if __name__ == "__main__":
    main()