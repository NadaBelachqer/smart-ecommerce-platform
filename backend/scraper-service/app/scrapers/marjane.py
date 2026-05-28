from .base_scraper import BaseScraper


class MarjaneScraper(BaseScraper):
    """
    Scraper Marjane.ma — à implémenter.
    Structure : site classique HTML avec pagination.
    """

    BASE_URL = "https://www.marjane.ma"

    def __init__(self):
        super().__init__()
        self.source_name = "marjane"

    def scrape_all(self) -> list:
        print("[Marjane] Scraper pas encore implémenté — retour liste vide")
        return []

    def scrape_category(self, category_slug: str) -> list:
        return []