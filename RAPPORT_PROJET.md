# Rapport de projet - Smart E-Commerce Platform

## Page de garde

**Titre du projet :** Smart E-Commerce Platform  
**Nature du projet :** Plateforme e-commerce intelligente basee sur une architecture microservices  
**Filiere / formation :** [A completer]  
**Realise par :** [A completer]  
**Encadre par :** [A completer]  
**Etablissement :** [A completer]  
**Annee universitaire :** [A completer]  

---

# Introduction generale

Le commerce electronique occupe aujourd'hui une place centrale dans la transformation numerique des entreprises. Les clients recherchent des experiences d'achat rapides, simples et fiables, tandis que les entreprises doivent gerer efficacement leurs catalogues, leurs stocks, leurs commandes et leurs prix dans un environnement fortement concurrentiel.

Dans ce contexte, le projet **Smart E-Commerce Platform** vise a concevoir et developper une plateforme e-commerce moderne capable de repondre a la fois aux besoins des clients et aux besoins d'administration. L'application propose une interface client pour consulter les produits, gerer un panier et passer des commandes, ainsi qu'une interface administrateur pour gerer le catalogue produit. Le projet integre egalement des services backend independants, organises autour d'une architecture microservices, afin de mieux separer les responsabilites fonctionnelles et faciliter l'evolution de la solution.

La dimension "smart" du projet repose sur l'ajout de modules intelligents lies a la prevision de la demande, a la gestion optimisee des stocks et a l'analyse des prix du marche. Ces modules permettent d'aller au-dela d'une simple boutique en ligne en apportant une aide a la decision pour l'administrateur et en ameliorant la gestion operationnelle de la plateforme.

---

# Chapitre 1 - Cadre general du projet

## 1.1 Contexte du projet

Les plateformes e-commerce traditionnelles se limitent souvent a la presentation de produits, a la gestion du panier et au traitement des commandes. Cependant, dans un environnement commercial reel, ces fonctionnalites ne suffisent pas toujours. Une entreprise doit aussi anticiper la demande, eviter les ruptures de stock, suivre les mouvements de stock, surveiller les prix concurrents et disposer d'un systeme d'administration efficace.

Le projet **Smart E-Commerce Platform** s'inscrit dans cette logique. Il a pour objectif de proposer une solution e-commerce complete, modulaire et evolutive, capable d'integrer des fonctionnalites classiques de vente en ligne et des fonctionnalites avancees d'aide a la decision. Le choix d'une architecture microservices permet de diviser le systeme en plusieurs services specialises : authentification, produits, inventaire, commandes, prevision, pricing et passerelle API.

Cette approche est adaptee aux besoins d'une plateforme amenée a evoluer, car chaque service peut etre developpe, teste, deploye et maintenu de maniere plus independante.

## 1.2 Problematique

La gestion d'une plateforme e-commerce pose plusieurs problemes techniques et fonctionnels. D'un cote, les utilisateurs finaux attendent une navigation fluide, une consultation rapide des produits, une gestion simple du panier et un suivi clair de leurs commandes. De l'autre cote, les administrateurs doivent disposer d'outils fiables pour gerer les produits, surveiller les stocks, suivre les commandes et prendre des decisions commerciales pertinentes.

La problematique principale peut donc etre formulee ainsi :

**Comment concevoir une plateforme e-commerce intelligente, modulaire et evolutive, permettant de gerer efficacement les produits, les stocks, les commandes et l'authentification, tout en integrant des modules d'analyse et de prevision pour aider a la prise de decision ?**

Cette problematique souleve plusieurs questions secondaires :

- Comment separer les fonctionnalites metier pour rendre le systeme plus maintenable ?
- Comment securiser l'acces aux fonctionnalites client et administrateur ?
- Comment assurer la communication entre les differents services backend ?
- Comment gerer les stocks et eviter les situations de rupture ?
- Comment exploiter les donnees pour prevoir la demande et recommander un niveau de stock ?
- Comment comparer ou analyser les prix du marche a partir de sources externes ?

## 1.3 Objectifs du projet

### Objectif general

L'objectif general du projet est de developper une plateforme e-commerce intelligente permettant aux clients d'acheter des produits en ligne et aux administrateurs de gerer les operations principales de la boutique, tout en integrant des modules d'aide a la decision bases sur les donnees.

### Objectifs specifiques

Les objectifs specifiques du projet sont les suivants :

