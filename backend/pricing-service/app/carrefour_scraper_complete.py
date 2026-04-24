"""
╔══════════════════════════════════════════════════════════════════════════════╗
║   CARREFOUR MAROC — Scraper Complet                                         ║
║   carrefour.ma  |  Selenium + BeautifulSoup + fallback requests             ║
║   Output : carrefour_products.csv  (compatible pipeline ML)                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Stratégie :
  1. Selenium (Chrome headless) pour les pages à rendu dynamique (React/JS)
  2. Fallback requests + BeautifulSoup si Selenium non dispo
  3. Extraction JSON-LD embarqué (structured data schema.org)
  4. Pagination automatique
  5. Sauvegarde CSV progressive (résistant aux crashs)

Installation :
  pip install selenium webdriver-manager beautifulsoup4 requests pandas lxml

Usage :
  python carrefour_scraper_complete.py                    # tout scraper
  python carrefour_scraper_complete.py --category boissons
  python carrefour_scraper_complete.py --no-selenium      # mode requests only
  python carrefour_scraper_complete.py --max-pages 3      # limiter pour test
"""

import argparse
import csv
import json
import logging
import random
import re
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("CarrefourScraper")


# ══════════════════════════════════════════════════════════════════════════════
#  DATA MODEL
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class Product:
    store_name:     str   = "carrefour"
    nom:            str   = ""
    prix:           Optional[float] = None
    prix_original:  Optional[float] = None
    remise_pct:     Optional[float] = None
    categorie:      str   = ""
    sous_categorie: str   = ""
    marque:         str   = ""
    unite:          str   = ""
    disponible:     bool  = True
    url:            str   = ""
    image_url:      str   = ""
    scraped_at:     str   = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def is_valid(self) -> bool:
        return bool(self.nom and self.prix and self.prix > 0)


# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURATION CARREFOUR MA
# ══════════════════════════════════════════════════════════════════════════════

BASE_URL = "https://www.carrefour.ma"

# Catégories Carrefour MA → (chemin URL, nom normalisé, sous-catégories optionnelles)
CATEGORIES = {
    "boissons": {
        "url":   "/fr/courses/boissons-sans-alcool/eaux-et-boissons-gazeuses/c/MA-40001",
        "label": "alimentaire_boissons",
        "subs":  [
            "/fr/courses/boissons-sans-alcool/jus-de-fruits-et-nectars/c/MA-40002",
            "/fr/courses/boissons-sans-alcool/sodas-et-limonades/c/MA-40003",
            "/fr/courses/cafe-the-et-boissons-chaudes/c/MA-40004",
        ],
    },
    "produits_laitiers": {
        "url":   "/fr/courses/produits-laitiers-et-oeufs/c/MA-30001",
        "label": "alimentaire_produits_laitiers",
        "subs":  [
            "/fr/courses/produits-laitiers-et-oeufs/laits/c/MA-30002",
            "/fr/courses/produits-laitiers-et-oeufs/yaourts/c/MA-30003",
            "/fr/courses/produits-laitiers-et-oeufs/fromages/c/MA-30004",
        ],
    },
    "epicerie": {
        "url":   "/fr/courses/epicerie/c/MA-20001",
        "label": "alimentaire_epicerie",
        "subs":  [
            "/fr/courses/epicerie/huiles-et-vinaigres/c/MA-20002",
            "/fr/courses/epicerie/pates-riz-et-cereales/c/MA-20003",
            "/fr/courses/epicerie/conserves-et-sauces/c/MA-20004",
            "/fr/courses/epicerie/sucre-sel-et-epices/c/MA-20005",
        ],
    },
    "hygiene_beaute": {
        "url":   "/fr/courses/hygiene-beaute/c/MA-60001",
        "label": "hygiene_beaute",
        "subs":  [
            "/fr/courses/hygiene-beaute/soins-du-corps/c/MA-60002",
            "/fr/courses/hygiene-beaute/soins-du-visage/c/MA-60003",
            "/fr/courses/hygiene-beaute/shampoings-et-apres-shampoing/c/MA-60004",
        ],
    },
    "entretien": {
        "url":   "/fr/courses/entretien-de-la-maison/c/MA-70001",
        "label": "entretien_maison",
        "subs":  [
            "/fr/courses/entretien-de-la-maison/lessives/c/MA-70002",
            "/fr/courses/entretien-de-la-maison/nettoyants-menagers/c/MA-70003",
        ],
    },
    "frais": {
        "url":   "/fr/courses/viandes-poissons-et-charcuterie/c/MA-10001",
        "label": "alimentaire_viandes_poissons",
        "subs":  [],
    },
}

