from .base_scraper import BaseScraper


class JumiaScraper(BaseScraper):
    """
    Scraper Jumia.ma — à implémenter.
    Structure : site React avec API JSON interne.
    Endpoint : https://www.jumia.ma/catalog/?q={query}&page={n}
    Retourne du JSON directement — pas besoin de BeautifulSoup.
    """

    BASE_URL = "https://www.jumia.ma"

    CATEGORIES_API = [
        "epicerie-et-alimentation",
        "sante-et-beaute",
        "electromenager",
        "electronique",
    ]

    def __init__(self):
        super().__init__()
        self.source_name = "jumia"

    def scrape_all(self) -> list:
        print("[Jumia] Scraper pas encore implémenté — retour liste vide")
        return []

    def scrape_category(self, category_slug: str) -> list:
        return []