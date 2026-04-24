import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import time


class CarrefourScraper:

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0"
        }

        self.categories = [
            "https://carrefour.ma/"        ]

    def fetch_page(self, url):
        try:
            r = requests.get(url, headers=self.headers, timeout=20)
            r.raise_for_status()
            return r.text
        except Exception as e:
            print(f"[ERROR] {url} -> {e}")
            return None

    def extract_price(self, text):
        match = re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*Dhs", text)

        if match:
            return float(match.group(1).replace(",", "."))

        return None

    def extract_products(self, html, category):
        soup = BeautifulSoup(html, "html.parser")

        products = []
        seen = set()

        # chercher tous les liens produit
        product_links = soup.find_all("a", href=True)

        for i, link in enumerate(product_links):
            href = link["href"]

            if "/produit/" not in href:
                continue

            name = link.get_text(" ", strip=True)

            parent_text = link.parent.get_text(" ", strip=True)

            price = self.extract_price(parent_text)

            if not name or price is None:
                continue

            key = (name.lower(), price)

            if key in seen:
                continue

            seen.add(key)

            products.append({
                "sku": f"CRF-{len(products)+1:04d}",
                "nom": name,
                "categorie": category,
                "price": price,
                "desc": parent_text,
                "currency": "MAD",
                "source": "Carrefour"
            })

        return products

    def scrape_all(self):
        all_products = []

        for url in self.categories:
            print(f"\n🔥 Scraping: {url}")

            html = self.fetch_page(url)

            if not html:
                continue

            category = url.split("/")[-2]

            products = self.extract_products(html, category)

            print(f"✅ Found: {len(products)}")

            all_products.extend(products)

            time.sleep(1)

        print(f"\nTOTAL = {len(all_products)}")

        return all_products

    def save_to_csv(self, products):
        if not products:
            print("⚠ No data")
            return

        df = pd.DataFrame(products)

        path = "app/data/raw/carrefour_products.csv"

        df.to_csv(path, index=False, encoding="utf-8-sig")

        print(f"✅ Saved -> {path}")