# Sélecteurs CSS (Carrefour MA utilise des classes générées — plusieurs fallbacks)
CSS = {
    # Cartes produits sur les pages de liste
    "cards": [
        "div.product-item",
        "li.product-item",
        "article[class*='product']",
        "div[class*='product-card']",
        "div[data-component='ProductCard']",
        "[class*='ProductCard']",
        "div[class*='css-'][class*='product']",  # styled-components
    ],
    "name": [
        "a.product-item-link",
        "span[class*='product-name']",
        "h2[class*='product']",
        "[class*='ProductName']",
        "[class*='product-title']",
        "a[class*='product']",
    ],
    "price": [
        "span[class*='final-price'] span.price",
        "span[class*='regular-price'] span.price",
        "span.price",
        "[class*='ProductPrice']",
        "[class*='price-value']",
        "[class*='selling-price']",
        "div[class*='price'] span",
    ],
    "old_price": [
        "span.old-price span.price",
        "[class*='old-price']",
        "[class*='crossed-price']",
        "s[class*='price']",
        "del",
    ],
    "brand": [
        "[class*='brand-name']",
        "a[class*='brand']",
        "span[class*='manufacturer']",
    ],
    "availability": [
        "div.stock span",
        "button[class*='tocart']",
        "[class*='availability']",
        "[class*='stock']",
    ],
    "image": [
        "img.product-image-photo",
        "img[class*='product-image']",
        "img[class*='main-image']",
        "img[loading='lazy']",
    ],
    "next_page": [
        "a[class*='next']",
        "li.pages-item-next a",
        "a[title='Suivant']",
        "[aria-label='Next page']",
        "[aria-label='Page suivante']",
    ],
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) "
    "Gecko/20100101 Firefox/122.0",
]


# ══════════════════════════════════════════════════════════════════════════════
#  UTILITAIRES
# ══════════════════════════════════════════════════════════════════════════════

def parse_price(text: str) -> Optional[float]:
    """
    Convertit n'importe quelle chaîne de prix marocain en float.
    Gère : "14,90 DH" | "14.900" | "125 MAD" | "125,00" | "1 250 DH"
    """
    if not text:
        return None
    cleaned = (
        text
        .replace("DH", "").replace("MAD", "").replace("د.م.", "")
        .replace("\xa0", " ").replace("\u202f", " ").replace("&nbsp;", " ")
        .strip()
    )
    # Supprime les espaces internes (séparateur de milliers)
    cleaned = re.sub(r"\s+", "", cleaned)

    if not cleaned:
        return None

    try:
        # Virgule décimale : "14,90"
        if "," in cleaned and "." not in cleaned:
            cleaned = cleaned.replace(",", ".")
        # Point séparateur de milliers : "14.900" (3 chiffres après le point)
        elif "." in cleaned and len(cleaned.split(".")[-1]) == 3:
            cleaned = cleaned.replace(".", "")
        # Virgule séparateur de milliers : "14,900"
        elif "," in cleaned and len(cleaned.split(",")[-1]) == 3:
            cleaned = cleaned.replace(",", "")

        val = float(cleaned)
        return round(val, 2) if val > 0 else None

    except ValueError:
        return None


