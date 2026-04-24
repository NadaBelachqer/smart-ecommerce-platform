from app.services.scraping.mymarket_scraper import MyMarketScraper


def main():

    scraper = MyMarketScraper()

    data = scraper.scrape_all()

    scraper.save_to_csv(data)


if __name__ == "__main__":
    main()