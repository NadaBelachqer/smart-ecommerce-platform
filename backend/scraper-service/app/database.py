import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from contextlib import contextmanager

# Chemin absolu vers la DB — fonctionne quel que soit le répertoire courant
DB_PATH = Path(__file__).parent.parent / "data" / "scraper.db"


@contextmanager
def get_conn():
    """Context manager — ouvre et ferme proprement la connexion."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # accès par nom de colonne
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Crée les tables et index si ils n'existent pas."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS competitor_prices (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                nom         TEXT NOT NULL,
                nom_tokens  TEXT NOT NULL,
                categorie   TEXT NOT NULL,
                price       REAL NOT NULL,
                currency    TEXT NOT NULL DEFAULT 'MAD',
                source      TEXT NOT NULL,
                scraped_at  TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_categorie
                ON competitor_prices(categorie);

            CREATE INDEX IF NOT EXISTS idx_source
                ON competitor_prices(source);

            CREATE INDEX IF NOT EXISTS idx_scraped_at
                ON competitor_prices(scraped_at);

            CREATE TABLE IF NOT EXISTS scrape_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                source      TEXT NOT NULL,
                started_at  TEXT NOT NULL,
                finished_at TEXT,
                nb_products INTEGER DEFAULT 0,
                status      TEXT DEFAULT 'running',
                error_msg   TEXT
            );
        """)
    print(f"[DB] Initialisée → {DB_PATH}")


def upsert_products(products: list[dict], source: str):
    """
    Remplace tous les produits d'une source par les nouveaux.
    Opération atomique : si le scraping échoue à mi-chemin,
    les anciennes données restent intactes.
    """
    if not products:
        print(f"[DB] Aucun produit à insérer pour {source}")
        return 0

    now = datetime.utcnow().isoformat()

    with get_conn() as conn:
        # Supprimer les anciens de cette source
        conn.execute("DELETE FROM competitor_prices WHERE source = ?", (source,))

        # Insérer les nouveaux en batch
        conn.executemany("""
            INSERT INTO competitor_prices
                (nom, nom_tokens, categorie, price, currency, source, scraped_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                p["nom"],
                json.dumps(p.get("nom_tokens", []), ensure_ascii=False),
                p.get("categorie", "inconnu"),
                p["price"],
                p.get("currency", "MAD"),
                source,
                now,
            )
            for p in products
            if p.get("nom") and p.get("price")  # filtre sécurité
        ])

    count = len(products)
    print(f"[DB] {count} produits insérés (source={source})")
    return count


def get_all_recent(max_age_hours: int = 12) -> list[dict]:
    """Tous les produits scrapés récemment, toutes sources."""
    cutoff = (datetime.utcnow() - timedelta(hours=max_age_hours)).isoformat()
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT nom, nom_tokens, categorie, price, currency, source
            FROM competitor_prices
            WHERE scraped_at > ?
            ORDER BY price ASC
        """, (cutoff,)).fetchall()
    return _rows_to_dicts(rows)


def get_by_category(category: str, max_age_hours: int = 12) -> list[dict]:
    """Produits d'une catégorie spécifique."""
    cutoff = (datetime.utcnow() - timedelta(hours=max_age_hours)).isoformat()
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT nom, nom_tokens, categorie, price, currency, source
            FROM competitor_prices
            WHERE categorie = ? AND scraped_at > ?
            ORDER BY price ASC
        """, (category, cutoff)).fetchall()
    return _rows_to_dicts(rows)


def get_stats() -> dict:
    """Statistiques pour le dashboard /stats."""
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM competitor_prices").fetchone()[0]
        by_source = conn.execute("""
            SELECT source, COUNT(*) as nb, MAX(scraped_at) as last_scrape
            FROM competitor_prices
            GROUP BY source
        """).fetchall()
        last_log = conn.execute("""
            SELECT source, status, finished_at, nb_products, error_msg
            FROM scrape_log
            ORDER BY id DESC LIMIT 10
        """).fetchall()

    return {
        "total_products": total,
        "by_source": [dict(r) for r in by_source],
        "recent_scrapes": [dict(r) for r in last_log],
    }


def log_scrape_start(source: str) -> int:
    """Enregistre le début d'un scraping. Retourne l'ID du log."""
    with get_conn() as conn:
        cursor = conn.execute("""
            INSERT INTO scrape_log (source, started_at, status)
            VALUES (?, ?, 'running')
        """, (source, datetime.utcnow().isoformat()))
        return cursor.lastrowid


def log_scrape_end(log_id: int, nb_products: int, error: str = None):
    """Enregistre la fin d'un scraping."""
    status = "error" if error else "success"
    with get_conn() as conn:
        conn.execute("""
            UPDATE scrape_log
            SET finished_at = ?, nb_products = ?, status = ?, error_msg = ?
            WHERE id = ?
        """, (datetime.utcnow().isoformat(), nb_products, status, error, log_id))


def _rows_to_dicts(rows) -> list[dict]:
    result = []
    for r in rows:
        result.append({
            "nom": r["nom"],
            "nom_tokens": json.loads(r["nom_tokens"]),
            "categorie": r["categorie"],
            "price": r["price"],
            "currency": r["currency"],
            "source": r["source"],
        })
    return result