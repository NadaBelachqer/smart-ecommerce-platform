# aswak_scraper.py
import time
import random
import re
import requests
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from bs4 import BeautifulSoup
import pandas as pd

@dataclass
class AswakProduct:
    nom: str
    prix: float
    prix_original: Optional[float]
    categorie: str
    marque: Optional[str]
    promotion: bool
    disponibilite: str
    image_url: Optional[str]
    store_name: str = "aswak_assalam"

class AswakScraper:
    def __init__(self, use_selenium: bool = False):
        self.use_selenium = use_selenium
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr,fr-FR;q=0.8,en;q=0.5'
        })
    
    def _random_delay(self, min_sec: float = 1, max_sec: float = 3):
        time.sleep(random.uniform(min_sec, max_sec))
    
    def _extract_price(self, price_text: str) -> Tuple[float, Optional[float]]:
        """Extrait le prix actuel et le prix original"""
        prix_actuel = None
        prix_original = None
        
        # Pattern pour prix barré/soldé: "~~36,20 Dh~~ 33,90 Dh"
        sale_pattern = r'~~(\d+[.,]\d{2})\s*Dh~~\s*(\d+[.,]\d{2})\s*Dh'
        match = re.search(sale_pattern, price_text, re.IGNORECASE)
        
        if match:
            prix_original = float(match.group(1).replace(',', '.'))
            prix_actuel = float(match.group(2).replace(',', '.'))
        else:
            normal_pattern = r'(\d+[.,]\d{2})\s*Dh'
            match = re.search(normal_pattern, price_text, re.IGNORECASE)
            if match:
                prix_actuel = float(match.group(1).replace(',', '.'))
        
        return prix_actuel, prix_original
    
    def _extract_marque(self, nom: str) -> Optional[str]:
        marques = ['JANIS', 'KENZ', 'LUXOR', 'CAMPO', 'ALSA', 'SULTAN', 
                   'SELHAM', 'X-KORN', 'JNANE', 'ENMER', 'MACAO', 'AIGUEBELLE',
                   'AÏN SOLTANE', 'COCA-COLA', 'MARRAKECH', 'AL BOUSTANE',
                   'TAOUS', 'GARNIER', 'ELSEVE', 'ARIEL', 'SELPAK', 'SANY', 'IGOR', 'FOLIA']
        
        for marque in marques:
            if marque in nom.upper():
                return marque
        return None
    
    def scrape_category_page(self, url: str, category_name: str, page_num: int = 1) -> List[AswakProduct]:
        """Scrape une page spécifique d'une catégorie"""
        page_url = f"{url}page/{page_num}/" if page_num > 1 else url
        products = []
        
        try:
            print(f"  📄 Page {page_num}: {page_url}")
            response = self.session.get(page_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Sélecteurs pour les produits
            product_elements = soup.select('.product-item, .product, li.product, .product-wrapper, article')
            
            if not product_elements:
                print(f"    ⚠️ Aucun produit trouvé sur page {page_num}")
                return []
            
            for element in product_elements:
                try:
                    # Nom
                    nom_elem = element.select_one('.product-title, .product-name, h2, h3, .woocommerce-loop-product__title')
                    if not nom_elem:
                        continue
                    nom = nom_elem.text.strip()
                    
                    # Prix
                    price_elem = element.select_one('.price, .product-price, .amount')
                    if not price_elem:
                        continue
                    
                    prix_actuel, prix_original = self._extract_price(price_elem.text)
                    
                    if not prix_actuel:
                        continue
                    
                    # Image
                    img_elem = element.select_one('img')
                    image_url = img_elem.get('src') or img_elem.get('data-src') if img_elem else None
                    
                    # Promotion
                    promotion = prix_original is not None
                    
                    # Disponibilité
                    disponibilite = "En stock"
                    stock_elem = element.select_one('.stock, .availability')
                    if stock_elem and 'rupture' in stock_elem.text.lower():
                        disponibilite = "Rupture"
                    
                    # Marque
                    marque = self._extract_marque(nom)
                    
                    products.append(AswakProduct(
                        nom=nom,
                        prix=prix_actuel,
                        prix_original=prix_original,
                        categorie=category_name,
                        marque=marque,
                        promotion=promotion,
                        disponibilite=disponibilite,
                        image_url=image_url
                    ))
                    
                except Exception as e:
                    continue
            
            print(f"    ✅ {len(products)} produits trouvés")
            return products
            
        except Exception as e:
            print(f"    ❌ Erreur page {page_num}: {e}")
            return []
    
    def scrape_category_complete(self, url: str, category_name: str, max_pages: int = 7) -> List[AswakProduct]:
        """Scrape TOUTES les pages d'une catégorie"""
        all_products = []
        
        for page in range(1, max_pages + 1):
            products = self.scrape_category_page(url, category_name, page)
            
            if not products:
                break
            
            all_products.extend(products)
            self._random_delay(1, 2)
        
        if all_products:
            print(f"\n📊 {category_name}: {len(all_products)} produits")
        else:
            print(f"\n⚠️ {category_name}: Aucun produit trouvé")
        
        return all_products
    
    def scrape_all_categories(self, max_pages: int = 7) -> Dict[str, List[AswakProduct]]:
        """Scrape toutes les catégories"""
        
        categories = {
            "Boulangerie": "https://aswakassalam.com/product-category/boulangerie/",
            "Fruits_Legumes": "https://aswakassalam.com/product-category/fruits-legumes/",
            "Boucherie_Volaille": "https://aswakassalam.com/product-category/boucherie-volaille/",
            "Charcuterie_Traiteur": "https://aswakassalam.com/product-category/charcuterie-traiteur/",
            "Cremerie": "https://aswakassalam.com/product-category/cremerie/",
            "Epicerie": "https://aswakassalam.com/product-category/epicerie/",
            "Biscuiterie_Confiserie": "https://aswakassalam.com/product-category/biscuiterie-confiserie/",
            "Boissons": "https://aswakassalam.com/product-category/boissons/",
            "Beaute_Hygiene": "https://aswakassalam.com/product-category/beaute-hygiene/",
            "Entretien": "https://aswakassalam.com/product-category/entretien/",
            "Multimedia": "https://aswakassalam.com/product-category/multimedia/"
        }
        
        all_data = {}
        
        for cat_name, cat_url in categories.items():
            print(f"\n{'='*50}")
            print(f"🔄 Scraping: {cat_name}")
            print(f"{'='*50}")
            
            products = self.scrape_category_complete(cat_url, cat_name, max_pages)
            all_data[cat_name] = products
            
            # Pause entre catégories
            self._random_delay(2, 4)
        
        return all_data
    
    def save_to_csv(self, all_products: Dict[str, List[AswakProduct]], filename: str = "aswak_products.csv"):
        """Sauvegarde tous les produits dans un CSV"""
        all_rows = []
        for category, products in all_products.items():
            for product in products:
                all_rows.append(asdict(product))
        
        if not all_rows:
            print("⚠️ Aucun produit à sauvegarder")
            return None
        
        df = pd.DataFrame(all_rows)
        df.to_csv(filename, index=False, encoding='utf-8')
        print(f"\n💾 Données sauvegardées dans {filename}")
        print(f"📊 Total: {len(df)} produits")
        
        return df
    
    def close(self):
        """Ferme les connexions"""
        self.session.close()