from bs4 import BeautifulSoup
import time
import re
from .base_scraper import BaseScraper


class MyMarketScraper(BaseScraper):

    BASE_URL = "https://www.mymarket.ma"

    # Toutes les catégories du site
    CATEGORIES = [
        "alimentation",
        "bio",
        "legumes",
        "fruits",
        "boissons",
        "surgeles",
        "epicerie-sucree",
        "epicerie-salee",
        "cremerie",
        "petit-dejeuner",
        "pains-et-patisserie",
        "sans-gluten",
        "bebe",
        "hygiene-et-beaute",
        "entretien-et-maison",
        "animaux",
    ]

    # Sélecteurs CSS Shopify — du plus précis au plus générique
    CARD_SELECTORS = [
        "li.grid__item",
        "div.product-item",
        "div.card-wrapper",
        "li[data-product-id]",
        ".product-card",
    ]
    NAME_SELECTORS = [
        ".product-item__title",
        ".card__heading a",
        ".card__heading",
        "h3.product-title a",
        "a.product-item__title",
        ".product-card__title",
    ]
    PRICE_SELECTORS = [
        ".price__regular .price-item--regular",
        ".price-item--regular",
        ".price__sale .price-item--sale",
        "span.price-item",
        ".product-price",
        "span[class*='price']",
    ]

    NOISE_WORDS = [
        "En stock", "Rupture de stock", "Ajouter au panier",
        "Default Title", "Diapositive", "Augmenter", "Diminuer",
        "Deals of the week", "Prix habituel",
    ]

    def __init__(self):
        super().__init__()
        self.source_name = "mymarket"

    # ── SCRAPE TOUT ────────────────────────────────────────────────────────
    def scrape_all(self) -> list:
        all_products = []
        for slug in self.CATEGORIES:
            products = self.scrape_category(slug)
            all_products.extend(products)
            time.sleep(2)
        print(f"[MyMarket] Total: {len(all_products)} produits")
        return all_products

    # ── SCRAPE UNE CATÉGORIE ───────────────────────────────────────────────
    def scrape_category(self, category_slug: str) -> list:
        url_base = f"{self.BASE_URL}/collections/{category_slug}"
        all_products = []
        page = 1
        first_product_name = None

        print(f"\n[MyMarket] Catégorie: {category_slug}")

        while page <= 20:
            url = f"{url_base}?page={page}"
            html = self.fetch(url)

            if not html:
                print(f"  Page {page}: fetch échoué — arrêt")
                break

            products = self._extract_products(html, category_slug)

            if not products:
                print(f"  Page {page}: aucun produit → fin catégorie")
                break

            # Détecter la répétition de page (Shopify répète la dernière page)
            current_first = products[0]["nom"].lower()
            if page > 1 and current_first == first_product_name:
                print(f"  Page {page}: même premier produit → fin catégorie")
                break

            if page == 1:
                first_product_name = current_first

            all_products.extend(products)
            print(f"  Page {page}: {len(products)} produits (total: {len(all_products)})")

            page += 1
            time.sleep(1.5)

        return all_products

    # ── EXTRACTION HTML ────────────────────────────────────────────────────
    def _extract_products(self, html: str, category: str) -> list:
        soup = BeautifulSoup(html, "lxml")
        products = []
        seen = set()

        # Trouver les cartes produits avec les sélecteurs
        cards = []
        for sel in self.CARD_SELECTORS:
            cards = soup.select(sel)
            if cards:
                print(f"    Sélecteur carte: '{sel}' → {len(cards)} cartes")
                break

        if not cards:
            print("    Aucun sélecteur carte → fallback /products/ links")
            return self._fallback_extract(soup, category)

        for card in cards:
            name = self._extract_name(card)
            price = self._extract_price(card)

            if not name or not price:
                continue
            if len(name) < 4:
                continue

            key = (name.lower(), price)
            if key in seen:
                continue
            seen.add(key)

            products.append(self.make_product(name, price, category))

        return products

    def _extract_name(self, card) -> str | None:
        for sel in self.NAME_SELECTORS:
            el = card.select_one(sel)
            if el:
                return self._clean_name(el.get_text())
        return None

    def _extract_price(self, card) -> float | None:
        for sel in self.PRICE_SELECTORS:
            el = card.select_one(sel)
            if el:
                price = self.parse_price(el.get_text())
                if price and price > 0:
                    return price
        return None

    def _clean_name(self, raw: str) -> str:
        cleaned = raw.strip()
        for noise in self.NOISE_WORDS:
            cleaned = cleaned.replace(noise, "")
        return " ".join(cleaned.split())

    # ── FALLBACK : liens /products/ ────────────────────────────────────────
    def _fallback_extract(self, soup: BeautifulSoup, category: str) -> list:
        products = []
        seen = set()

        for link in soup.select("a[href*='/products/']"):
            name = self._clean_name(link.get_text())
            if len(name) < 4:
                continue

            # Chercher prix dans les parents (max 5 niveaux)
            price = None
            node = link.parent
            for _ in range(5):
                if node is None:
                    break
                for sel in self.PRICE_SELECTORS:
                    el = node.select_one(sel)
                    if el:
                        price = self.parse_price(el.get_text())
                        if price:
                            break
                if price:
                    break
                node = node.parent

            if not price:
                continue

            key = (name.lower(), price)
            if key in seen:
                continue
            seen.add(key)

            products.append(self.make_product(name, price, category))

        print(f"    Fallback: {len(products)} produits")
        return products