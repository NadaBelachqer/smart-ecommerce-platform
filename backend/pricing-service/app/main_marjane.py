# main_marjane.py
import time
import pandas as pd
import os

from app.services.scraping.marjane_scraper import MarjaneScraper

def main():
    print("🚀 Démarrage du scraping Marjane")
    print("="*50)
    
    # Configuration
    scraper = MarjaneScraper(headless=False)
    
    try:
        produits = scraper.scrape_marjane_complet(max_products_per_category=None)
        
        # Sauvegarder
        os.makedirs("data/raw", exist_ok=True)
        df = scraper.save_to_csv("data/raw/marjane_products.csv")
        
        # Afficher stats
        if df is not None:
            print("\n📊 Statistiques:")
            print(f"Total produits: {len(df)}")
            print(f"Catégories: {df['categorie'].nunique()}")
            print(f"Prix moyen: {df['prix'].mean():.2f} DH")
            print(f"Produits en promo: {df['promotion'].sum()}")
            
            # Détail par catégorie
            print("\n📊 Produits par catégorie:")
            print(df.groupby('categorie').size().sort_values(ascending=False))
    
    except Exception as e:
        print(f"❌ Erreur principale: {e}")
    
    finally:
        scraper.close()
        print("\n✅ Scraping terminé")

if __name__ == "__main__":
    main()