- Mettre en place une architecture microservices pour separer les responsabilites fonctionnelles.
- Developper un service d'authentification avec gestion des roles client et administrateur.
- Developper un service de gestion des produits avec creation, modification, suppression, recherche, filtrage et import CSV.
- Developper un service de gestion de l'inventaire avec suivi des stocks, reservation et mouvements.
- Developper un service de gestion des commandes pour les clients et les administrateurs.
- Mettre en place une passerelle API pour centraliser les appels vers les services backend.
- Developper une interface client permettant la consultation des produits, le panier, l'inscription, la connexion et les commandes.
- Developper une interface administrateur pour la gestion du catalogue produit.
- Integrer un module de prevision de la demande afin de recommander des niveaux de stock.
- Prevoir un module de scraping/analyse des prix concurrents pour enrichir la prise de decision commerciale.
- Conteneuriser les principaux services avec Docker et Docker Compose.

## 1.4 Interet du projet

Ce projet presente un interet a la fois technique, fonctionnel et pedagogique.

Sur le plan technique, il permet de mettre en pratique plusieurs technologies modernes : Spring Boot, Angular, FastAPI, MySQL, Docker, JWT et les principes des architectures microservices. Il permet aussi de travailler sur la communication inter-services, la securite, la structuration backend/frontend et l'integration de modules de traitement de donnees.

Sur le plan fonctionnel, la plateforme repond a des besoins reels d'une boutique en ligne : gestion des comptes, gestion des produits, consultation du catalogue, panier, commandes, stock et administration.

Sur le plan decisionnel, les modules de prevision et d'analyse des prix apportent une valeur ajoutee importante, car ils permettent d'assister l'administrateur dans ses decisions liees a l'approvisionnement, aux prix et a la disponibilite des produits.

## 1.5 Perimetre du projet

Le perimetre actuel du projet couvre les fonctionnalites suivantes :

- Authentification et inscription des utilisateurs.
- Gestion des roles utilisateur et administrateur.
- Gestion des produits cote backend.
- Import de produits via fichier CSV.
- Consultation, recherche et filtrage des produits.
- Gestion de l'inventaire et des mouvements de stock.
- Gestion des alertes de stock.
- Creation et suivi des commandes.
- Interface client Angular.
- Interface administrateur Angular.
- API Gateway pour centraliser les acces aux services.
- Bases de donnees MySQL separees par domaine fonctionnel.
- Module FastAPI pour la prevision de la demande.
- Module Python pour scraping, nettoyage et analyse des prix.

Certaines parties restent a finaliser ou a mieux integrer dans la plateforme globale, notamment l'integration complete des modules intelligents dans l'interface utilisateur, l'enrichissement du tableau de bord administrateur, les tests avances et la redaction finale des resultats.

## 1.6 Methodologie de travail

Le projet suit une demarche incrementale. Les grandes fonctionnalites sont developpees progressivement sous forme de services independants. Chaque service correspond a un domaine fonctionnel precis, ce qui facilite l'organisation du code et la maintenance.

La methodologie adoptee peut etre resumee ainsi :

- Analyse du besoin a partir du cahier des charges.
- Identification des acteurs et des fonctionnalites principales.
- Conception d'une architecture microservices.
- Developpement des services backend.
- Developpement des interfaces frontend client et administrateur.
- Integration progressive entre frontend, API Gateway et services backend.
- Ajout de modules intelligents pour la prevision et l'analyse des prix.
- Tests fonctionnels et validation des principaux parcours.

---

# Chapitre 2 - Analyse et specification des besoins

## 2.1 Acteurs du systeme

### Client

Le client est l'utilisateur final de la plateforme. Il peut creer un compte, se connecter, consulter les produits, rechercher des articles, ajouter des produits au panier, passer une commande et consulter ses commandes.

### Administrateur

L'administrateur gere les operations internes de la plateforme. Il peut se connecter a l'interface d'administration, gerer le catalogue produit, importer des produits, consulter les commandes et suivre les informations liees aux stocks.

### Systeme intelligent

Le systeme intelligent represente les modules de prevision et d'analyse. Il traite les donnees disponibles pour produire des informations utiles, comme la demande previsionnelle ou le stock recommande.

## 2.2 Besoins fonctionnels existants

- Inscription et connexion des utilisateurs.
- Creation d'un compte administrateur.
- Authentification par JWT.
- Consultation paginee des produits.
- Recherche et filtrage des produits par mot-cle et categorie.
- Consultation du detail d'un produit.
- Creation, modification et suppression des produits par l'administrateur.
- Import CSV des produits.
- Gestion du panier cote client.
- Creation de commandes.
- Consultation des commandes du client.
- Consultation et gestion des commandes cote administrateur via API.
- Creation et mise a jour de stock.
- Reservation de stock.
- Journalisation des mouvements de stock.
- Consultation des alertes de stock.
- Prediction de la demande via une API FastAPI.
- Scraping et preparation de donnees de prix depuis des enseignes concurrentes.

## 2.3 Besoins fonctionnels a completer

### Gestion avancee des utilisateurs