def extract_unit(name: str) -> str:
    """Extrait l'unité depuis le nom du produit."""
    patterns = [
        r"\d+(?:[.,]\d+)?\s*(?:kg|g|mg|L|l|ml|cl)\b",
        r"\d+\s*(?:x|X)\s*\d+(?:[.,]\d+)?\s*(?:kg|g|L|ml|cl)\b",
        r"\d+\s*(?:x|X)\s*\d+",
        r"pack\s+de\s+\d+",
        r"lot\s+de\s+\d+",
    ]
    for pattern in patterns:
        m = re.search(pattern, name, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    return "unité"


def extract_brand(name: str) -> str:
    """
    Essaie d'extraire la marque depuis le nom (premier mot majuscule).
    Heuristique simple — la marque est souvent en premier.
    """
    words = name.split()
    if words and words[0][0].isupper():
        return words[0]
    return ""


def select_first(soup, selectors: list[str]) -> Optional[object]:
    """Essaie chaque sélecteur CSS dans l'ordre et retourne le premier résultat."""
    for sel in selectors:
        el = soup.select_one(sel)
        if el:
            return el
    return None


def select_all(soup, selectors: list[str]) -> list:
    """Essaie chaque sélecteur et retourne la première liste non vide."""
    for sel in selectors:
        els = soup.select(sel)
        if els:
            return els
    return []


def polite_delay(min_s: float = 2.0, max_s: float = 5.0):
    """Délai aléatoire pour ne pas surcharger le serveur."""
    time.sleep(random.uniform(min_s, max_s))


def get_headers() -> dict:
    return {
        "User-Agent":      random.choice(USER_AGENTS),
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-MA,fr;q=0.9,ar;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT":             "1",
        "Referer":         BASE_URL,
        "Connection":      "keep-alive",
    }


# ══════════════════════════════════════════════════════════════════════════════
#  FETCHER — Requests (fallback)
# ══════════════════════════════════════════════════════════════════════════════

def build_session() -> requests.Session:
    """Session avec retry automatique."""
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


_session = build_session()


def fetch_html_requests(url: str) -> Optional[str]:
    """Récupère une page via requests (pas de JS)."""
    try:
        polite_delay(1.5, 3.5)
        resp = _session.get(url, headers=get_headers(), timeout=20, allow_redirects=True)
        resp.raise_for_status()
        logger.debug(f"GET {url} → {resp.status_code}")
        return resp.text
    except requests.exceptions.HTTPError as e:
        code = e.response.status_code
        if code == 403:
            logger.warning(f"403 Forbidden — {url}  (Carrefour bloque requests, utilise Selenium)")
        elif code == 404:
            logger.warning(f"404 Not Found — {url}")
        else:
            logger.error(f"HTTP {code} — {url}")
        return None
    except Exception as e:
        logger.error(f"Erreur fetch {url}: {e}")
        return None


# ══════════════════════════════════════════════════════════════════════════════
#  FETCHER — Selenium (pour les pages à rendu JS)
# ══════════════════════════════════════════════════════════════════════════════

def build_driver():
    """Construit un driver Chrome headless avec stealth minimal."""
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager

        opts = Options()
        opts.add_argument("--headless=new")          # Chrome headless nouvelle API
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1920,1080")
        opts.add_argument(f"--user-agent={random.choice(USER_AGENTS)}")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)
        # Désactive les images pour accélérer
        prefs = {"profile.managed_default_content_settings.images": 2}
        opts.add_experimental_option("prefs", prefs)

        service = Service(ChromeDriverManager().install())
        driver  = webdriver.Chrome(service=service, options=opts)

        # Patch navigator.webdriver pour éviter détection
        driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument",
            {"source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"},
        )
        return driver

    except ImportError:
        logger.warning("Selenium non installé — pip install selenium webdriver-manager")
        return None
    except Exception as e:
        logger.error(f"Impossible de démarrer Chrome : {e}")
        return None


def fetch_html_selenium(driver, url: str, wait_seconds: float = 3.0) -> Optional[str]:
    """
    Charge une page via Selenium et attend le rendu JS.
    Scrolle pour déclencher le lazy-loading.
    """
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        polite_delay(1.0, 2.5)
        driver.get(url)

        # Attente : présence de cartes produits OU timeout
        try:
            WebDriverWait(driver, wait_seconds).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.product-item, [class*='product-card']"))
            )
        except Exception:
            pass  # Continue même si le sélecteur n'est pas trouvé — on essaiera le HTML quand même

        # Scroll progressif pour déclencher le lazy-loading
        for scroll_pct in [0.3, 0.6, 0.9, 1.0]:
            driver.execute_script(
                f"window.scrollTo(0, document.body.scrollHeight * {scroll_pct});"
            )
            time.sleep(0.5)

        return driver.page_source

    except Exception as e:
        logger.error(f"Selenium fetch error {url}: {e}")
        return None


# ══════════════════════════════════════════════════════════════════════════════
#  PARSEURS
# ══════════════════════════════════════════════════════════════════════════════

