from app.analysis.eda import MarketEDA


def main():

    path = "app/data/processed/mymarket_cleaned.csv"

    eda = MarketEDA(path)

    eda.run()


if __name__ == "__main__":
    main()