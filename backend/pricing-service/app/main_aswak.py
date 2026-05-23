# main_aswak.py
import os
import sys
import time
from datetime import datetime

# Ajouter le chemin parent
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.scraping.aswak_scraper import AswakScraper

def main():
    print("="*60)
    print("🛒 SCRAPING ASWAK ASSALAM")
    print("="*60)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Créer le dossier data/raw
    os.makedirs("data/raw", exist_ok=True)
    
    scraper = AswakScraper(use_selenium=False)
    
    try:
        start_time = time.time()
        
        # Scraper toutes les catégories
        all_products = scraper.scrape_all_categories(max_pages=7)
        
        elapsed = time.time() - start_time
        
        # Statistiques
        total = sum(len(p) for p in all_products.values())
        categories_with_products = sum(1 for p in all_products.values() if p)
        
        print("\n" + "="*60)
        print("📊 RÉSULTATS")
        print("="*60)
        print(f"⏱️  Temps: {elapsed:.2f}s")
        print(f"📁 Catégories: {len(all_products)}")
        print(f"✅ Avec produits: {categories_with_products}")
        print(f"🎁 Total produits: {total}")
        print()
        
        # Détail par catégorie
        print("📈 Détail par catégorie:")
        for category, products in sorted(all_products.items(), key=lambda x: len(x[1]), reverse=True):
            if products:
                promo = sum(1 for p in products if p.promotion)
                print(f"   • {category}: {len(products)} produits ({promo} en promo)")
        
        # Sauvegarder
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/raw/aswak_products_{timestamp}.csv"
        scraper.save_to_csv(all_products, filename)
        
        # Sauvegarder aussi latest
        scraper.save_to_csv(all_products, "data/raw/aswak_products_latest.csv")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        scraper.close()
        print("\n✅ Scraping terminé")

if __name__ == "__main__":
    main()