def parse_json_ld(soup: BeautifulSoup, category_label: str) -> list[Product]:
    """
    Extrait les produits depuis les blocs JSON-LD (schema.org).
    Carrefour embarque parfois ses données structurées — méthode la plus fiable.
    """
    products = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, AttributeError):
            continue

        # Cas 1 : ItemList (page de liste)
        if isinstance(data, dict) and data.get("@type") == "ItemList":
            for item in data.get("itemListElement", []):
                p_data = item.get("item", item)
                product = _product_from_json_ld(p_data, category_label)
                if product and product.is_valid:
                    products.append(product)

        # Cas 2 : Product direct (page fiche)
        elif isinstance(data, dict) and data.get("@type") == "Product":
            product = _product_from_json_ld(data, category_label)
            if product and product.is_valid:
                products.append(product)

        # Cas 3 : liste directe
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("@type") == "Product":
                    product = _product_from_json_ld(item, category_label)
                    if product and product.is_valid:
                        products.append(product)

    return products


def _product_from_json_ld(data: dict, category_label: str) -> Optional[Product]:
    """Construit un Product depuis un dict JSON-LD Product."""
    offers = data.get("offers", {})
    if isinstance(offers, list):
        offers = offers[0] if offers else {}

    price = parse_price(str(offers.get("price", "")))
    if not price:
        return None

    name = data.get("name", "")
    old_price_str = offers.get("priceValidUntil", "")  # parfois utilisé pour prix barré
    original_price = None
    discount = None

    brand_data = data.get("brand", {})
    brand = brand_data.get("name", "") if isinstance(brand_data, dict) else str(brand_data)

    image = data.get("image", "")
    if isinstance(image, list):
        image = image[0] if image else ""

    return Product(
        nom=name,
        prix=price,
        prix_original=original_price,
        remise_pct=discount,
        categorie=category_label,
        marque=brand or extract_brand(name),
        unite=extract_unit(name),
        disponible=offers.get("availability", "").endswith("InStock"),
        url=data.get("url", ""),
        image_url=image,
    )


def parse_html_cards(soup: BeautifulSoup, category_label: str) -> list[Product]:
    """
    Fallback : parse les cartes produits HTML.
    Essaie plusieurs sélecteurs pour s'adapter aux changements de Carrefour.
    """
    products = []
    cards = select_all(soup, CSS["cards"])

    if not cards:
        logger.debug("Aucune carte produit trouvée avec les sélecteurs CSS")
        return []

    logger.debug(f"{len(cards)} cartes HTML trouvées")

    for card in cards:
        try:
            p = _parse_single_card(card, category_label)
            if p and p.is_valid:
                products.append(p)
        except Exception as e:
            logger.debug(f"Erreur parsing card: {e}")

    return products


def _parse_single_card(card, category_label: str) -> Optional[Product]:
    """Parse une carte produit individuelle."""
    name_tag      = select_first(card, CSS["name"])
    price_tag     = select_first(card, CSS["price"])
    old_price_tag = select_first(card, CSS["old_price"])
    brand_tag     = select_first(card, CSS["brand"])
    img_tag       = select_first(card, CSS["image"])
    avail_tag     = select_first(card, CSS["availability"])

    if not name_tag:
        return None

    name = name_tag.get_text(strip=True)
    if not name or len(name) < 3:
        return None

    price_text = price_tag.get_text() if price_tag else ""
    price = parse_price(price_text)
    if not price:
        return None

    old_price = parse_price(old_price_tag.get_text() if old_price_tag else "")
    discount   = None
    if old_price and old_price > price:
        discount = round((1 - price / old_price) * 100, 1)

    # URL produit
    link = card.select_one("a[href]")
    url  = ""
    if link:
        href = link.get("href", "")
        url  = href if href.startswith("http") else urljoin(BASE_URL, href)

    # Disponibilité
    is_available = True
    if avail_tag:
        txt = avail_tag.get_text(strip=True).lower()
        is_available = not any(w in txt for w in ["rupture", "indisponible", "out of stock"])

    brand_text = brand_tag.get_text(strip=True) if brand_tag else extract_brand(name)

    img_url = ""
    if img_tag:
        img_url = img_tag.get("src") or img_tag.get("data-src") or img_tag.get("data-lazy") or ""

    return Product(
        nom=name,
        prix=price,
        prix_original=old_price,
        remise_pct=discount,
        categorie=category_label,
        marque=brand_text,
        unite=extract_unit(name),
        disponible=is_available,
        url=url,
        image_url=img_url,
    )


