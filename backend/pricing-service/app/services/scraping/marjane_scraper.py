# marjane_scraper.py - Version corrigée avec meilleure gestion de pagination

import time
import random
import re
from typing import List, Optional
from dataclasses import dataclass, asdict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import pandas as pd
from fake_useragent import UserAgent

@dataclass
class MarjaneProduct:
    nom: str
    prix: float
    categorie: str
    store_name: str = "marjane"
    prix_original: Optional[float] = None
    unite: Optional[str] = None
    promotion: bool = False

class MarjaneScraper:
    def __init__(self, headless: bool = False):  # Mettre False pour debug
        self.ua = UserAgent()
        self.driver = self._setup_driver(headless)
        self.wait = WebDriverWait(self.driver, 20)  # Augmenté à 20 secondes
        self.products = []
        
    def _setup_driver(self, headless: bool) -> webdriver.Chrome:
        """Configure Chrome avec options anti-détection"""
        chrome_options = Options()
        
        if headless:
            chrome_options.add_argument("--headless")
        
        # Options anti-détection renforcées
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument(f"--user-agent={self.ua.random}")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Performance et stabilité
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
    
    def _random_delay(self, min_sec: float = 2, max_sec: float = 5):
        """Pause aléatoire pour éviter le blocage"""
        time.sleep(random.uniform(min_sec, max_sec))
    
    def _human_like_scroll(self):
        """Scroll comme un humain"""
        scroll_pause = random.uniform(0.5, 1.5)
        scroll_amount = random.randint(300, 700)
        self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
        time.sleep(scroll_pause)
    
    def _extract_price(self, price_text: str) -> float:
        """Extrait le prix numérique du texte"""
        match = re.search(r'(\d+)[\s.,]*(\d{0,2})\s*(?:DH|dhs|MAD)?', price_text, re.IGNORECASE)
        if match:
            euros = match.group(1)
            cents = match.group(2) if match.group(2) else '00'
            price_str = f"{euros}.{cents}" if '.' not in euros else euros
            return float(price_str.replace(',', '.'))
        return 0.0
    
    def _click_load_more(self, max_clicks: int = 100) -> int:
        """Clique sur 'AFFICHER PLUS' avec meilleure détection"""
        clicks = 0
        previous_height = 0
        
        for i in range(max_clicks):
            try:
                # Attendre que le bouton soit présent
                time.sleep(random.uniform(2, 4))
                
                # Chercher le bouton "AFFICHER PLUS" (sélecteur exact pour Marjane)
                load_button = None
                
                # Essayer différents sélecteurs spécifiques à Marjane
                selectors = [
                    "button.btn.btn-primary.load-more-btn",
                    "button.load-more-btn",
                    ".load-more-btn",
                    "button:contains('AFFICHER PLUS')",
                    "//button[contains(text(), 'AFFICHER PLUS')]",
                    "//button[contains(@class, 'load')]"
                ]
                
                for selector in selectors:
                    try:
                        if selector.startswith("//"):
                            load_button = self.driver.find_element(By.XPATH, selector)
                        elif "contains" in selector:
                            text = selector.split(":contains('")[1].split("')")[0]
                            load_button = self.driver.find_element(By.XPATH, f"//button[contains(text(), '{text}')]")
                        else:
                            load_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if load_button and load_button.is_displayed():
                            break
                    except:
                        continue
                
                if not load_button or not load_button.is_displayed():
                    print(f"   ✅ Bouton non trouvé après {clicks} clics")
                    break
                
                # Scroll jusqu'au bouton
                self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", load_button)
                self._random_delay(1, 2)
                
                # Vérifier si de nouveaux produits se chargent
                current_height = self.driver.execute_script("return document.body.scrollHeight")
                if current_height == previous_height and clicks > 0:
                    print(f"   📏 Hauteur inchangée, plus de produits à charger")
                    break
                previous_height = current_height
                
                # Cliquer avec JavaScript
                self.driver.execute_script("arguments[0].click();", load_button)
                clicks += 1
                print(f"   🔄 Clic {clicks} sur 'AFFICHER PLUS'...")
                
                # Attendre le chargement des nouveaux produits
                self._random_delay(3, 6)
                
                # Scroll progressif
                for _ in range(random.randint(2, 4)):
                    self._human_like_scroll()
                
            except Exception as e:
                print(f"   ℹ️ Fin du chargement: {str(e)[:50]}")
                break
        
        print(f"   📊 Total clics effectués: {clicks}")
        return clicks
    
    def scrape_categorie(self, url: str, categorie: str, max_products: int = None):
        """Scrape une catégorie spécifique"""
        print(f"\n📁 Scraping catégorie: {categorie}")
        print(f"🔗 URL: {url}")
        
        try:
            self.driver.get(url)
            self._random_delay(4, 7)
            
            # Scroll initial pour charger la page
            for _ in range(3):
                self._human_like_scroll()
            
            # 🔥 Gestion du bouton "AFFICHER PLUS" améliorée
            print(f"🔍 Recherche du bouton 'AFFICHER PLUS'...")
            clicks = self._click_load_more(max_clicks=100)
            
            # Scroll final
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            self._random_delay(2, 3)
            
            # Attendre que tous les produits soient chargés
            time.sleep(5)
            
            # Trouver tous les produits avec des sélecteurs plus larges
            products_elements = self.driver.find_elements(
                By.CSS_SELECTOR, 
                ".product-item, .product, article, [class*='product'], [class*='item'], li.product"
            )
            
            print(f"📦 Éléments HTML trouvés: {len(products_elements)}")
            
            if not products_elements:
                print(f"❌ Aucun produit trouvé pour {categorie}")
                return
            
            count = 0
            seen_names = set()  # Pour éviter les doublons
            
            for index, element in enumerate(products_elements):
                if max_products and count >= max_products:
                    break
                
                try:
                    # Extraction du nom
                    nom_selectors = [".product-title", ".product-name", "h3", "h2", ".name", "[class*='title']"]
                    nom = ""
                    for selector in nom_selectors:
                        try:
                            nom_elem = element.find_element(By.CSS_SELECTOR, selector)
                            nom = nom_elem.text.strip()
                            if nom and len(nom) > 2:
                                break
                        except:
                            continue
                    
                    if not nom or nom in seen_names or len(nom) < 3:
                        continue
                    
                    seen_names.add(nom)
                    
                    # Extraction du prix
                    prix_selectors = [".price", ".product-price", "[class*='price']", ".current-price", ".amount"]
                    prix = 0.0
                    
                    for selector in prix_selectors:
                        try:
                            price_elem = element.find_element(By.CSS_SELECTOR, selector)
                            price_text = price_elem.text.strip()
                            if price_text:
                                prix = self._extract_price(price_text)
                                if prix > 0:
                                    break
                        except:
                            continue
                    
                    # Vérifier si en promotion
                    promotion = False
                    try:
                        old_price = element.find_element(By.CSS_SELECTOR, ".old-price, .special, .promotion, [class*='old']")
                        if old_price:
                            promotion = True
                    except:
                        pass
                    
                    # Unité de mesure
                    unite = None
                    unite_patterns = ["kg", "L", "ml", "g", "pièce", "pack", "cl", "litre", "gramme"]
                    for pattern in unite_patterns:
                        if pattern.lower() in nom.lower():
                            unite = pattern
                            break
                    
                    if prix > 0:
                        product = MarjaneProduct(
                            nom=nom,
                            prix=prix,
                            categorie=categorie,
                            prix_original=None,
                            unite=unite,
                            promotion=promotion
                        )
                        self.products.append(product)
                        count += 1
                        
                        if count % 10 == 0:
                            print(f"   ✅ Progress: {count} produits extraits...")
                        else:
                            print(f"   ✅ [{count}] {nom[:40]}... - {prix} DH")
                
                except Exception as e:
                    continue
            
            print(f"📊 Total produits extraits pour {categorie}: {count}")
            
        except Exception as e:
            print(f"❌ Erreur majeure pour {categorie}: {e}")
    
    def scrape_marjane_complet(self, max_products_per_category: int = None):
        """Scrape l'ensemble des catégories Marjane"""
        
        categories = {
            "Charcuterie_traiteur_mer": "https://marjane.ma/courses-en-ligne/5-charcuterie-traiteur-de-la-mer",
            "Epicerie": "https://marjane.ma/courses-en-ligne/8-epicerie",
            "Bio_et_sante": "https://marjane.ma/courses-en-ligne/357-bio-et-sante",
            "Biscuits_snacking": "https://marjane.ma/courses-en-ligne/3-biscuits-snacking",
            "Petit_dejeuner": "https://marjane.ma/courses-en-ligne/12-petit-dejeuner",
            "Hygiene_beaute_soins": "https://marjane.ma/courses-en-ligne/9-hygiene-beaute-soins",
            "Entretien_nettoyage": "https://marjane.ma/courses-en-ligne/7-entretien-nettoyage"
        }
        
        total_products_before = len(self.products)
        
        for cat_name, cat_url in categories.items():
            print(f"\n{'='*60}")
            print(f"🔄 Scraping catégorie: {cat_name}")
            print(f"{'='*60}")
            
            self.scrape_categorie(cat_url, cat_name, max_products_per_category)
            
            # Pause entre catégories
            self._random_delay(5, 10)
        
        total_scraped = len(self.products) - total_products_before
        print(f"\n🎉 Total produits scrapés: {len(self.products)}")
        
        return self.products
    
    def save_to_csv(self, filename="marjane_products.csv"):
        """Sauvegarde les produits en CSV"""
        if not self.products:
            print("⚠️ Aucun produit à sauvegarder")
            return None
        
        df = pd.DataFrame([asdict(p) for p in self.products])
        df.to_csv(filename, index=False, encoding='utf-8')
        print(f"💾 Données sauvegardées dans {filename}")
        return df
    
    def close(self):
        if self.driver:
            self.driver.quit()