from abc import ABC, abstractmethod
from typing import Optional
import requests
import time
import re
import unicodedata


class BaseScraper(ABC):

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    ]
    _ua_index = 0

    def __init__(self):
        self.session = requests.Session()
        self.source_name = self.__class__.__name__.lower().replace("scraper", "")

    # ── HEADERS avec rotation User-Agent ──────────────────────────────────
    def _headers(self) -> dict:
        ua = self.USER_AGENTS[self._ua_index % len(self.USER_AGENTS)]
        self.__class__._ua_index += 1
        return {
            "User-Agent": ua,
            "Accept-Language": "fr-MA,fr;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": "https://www.google.com/",
            "DNT": "1",
        }

    # ── FETCH avec retry + backoff exponentiel ────────────────────────────
    def fetch(self, url: str, retries: int = 3, delay: float = 1.5) -> Optional[str]:
        for attempt in range(retries):
            try:
                r = self.session.get(url, headers=self._headers(), timeout=20)
                if r.status_code == 429:
                    wait = 10 * (attempt + 1)
                    print(f"  [429 Rate limit] Attente {wait}s...")
                    time.sleep(wait)
                    continue
                r.raise_for_status()
                return r.text
            except requests.exceptions.Timeout:
                print(f"  [Timeout] Tentative {attempt+1}/{retries} — {url}")
            except requests.exceptions.HTTPError as e:
                print(f"  [HTTP {e.response.status_code}] {url}")
                if e.response.status_code in (403, 404):
                    return None  # inutile de retry
            except Exception as e:
                print(f"  [Erreur] {e}")
            if attempt < retries - 1:
                wait = delay * (2 ** attempt)
                time.sleep(wait)
        return None

    # ── PARSER PRIX universel ─────────────────────────────────────────────
    @staticmethod
    def parse_price(text: str) -> Optional[float]:
        if not text:
            return None
        clean = re.sub(r"[^\d,.]", "", text.strip())
        if not clean:
            return None
        clean = clean.replace(",", ".")
        parts = clean.split(".")
        if len(parts) > 2:
            clean = "".join(parts[:-1]) + "." + parts[-1]
        try:
            v = float(clean)
            return v if v > 0 else None
        except ValueError:
            return None

    # ── NORMALISATION NOM ─────────────────────────────────────────────────
    @staticmethod
    def normalize_name(text: str) -> list:
        nfkd = unicodedata.normalize("NFKD", text)
        ascii_str = nfkd.encode("ascii", "ignore").decode()
        clean = re.sub(r"[^a-z0-9\s]", " ", ascii_str.lower())
        stop = {"de","du","des","le","la","les","un","une","au","et","en","par","pour"}
        return [t for t in clean.split() if t and t not in stop]

    # ── MÉTHODES ABSTRAITES — à implémenter par chaque scraper ────────────
    @abstractmethod
    def scrape_all(self) -> list:
        """Lance le scraping complet. Retourne liste de dicts produits."""
        pass

    @abstractmethod
    def scrape_category(self, category_slug: str) -> list:
        """Scrape une catégorie. Retourne liste de dicts produits."""
        pass

    # ── FORMAT PRODUIT STANDARD ───────────────────────────────────────────
    def make_product(self, name: str, price: float, category: str) -> dict:
        return {
            "nom": name,
            "nom_tokens": self.normalize_name(name),
            "categorie": category,
            "price": price,
            "currency": "MAD",
            "source": self.source_name,
        }