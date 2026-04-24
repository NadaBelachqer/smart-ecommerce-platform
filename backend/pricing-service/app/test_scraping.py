 # test_scraping.py
import sys
import os

from app.services.scrapers.CarrefourScraper import CarrefourScraper

# Ajoute le chemin du projet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configuration des logs
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

print("="*60)
print("🛒 TEST DU SCRAPING - DÉMARRAGE")
print("="*60)

# Test du scraper Carrefour
print("\n📌 TEST 1: Scraper Carrefour (1 catégorie)")
print("-"*40)

try:
    
    scraper = CarrefourScraper()
    print(f"✅ Scraper Carrefour initialisé")
    
    # Test avec une seule catégorie
    produits = scraper.scrape_category("alimentaire_boissons")
    
    print(f"📊 Produits trouvés: {len(produits)}")
    
    for i, p in enumerate(produits[:5]):
        print(f"\n  Produit {i+1}:")
        print(f"    Nom: {p.product_name}")
        print(f"    Prix: {p.price} DH")
        print(f"    Disponible: {p.availability}")
        
except Exception as e:
    print(f"❌ Erreur Carrefour: {e}")

print("\n" + "="*60)
print("✅ Test terminé")