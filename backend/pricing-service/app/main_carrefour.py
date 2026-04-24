# main_marjane.py
import time
import pandas as pd
import os

from app.services.scraping.marjane_scraper import MarjaneScraper

def main():
    print("🚀 Démarrage du scraping Marjane")
    print("="*50)
    
    # Configuration
    # Mettre headless=False pour voir le scraping en action
    scraper = MarjaneScraper(headless=False)
    
    try:
        # Scraper TOUTES les catégories (sans limite)
        # Pour tester une seule catégorie, décommente la ligne suivante
        # produits = scraper.scrape_categorie(
        #     "https://marjane.ma/courses-en-ligne/5-charcuterie-traiteur-de-la-mer",
        #     "Charcuterie_traiteur_mer"
        # )
        
        # Scraper toutes les catégories
        produits = scraper.scrape_marjane_complet(max_products_per_category=None)  # None = pas de limite
        
        # Sauvegarder dans data/raw/
        os.makedirs("data/raw", exist_ok=True)
        df = scraper.save_to_csv("data/raw/marjane_products.csv")
        
        # Afficher stats
        if df is not None:
            print("\n📊 Statistiques:")
            print(f"Total produits: {len(df)}")
            print(f"Catégories: {len(df['categorie'].unique())}")
            print(f"Prix moyen: {df['prix'].mean():.2f} DH")
            print(f"Produits en promo: {df['promotion'].sum()}")
            
            # Stats par catégorie
            print("\n📊 Produits par catégorie:")
            print(df.groupby('categorie').size().sort_values(ascending=False))
    
    except Exception as e:
        print(f"❌ Erreur principale: {e}")
    
    finally:
        scraper.close()
        print("\n✅ Scraping terminé")

if __name__ == "__main__":
    main()