[A completer : modification de profil, recuperation de mot de passe, gestion complete des utilisateurs par l'administrateur.]

### Tableau de bord administrateur avance

[A completer : statistiques de ventes, produits les plus vendus, commandes recentes, indicateurs de stock, alertes critiques.]

### Integration complete de la prevision

[A completer : affichage des predictions dans l'interface admin, historique des previsions, recommandations automatiques.]

### Integration complete du pricing intelligent

[A completer : affichage des prix concurrents, comparaison par produit, recommandations de prix.]

### Paiement en ligne

[A completer : choix du prestataire, simulation ou integration reelle, statut de paiement.]

### Livraison

[A completer : adresse de livraison, suivi, frais de livraison, transporteur.]

## 2.4 Besoins non fonctionnels

- Securite : protection des routes sensibles, authentification JWT, separation client/admin.
- Scalabilite : architecture microservices permettant l'evolution independante des composants.
- Maintenabilite : separation claire entre backend, frontend et modules de donnees.
- Disponibilite : conteneurisation des services principaux.
- Performance : pagination des produits et separation des bases de donnees.
- Fiabilite : controle de stock lors des commandes et journalisation des mouvements.

---

# Chapitre 3 - Conception generale

## 3.1 Architecture globale

Le projet adopte une architecture microservices. Chaque domaine fonctionnel est isole dans un service dedie :

- **api-gateway** : point d'entree central vers les services backend.
- **auth-service** : gestion de l'inscription, connexion, JWT et roles.
- **product-service** : gestion du catalogue produit.
- **inventory-service** : gestion du stock, mouvements et alertes.
- **order-service** : gestion des commandes.
- **forecast-service** : communication avec le module de prevision.
- **ml-api** : API FastAPI de prediction de demande.
- **pricing-service** : scraping, nettoyage et analyse des prix concurrents.
- **admin-app** : interface Angular pour l'administrateur.
- **client-app** : interface Angular pour le client.

## 3.2 Architecture technique

Les technologies principales utilisees sont :

- **Backend :** Java, Spring Boot, Spring Security, Spring Data JPA.
- **Frontend :** Angular.
- **Base de donnees :** MySQL.
- **Intelligence / data :** Python, FastAPI, pandas, joblib.
- **Conteneurisation :** Docker et Docker Compose.
- **Securite :** JWT.

## 3.3 Base de donnees

Le projet utilise plusieurs bases MySQL, chacune associee a un domaine :

- `auth_db` pour les utilisateurs et roles.
- `product_db` pour les produits.
- `inventory_db` pour les stocks, mouvements et alertes.
- `order_db` pour les commandes.

### Schema detaille

[A completer : inserer les diagrammes ou tableaux des entites principales : User, Product, Inventory, Movement, Alert, Order.]

## 3.4 Diagrammes de conception

### Diagramme de cas d'utilisation

[A completer : ajouter le diagramme client/admin.]

### Diagramme de classes

[A completer : ajouter les principales classes backend.]

### Diagramme de sequence

[A completer : sequence inscription, connexion, commande, reservation du stock.]

### Diagramme d'architecture

[A completer : schema API Gateway, microservices, bases de donnees, frontends.]

---

# Chapitre 4 - Realisation

## 4.1 Service d'authentification

Le service d'authentification permet l'inscription, la connexion et la creation de comptes administrateurs. Il utilise JWT pour securiser les echanges et differencie les roles utilisateur et administrateur.

Fonctionnalites existantes :

- `POST /auth/register`
- `POST /auth/register-admin`
- `POST /auth/login`

## 4.2 Service produit

Le service produit gere le catalogue de la plateforme. Il offre des endpoints pour lister, rechercher, filtrer, creer, modifier, supprimer et importer des produits.

Fonctionnalites existantes :

- Liste paginee des produits.
- Recherche par mot-cle.
- Filtrage par categorie.
- Detail produit.
- Creation, modification et suppression par l'administrateur.
- Import CSV.
- Verification d'existence d'un produit.

## 4.3 Service inventaire

Le service inventaire gere les stocks associes aux produits. Il permet de creer un inventaire, consulter le stock d'un produit, mettre a jour le stock, reserver une quantite et enregistrer les mouvements.

Fonctionnalites existantes :

- Creation d'inventaire.
- Consultation du stock par produit.
- Entree de stock.
- Reservation de stock.
- Historique des mouvements.
- Consultation des alertes.

## 4.4 Service commande

Le service commande gere la creation et le suivi des commandes. Il communique avec les services produit et inventaire pour verifier les donnees et reserver le stock.

Fonctionnalites existantes :

- Creation de commande.
- Consultation des commandes du client.
- Consultation d'une commande.
- Annulation cote client.
- Consultation de toutes les commandes cote administrateur.
- Mise a jour du statut d'une commande.
- Annulation administrative.

## 4.5 API Gateway

L'API Gateway centralise les requetes vers les differents services backend. Elle permet de simplifier l'acces depuis les applications frontend et contient une logique de filtrage JWT.

## 4.6 Interface client

L'application client Angular contient les pages suivantes :

- Accueil / liste des produits.
- Connexion.
- Inscription.
- Detail produit.
- Panier.
- Commandes.

## 4.7 Interface administrateur

L'application administrateur Angular contient les pages suivantes :

- Connexion.
- Inscription.
- Tableau de bord.
- Liste des produits.
- Formulaire de creation et modification des produits.

Parties a enrichir :

### Gestion des commandes dans l'interface admin

[A completer.]

### Gestion des stocks dans l'interface admin

[A completer.]

### Visualisation des previsions

[A completer.]

### Visualisation des prix concurrents

[A completer.]

## 4.8 Module de prevision

Le module de prevision repose sur une API FastAPI. Il prend en entree des donnees telles que le niveau de stock, les ventes recentes, le prix, la promotion et le delai fournisseur. Il retourne une demande predite et un stock recommande.

Exemple de sortie :

- `predictedDemand`
- `recommendedStock`

Partie a completer :

[A completer : expliquer le modele utilise, les donnees d'entrainement, les metriques et les resultats.]

## 4.9 Module pricing et scraping

Le module pricing contient des scripts Python pour collecter des donnees de prix depuis plusieurs sources, nettoyer les donnees, effectuer du feature engineering et preparer des fichiers exploitables.

Elements existants :

- Scraping Carrefour.
- Scraping Marjane.
- Scraping Aswak.
- Nettoyage des donnees.
- Detection/suppression d'outliers.
- Analyse exploratoire.
- Fichiers CSV bruts et traites.

Partie a completer :

[A completer : integration API, visualisation dans l'interface admin, recommandations de prix.]

---

# Chapitre 5 - Tests et validation

## 5.1 Tests fonctionnels

[A completer : decrire les tests realises sur inscription, connexion, produits, panier, commandes, stock.]

## 5.2 Tests API

Le projet contient des elements Postman permettant de tester les endpoints backend.

[A completer : ajouter captures Postman, scenarios et resultats.]

## 5.3 Tests frontend

[A completer : navigation client, navigation admin, formulaires, erreurs.]

## 5.4 Tests d'integration

[A completer : communication order-service/product-service/inventory-service, API Gateway, Docker Compose.]

---

# Chapitre 6 - Deploiement

## 6.1 Conteneurisation

Le fichier `docker-compose.yml` definit les conteneurs suivants :

- MySQL Auth.
- MySQL Product.
- MySQL Inventory.
- MySQL Order.
- Auth Service.
- Product Service.
- Inventory Service.
- Order Service.
- API Gateway.

## 6.2 Services non encore conteneurises ou a integrer

### Frontend client

[A completer : Dockerfile ou procedure de lancement.]

### Frontend admin

[A completer : Dockerfile ou procedure de lancement.]

### ML API

[A completer : Dockerfile, dependances, modele `model.pkl`.]

### Pricing service

[A completer : API, Dockerfile, planification des scripts de scraping.]

---

# Conclusion generale

Le projet **Smart E-Commerce Platform** permet de mettre en place une plateforme e-commerce moderne, modulaire et evolutive. La solution couvre deja plusieurs fonctionnalites essentielles : authentification, gestion des produits, gestion des stocks, commandes, interface client, interface administrateur, API Gateway et conteneurisation des services principaux.

L'architecture microservices adoptee facilite l'evolution du systeme et permet d'ajouter progressivement des fonctionnalites intelligentes. Les modules de prevision de la demande et d'analyse des prix apportent une valeur ajoutee importante, car ils transforment la plateforme en outil d'aide a la decision et non seulement en application de vente en ligne.

Cependant, certaines parties restent a finaliser pour obtenir une version totalement complete : integration visuelle des modules intelligents, enrichissement du tableau de bord, gestion avancee des commandes et des stocks cote admin, paiement, livraison, tests complets et documentation technique detaillee.

En perspective, le projet peut evoluer vers une plateforme plus robuste avec paiement en ligne, recommandations personnalisees, statistiques avancees, automatisation des alertes de stock et integration complete des donnees concurrentielles.

---

# Annexes

## Annexe A - Endpoints principaux

[A completer : tableau des endpoints avec methode, URL, role et description.]

## Annexe B - Captures d'ecran

[A completer : interface client, interface admin, Postman, Docker.]

## Annexe C - Extraits de code

[A completer : extraits representatifs des services principaux.]

## Annexe D - Cahier des charges

[A completer : resume des exigences extraites du cahier des charges v2.]
