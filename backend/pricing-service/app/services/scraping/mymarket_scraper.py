import requests
from bs4 import BeautifulSoup
import re
import pandas as pd
import time


class MyMarketScraper:

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0"
        }

        # ✅ AJOUT DES CATEGORIES REELLES
        self.categories = [
            "https://www.mymarket.ma/collections/alimentation",
            "https://www.mymarket.ma/collections/bio",
            "https://www.mymarket.ma/collections/legumes",
            "https://www.mymarket.ma/collections/fruits",
            "https://www.mymarket.ma/collections/boissons",
            "https://www.mymarket.ma/collections/surgeles",
            "https://www.mymarket.ma/collections/epicerie-sucree",
            "https://www.mymarket.ma/collections/epicerie-salee",
            "https://www.mymarket.ma/collections/cremerie",
            "https://www.mymarket.ma/collections/petit-dejeuner",
            "https://www.mymarket.ma/collections/pains-et-patisserie",
            "https://www.mymarket.ma/collections/sans-gluten",
            "https://www.mymarket.ma/collections/bebe",
            "https://www.mymarket.ma/collections/hygiene-et-beaute",
            "https://www.mymarket.ma/collections/entretien-et-maison",
            "https://www.mymarket.ma/collections/animaux"
            



        ]

    # -------------------------
    # FETCH PAGE
    # -------------------------
    def fetch_page(self, url):
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"[ERROR] {url} -> {e}")
            return None

    # -------------------------
    # CLEAN NAME
    # -------------------------
    def clean_product_name(self, name):

        unwanted_phrases = [
            "Diapositive précédente",
            "Diapositive suivante",
            "Augmenter la quantité pour Default Title",
            "Diminuer la quantité pour Default Title",
            "Deals of the week",
            "En stock",
            "Prix",
            "Default Title"
        ]

        for phrase in unwanted_phrases:
            name = name.replace(phrase, "")

        return " ".join(name.split()).strip()

    # -------------------------
    # EXTRACT PRODUCTS
    # -------------------------
    def extract_products(self, text, category):

        products = []
        seen = set()

        pattern = r"([A-Za-zÀ-ÿ0-9'’\-\s]{10,200})\s+En stock.*?Dh\s*([0-9]+(?:\.[0-9]+)?)"

        matches = re.findall(pattern, text, re.DOTALL)

        for i, match in enumerate(matches):

            name = self.clean_product_name(match[0])
            price = float(match[1])

            if len(name) < 5:
                continue

            key = (name, price)

            if key in seen:
                continue

            seen.add(key)

            product = {
                "sku": f"MYM-{len(products)+1:04d}",
                "nom": name,
                "categorie": category,
                "price": price,
                "desc": name,
                "currency": "MAD",
                "source": "MyMarket"
            }

            products.append(product)

        return products

    # -------------------------
    # SCRAPE ONE CATEGORY
    # -------------------------
    def scrape_category(self, base_url, category_name):

        all_products = []

        print(f"\n🔥 CATEGORY: {base_url}")

        for page in range(0, 5):  # pagination simple

            url = f"{base_url}?page={page}"
            print(f"Scraping: {url}")

            html = self.fetch_page(url)

            if not html:
                continue

            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text(" ", strip=True)

            products = self.extract_products(text, category_name)

            if not products:
                print("No products on page → stop pagination")
                break

            all_products.extend(products)

            time.sleep(1)

        return all_products

    # -------------------------
    # MAIN SCRAPING
    # -------------------------
    def scrape_all(self):

        all_products = []

        print("🚀 STARTING FULL SCRAPING...")

        for cat_url in self.categories:

            category_name = cat_url.split("/")[-1]

            products = self.scrape_category(cat_url, category_name)

            print(f"Products found: {len(products)}")

            all_products.extend(products)

        print("\n===================")
        print(f"TOTAL PRODUCTS: {len(all_products)}")
        print("===================\n")

        return all_products

    # -------------------------
    # SAVE CSV
    # -------------------------
    def save_to_csv(self, products):

        if not products:
            print("⚠ No data")
            return

        df = pd.DataFrame(products)

        path = "app/data/raw/mymarket_products.csv"

        df.to_csv(path, index=False, encoding="utf-8-sig")

        print(f"✅ CSV saved successfully → {path}")




        from app.services.scraping.mymarket_scraper import MyMarketScraper