def parse_page(html: str, category_label: str) -> list[Product]:
    """
    Parse une page complète.
    Priorité : JSON-LD → HTML cards
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1. JSON-LD (plus fiable)
    products = parse_json_ld(soup, category_label)
    if products:
        logger.debug(f"JSON-LD : {len(products)} produits")
        return products

    # 2. HTML fallback
    products = parse_html_cards(soup, category_label)
    logger.debug(f"HTML cards : {len(products)} produits")
    return products


def has_next_page(html: str) -> bool:
    """Détecte s'il y a une page suivante."""
    soup = BeautifulSoup(html, "html.parser")
    return bool(select_first(soup, CSS["next_page"]))


# ══════════════════════════════════════════════════════════════════════════════
#  SCRAPER PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════

class CarrefourScraper:
    """
    Scraper Carrefour Maroc.
    Utilise Selenium si disponible, sinon requests.
    """

    def __init__(self, use_selenium: bool = True, max_pages: int = 10):
        self.use_selenium = use_selenium
        self.max_pages    = max_pages
        self.driver       = None
        self._fetcher     = None

        if use_selenium:
            logger.info("Initialisation Chrome headless...")
            self.driver = build_driver()
            if self.driver:
                self._fetcher = lambda url: fetch_html_selenium(self.driver, url)
                logger.info("✅ Selenium prêt")
            else:
                logger.warning("⚠️  Selenium indisponible — fallback requests")
                self._fetcher = fetch_html_requests
        else:
            self._fetcher = fetch_html_requests

    def scrape_category(self, cat_key: str) -> list[Product]:
        """Scrape toutes les pages d'une catégorie + sous-catégories."""
        if cat_key not in CATEGORIES:
            logger.error(f"Catégorie inconnue: {cat_key}. Disponibles: {list(CATEGORIES.keys())}")
            return []

        config = CATEGORIES[cat_key]
        label  = config["label"]
        all_products: list[Product] = []
        seen_names: set[str] = set()

        # URLs à scraper : catégorie principale + sous-catégories
        urls_to_scrape = [config["url"]] + config.get("subs", [])

        for url_path in urls_to_scrape:
            logger.info(f"📦 Scraping : {url_path}")
            page_products = self._scrape_paginated(url_path, label)

            # Déduplication sur le nom
            for p in page_products:
                key = p.nom.lower().strip()
                if key not in seen_names:
                    seen_names.add(key)
                    all_products.append(p)

        logger.info(f"✅ Catégorie '{cat_key}' : {len(all_products)} produits uniques")
        return all_products

    def scrape_all(self) -> list[Product]:
        """Scrape toutes les catégories configurées."""
        all_products = []
        for cat_key in CATEGORIES:
            logger.info(f"\n{'═'*50}")
            logger.info(f"CATÉGORIE : {cat_key.upper()}")
            logger.info(f"{'═'*50}")
            products = self.scrape_category(cat_key)
            all_products.extend(products)
        return all_products

    def _scrape_paginated(self, url_path: str, label: str) -> list[Product]:
        """Scrape toutes les pages d'une URL de catégorie."""
        products = []

        for page in range(1, self.max_pages + 1):
            # Carrefour MA utilise ?p= ou ?page= selon les sections
            sep  = "&" if "?" in url_path else "?"
            url  = f"{BASE_URL}{url_path}{sep}p={page}"

            logger.info(f"  Page {page}/{self.max_pages} — {url}")
            html = self._fetcher(url)

            if not html:
                logger.warning(f"  ⚠️  Page vide ou inaccessible — arrêt pagination")
                break

            page_products = parse_page(html, label)

            if not page_products:
                logger.info(f"  ℹ️  Aucun produit page {page} — fin de la catégorie")
                break

            products.extend(page_products)
            logger.info(f"  ✅ {len(page_products)} produits (total: {len(products)})")

            if not has_next_page(html):
                logger.info(f"  ℹ️  Dernière page atteinte")
                break

        return products

    def close(self):
        """Ferme le driver Selenium proprement."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Chrome fermé")
            except Exception:
                pass


# ══════════════════════════════════════════════════════════════════════════════
#  SAUVEGARDE CSV
# ══════════════════════════════════════════════════════════════════════════════

def save_csv(products: list[Product], output_path: Path) -> None:
    """
    Sauvegarde les produits en CSV.
    Colonnes compatibles avec le pipeline ML (store_name, nom, prix, categorie, ...).
    """
    if not products:
        logger.warning("Aucun produit à sauvegarder")
        return

    dicts     = [p.to_dict() for p in products]
    fieldnames = list(dicts[0].keys())

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:  # utf-8-sig = BOM Excel
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dicts)

    size_kb = output_path.stat().st_size // 1024
    logger.info(f"💾 Sauvegardé : {output_path}  ({len(products)} lignes, {size_kb} KB)")


def print_summary(products: list[Product]) -> None:
    """Affiche un résumé des produits scrapés."""
    if not products:
        print("\n⚠️  Aucun produit scrapé")
        return

    prices     = [p.prix for p in products if p.prix]
    promos     = [p for p in products if p.remise_pct]
    by_cat     = {}
    by_brand   = {}

    for p in products:
        by_cat[p.categorie]   = by_cat.get(p.categorie, 0) + 1
        by_brand[p.marque]    = by_brand.get(p.marque, 0) + 1

    print(f"\n{'═'*55}")
    print(f"  RÉSUMÉ SCRAPING CARREFOUR MAROC")
    print(f"{'═'*55}")
    print(f"  Total produits     : {len(products)}")
    print(f"  En promotion       : {len(promos)} ({len(promos)*100//len(products)}%)")
    if prices:
        print(f"  Prix min           : {min(prices):.2f} DH")
        print(f"  Prix moy           : {sum(prices)/len(prices):.2f} DH")
        print(f"  Prix max           : {max(prices):.2f} DH")

    print(f"\n  Par catégorie :")
    for cat, count in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"    {cat:<40} {count:>4} produits")

    top_brands = sorted(by_brand.items(), key=lambda x: -x[1])[:8]
    if top_brands:
        print(f"\n  Top marques :")
        for brand, count in top_brands:
            if brand:
                print(f"    {brand:<30} {count:>4} produits")

    print(f"\n  Exemple de produits :")
    for p in products[:5]:
        promo = f"  🔻-{p.remise_pct}%" if p.remise_pct else ""
        print(f"    {p.nom[:45]:<45}  {p.prix:>8.2f} DH{promo}")
    print()


# ══════════════════════════════════════════════════════════════════════════════
#  POINT D'ENTRÉE
# ══════════════════════════════════════════════════════════════════════════════

def parse_args():
    parser = argparse.ArgumentParser(description="Scraper Carrefour Maroc")
    parser.add_argument(
        "--category", choices=list(CATEGORIES.keys()),
        help="Scrape une seule catégorie (défaut: toutes)",
    )
    parser.add_argument(
        "--no-selenium", action="store_true",
        help="Utilise requests au lieu de Selenium (plus rapide, peut bloquer)",
    )
    parser.add_argument(
        "--max-pages", type=int, default=10,
        help="Nombre max de pages par catégorie (défaut: 10)",
    )
    parser.add_argument(
        "--output", default="carrefour_products.csv",
        help="Fichier CSV de sortie (défaut: carrefour_products.csv)",
    )
    return parser.parse_args()


def main():
    args    = parse_args()
    use_sel = not args.no_selenium
    out     = Path(args.output)

    print(f"""
╔══════════════════════════════════════════════╗
║   CARREFOUR MAROC SCRAPER                   ║
║   Selenium : {'✅ activé' if use_sel else '❌ désactivé (mode requests)'}           ║
║   Max pages: {args.max_pages:<3}                           ║
║   Output   : {str(out):<32}║
╚══════════════════════════════════════════════╝
""")

    scraper = CarrefourScraper(use_selenium=use_sel, max_pages=args.max_pages)

    try:
        if args.category:
            products = scraper.scrape_category(args.category)
        else:
            products = scraper.scrape_all()
    finally:
        scraper.close()

    print_summary(products)
    if products:
        save_csv(products, out)
        print(f"✅ Fichier prêt : {out.resolve()}")
        print(f"   Commande pandas : df = pd.read_csv('{out}')")
    else:
        print("⚠️  Aucun produit — vérifie ta connexion ou essaie --no-selenium")


if __name__ == "__main__":
    main()