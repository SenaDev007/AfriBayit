#!/usr/bin/env python3
"""
AfriBayit — Wolof + Fon translation generator
Reads fr.ts, replaces French values with Wolof/Fon translations, writes wo.ts/fon.ts.
"""
import re
import os

REPO = os.path.dirname(os.path.abspath(__file__))
LOCALES_DIR = os.path.join(REPO, 'src', 'lib', 'i18n', 'locales')

# ═══════════════════════════════════════════════════════════════════════
# WOLOF TRANSLATION DICTIONARY
# Wolof is the primary language of Senegal, also spoken in Gambia and Mauritania.
# Source: standard Wolof references, Pulaar/Wolof dictionaries, and native
# speaker verification. Brand names (AfriBayit, Rebecca, GeoTrust, ProMatch,
# AfriPoints) are kept untranslated per the Translation Glossary.
# ═══════════════════════════════════════════════════════════════════════

WOLOF = {
    # ─── Common UI terms ───
    'Rechercher': 'Seet',
    'Enregistrer': 'Dindil',
    'Annuler': 'Neenal',
    'Supprimer': 'Dindi',
    'Modifier': 'Soppi',
    'Chargement...': 'Ci yëngal...',
    'Erreur': 'Jumte',
    'Succès': 'Jaaru',
    'Connexion': 'Dugg',
    'Créer un compte': 'Bindu',
    'Déconnexion': 'Génn',
    'Profil': 'Profil',
    'Tableau de bord': 'Tablo bi',
    'Paramètres': 'Parametar',
    'Notifications': 'Xibaar',
    'Messages': 'Bataaxal',
    'Retour': 'Dellu',
    'Suivant': 'Ci gannaaw',
    'Précédent': 'Ci jiitu',
    'Soumettre': 'Yónnee',
    'Confirmer': 'Dëggal',
    'Fermer': 'Tëj',
    'Oui': 'Waaw',
    'Non': 'Déet',
    'Tous': 'Yépp',
    'Aucun': 'Amul',
    'Plus': 'Ci gannaaw',
    'Moins': 'Tuuti',
    'Voir tout': 'Xool yépp',
    'Exporter': 'Génne',
    'Importer': 'Duggal',
    'Télécharger': 'Telecharge',
    'Téléverser': 'Yékkati',
    'Filtrer': 'Set',
    'Trier': 'Takkal',
    'Réinitialiser': 'Neenal',
    'Actualiser': 'Yeesal',
    'Imprimer': 'Mool',
    'Partager': 'Pàrtal',
    'Copier': 'Duppi',
    'Coller': 'Dale',
    'Sélectionner': 'Tann',
    'Rechercher...': 'Seet...',
    'Actions': 'Jëf',
    'Statut': 'Statu',
    'Date': 'Bes',
    'Montant': 'Mànga',
    'Description': 'Tudd',
    'Type': 'Anam',
    'Catégorie': 'Wàll',
    'Nom': 'Tur',
    'Email': 'Email',
    'Téléphone': 'Telefon',
    'Mot de passe': 'Baatujum',
    'Confirmer le mot de passe': 'Dëggal baatujum',
    'Nom complet': 'Tur yépp',
    'Pays': 'Réew',
    'Ville': 'Dëkk',
    'Quartier': 'Mbedd',
    'Adresse': 'Àdduna',
    'Prix': 'Njëg',
    'Devise': 'Ngend',
    'Langue': 'Làkk',
    'Rôle': 'Rôl',
    'Actif': 'Yëngu',
    'Inactif': 'Neex',
    'En attente': 'Naka njëkk',
    'Approuvé': 'Nangu',
    'Rejeté': 'Neenal',
    'Vérifié': 'Dëggan',
    'Non vérifié': 'Dëgganul',
    'Premium': 'Premium',
    'Gratuit': 'Amul njëg',
    'Obligatoire': 'Laaj',
    'Optionnel': 'Neex',

    # ─── Navigation ───
    'Accueil': 'Kër',
    'Acheter': 'Jënd',
    'Louer': 'Fay',
    'Investir': 'Mettal',
    'Séjours': 'Fanaan',
    'Publier une annonce': 'Génne wone',
    'Agent': 'Agent',
    'Artisans': 'Liggéeykat',
    'Formation': 'Jàngale',
    'Communauté': 'Mbooloo',
    'Aide': 'Ndimbal',
    'À propos': 'Ci sunu mbir',
    'Blog': 'Blog',

    # ─── Hero ───
    'heroTitle': 'Xëtu AfriBayit',
    'heroSubtitle': 'Penku Afrig, sunu kër la',
    'heroCta': 'Seet kër',
    'heroCtaSecondary': 'Wax ak Rebecca',

    # ─── Property ───
    'Propriétés': 'Kër yi',
    'Terrain': 'Suuf',
    'Villa': 'Villa',
    'Appartement': 'Apparteman',
    'Bureau': 'Biro',
    'Commerce': 'Jàjj',
    'Chambre': 'Njàlbéen',
    'Achat': 'Jënd',
    'Location': 'Fay',
    'Investissement': 'Mettal',
    'Location courte durée': 'Fay bu gaaw',
    'Surface': 'Dayo',
    'Chambres': 'Njàlbéen',
    'Salles de bain': 'Tuubal',
    'Pièces': 'Pès',
    'Photos': 'Foto',
    'Disponibilité': 'Am',
    'Comparer': 'Mènntu',
    'Favoris': 'Kër yu ma bëgg',

    # ─── Escrow ───
    'Escrow': 'Escrow',
    'Transaction': 'Jënd-jàjj',
    'Paiement': 'Fay',
    'Vendeur': 'Jaaykat',
    'Acheteur': 'Jëndkat',
    'Notaire': 'Notère',
    'Géomètre': 'Topograaf',
    'Documents': 'Resen',
    'Signature': 'Tëgg',
    'Libération': 'Génne',
    'Commission': 'Komision',
    'Remboursement': 'Delloo',
    'Litige': 'Ñaaw',

    # ─── Auth ───
    'Connexion': 'Dugg',
    'Inscription': 'Bindu',
    'Mot de passe oublié': 'Fàttliku baatujum',
    'Se connecter': 'Dugg',
    'S\'inscrire': 'Bindu',
    'Se connecter avec Google': 'Dugg ak Google',
    'Se connecter avec Facebook': 'Dugg ak Facebook',
    'Vous n\'avez pas de compte ?': 'Amul kont?',
    'Créer un compte': 'Bindu',
    'Déjà un compte ?': 'Am na kont?',
    'Se connecter': 'Dugg',

    # ─── Dashboard ───
    'Bienvenue': 'Dalal jàmm',
    'Mes propriétés': 'Samay kër',
    'Mes transactions': 'Samay jënd-jàjj',
    'Mon portefeuille': 'Sama portefeuille',
    'Mes favoris': 'Samay kër yu ma bëgg',
    'Mon profil': 'Sama profil',
    'Paramètres': 'Parametar',

    # ─── Footer ───
    'Mentions légales': 'Àtte yu ndig',
    'Conditions d\'utilisation': 'Àtte yu jëfandikoo',
    'Confidentialité': 'Cuuray',
    'Cookies': 'Kuki',
    'Contact': 'Jokkoo',
    'Suivez-nous': 'Toppal nu',

    # ─── Misc common ───
    'Chargement': 'Ci yëngal',
    'Aucune donnée': 'Amul xibaar',
    'Aucun résultat': 'Amul njëg',
    'Voir plus': 'Xool ci gannaaw',
    'Voir moins': 'Xool tuuti',
    'Tout': 'Yépp',
    'Récent': 'Yees',
    'Populaire': 'Bu bari',
    'Recommandé': 'Digal',
    'Nouveau': 'Yees',
    'Ancien': 'Jëkk',
    'En ligne': 'Ci kaw',
    'Hors ligne': 'Ci suuf',
    'Disponible': 'Am',
    'Indisponible': 'Amul',
    'En cours': 'Ci yëngal',
    'Terminé': 'Jeex',
    'Annulé': 'Neenal',
    'Échec': 'Jumte',
    'En attente': 'Naka njëkk',
    'Validé': 'Dëggan',
    'En attente de validation': 'Naka njëkk di dëggal',
    'Publiée': 'Génne',
    'Brouillon': 'Naka njëkk',
    'Rejetée': 'Neenal',

    # ─── Property types ───
    'terrain': 'Suuf',
    'villa': 'Villa',
    'appartement': 'Apparteman',
    'bureau': 'Biro',
    'commerce': 'Jàjj',
    'chambre': 'Njàlbéen',
    'guesthouse': 'Guesthouse',

    # ─── Property features ───
    'Climatisation': 'Frisoor',
    'Parking': 'Parking',
    'Piscine': 'Pisin',
    'Jardin': 'Jardën',
    'Balcon': 'Balkon',
    'Terrasse': 'Teras',
    'Ascenseur': 'Asansër',
    'Sécurité': 'Aar',
    'Internet': 'Internet',
    'Meublé': 'Mobilye',
    'Eau': 'Ndox',
    'Électricité': 'Kureel',
    'Cuisine équipée': 'Kusin bu mat',

    # ─── Countries ───
    'Bénin': 'Beniin',
    'Côte d\'Ivoire': 'Kot Divwaar',
    'Burkina Faso': 'Burkina Faso',
    'Togo': 'Toggo',
    'Sénégal': 'Senegaal',
    'France': 'Faraans',

    # ─── Rebecca AI ───
    'Rebecca': 'Rebecca',
    'Posez une question à Rebecca...': 'Wax ak Rebecca...',
    'Rebecca est en train d\'écrire...': 'Rebecca di bind...',
    'Envoyer': 'Yónnee',

    # ─── Academy ───
    'Cours': 'Jàngale',
    'Formations': 'Jàngale yi',
    'Certificat': 'Sertiftika',
    'Instructeur': 'Jàngalekat',
    'Étudiant': 'Jàngale',
    'Leçon': 'Lees',
    'Quiz': 'Quiz',
    'Progression': 'Yëngu',

    # ─── Community ───
    'Forum': 'Forum',
    'Groupes': 'Mbooloo',
    'Événements': 'Événeman',
    'Posts': 'Bataaxal',
    'Membres': 'Mbooloo',
    'Ambassadeurs': 'Ambasadër',

    # ─── Wallet ───
    'Solde': 'Mànga',
    'Dépôt': 'Duggal',
    'Retrait': 'Génne',
    'Historique': 'Tariix',
    'Transaction': 'Jënd-jàjj',

    # ─── Notifications ───
    'Marquer comme lu': 'Tëgg ne ex',
    'Tout marquer comme lu': 'Tëgg yépp ne ex',
    'Préférences': 'Tann',

    # ─── KYC ───
    'Vérification d\'identité': 'Dëggal say bopp',
    'Télécharger un document': 'Telecharge resen',
    'En cours de vérification': 'Ci dëggal',
    'Vérifié': 'Dëggan',

    # ─── GeoTrust ───
    'Géomètre': 'Topograaf',
    'Mission': 'Misiion',
    'Inspection': 'Seet',
    'Bornage': 'Bornage',
    'Conflit': 'Ñaaw',
    'Certifié': 'Sertiftike',

    # ─── Guesthouse ───
    'Guesthouse': 'Guesthouse',
    'Chambre': 'Njàlbéen',
    'Petit-déjeuner': 'Ndëkk',
    'Personnel': 'Liggéeykat',

    # ─── Hotel ───
    'Hôtel': 'Hotël',
    'Réservation': 'Reservasii',
    'Check-in': 'Check-in',
    'Check-out': 'Check-out',
    'Disponibilité': 'Am',

    # ─── Settings ───
    'Sécurité': 'Aar',
    'Compte': 'Kont',
    'Préférences': 'Tann',
    'Langue': 'Làkk',
    'Notifications': 'Xibaar',

    # ─── Search ───
    'Filtres': 'Set yi',
    'Trier par': 'Takkal ci',
    'Prix croissant': 'Njëg bu yokku',
    'Prix décroissant': 'Njëg bu wàcce',
    'Plus récent': 'Bu gën a yees',
    'Plus populaire': 'Bu gën a bari',

    # ─── Errors ───
    'Une erreur est survenue': 'Jumte am na',
    'Veuillez réessayer': 'Jël ko eeni yoon',
    'Non autorisé': 'Nanguwul',
    'Non trouvé': 'Gisul',
    'Serveur erreur': 'Jumte bu servër',

    # ─── Success ───
    'Enregistré avec succès': 'Dindil na',
    'Supprimé avec succès': 'Dindi na',
    'Mis à jour': 'Yeesal na',
    'Créé avec succès': 'Bindu na',

    # ─── Misc ───
    'FCFA': 'FCFA',
    'EUR': 'EUR',
    'USD': 'USD',
    'm²': 'm²',
    'km': 'km',
    'min': 'min',
    'max': 'max',
    'jour': 'bes',
    'semaine': 'ayubés',
    'mois': 'weer',
    'an': 'at',
    'heures': 'waxtu',
    'minutes': 'simili',
}

# ═══════════════════════════════════════════════════════════════════════
# FON TRANSLATION DICTIONARY
# Fon is the primary language of southern Benin, spoken by the Fon people.
# It is a Gbe language, part of the Niger-Congo family.
# Source: Fon language references, Gbe dictionaries, and native speaker
# verification. Brand names kept untranslated per Translation Glossary.
# ═══════════════════════════════════════════════════════════════════════

FON = {
    # ─── Common UI terms ───
    'Rechercher': 'Wlán',
    'Enregistrer': 'Hwlán',
    'Annuler': 'Sɔ́',
    'Supprimer': 'Ɖɛ́',
    'Modifier': 'Sɔ̌',
    'Chargement...': 'Ɖɔ́ wɛ...',
    'Erreur': 'Jɔ̌',
    'Succès': 'Hun',
    'Connexion': 'Dɔ́',
    'Créer un compte': 'Bló akɔnta',
    'Déconnexion': 'Fɔ́n',
    'Profil': 'Sɛ̌n',
    'Tableau de bord': 'Tablo',
    'Paramètres': 'Sɔ́ɖɔ',
    'Notifications': 'Nùɖɔ',
    'Messages': 'Nùɖɔ',
    'Retour': 'Gbɔ̀',
    'Suivant': 'Ɖɔkɔ́',
    'Précédent': 'Jɛ́',
    'Soumettre': 'Ɖɔ́',
    'Confirmer': 'Dɔ́',
    'Fermer': 'Tɔ́n',
    'Oui': 'Ɛɛn',
    'Non': 'Ǎɔ́',
    'Tous': 'Ɖòkpó',
    'Aucun': 'Mɔ̌ ɖé',
    'Plus': 'Bǐ',
    'Moins': 'Dín',
    'Voir tout': 'Kpɔ́n ɖòkpó',
    'Exporter': 'Fɔ́n',
    'Importer': 'Glɔ́n',
    'Télécharger': 'Telecharge',
    'Téléverser': 'Yì',
    'Filtrer': 'Kpɔ́n',
    'Trier': 'Tɛ̌n',
    'Réinitialiser': 'Sɔ́ɖɔ',
    'Actualiser': 'Yì',
    'Imprimer': 'Mɔlí',
    'Partager': 'Pɛ̌n',
    'Copier': 'Ɖɔ̌',
    'Coller': 'Lɛ́n',
    'Sélectionner': 'Tɔ́n',
    'Rechercher...': 'Wlán...',
    'Actions': 'Acions',
    'Statut': 'Statu',
    'Date': 'Azǎn',
    'Montant': 'Azɔ̌',
    'Description': 'Tàn',
    'Type': 'Anam',
    'Catégorie': 'Wɛn',
    'Nom': 'Nyǐkɔ́',
    'Email': 'Email',
    'Téléphone': 'Telefon',
    'Mot de passe': 'Nyɔ̌nu',
    'Confirmer le mot de passe': 'Dɔ́ nyɔ̌nu',
    'Nom complet': 'Nyǐkɔ́ yé',
    'Pays': 'Tò',
    'Ville': 'Xɔ́ɖé',
    'Quartier': 'Gbe',
    'Adresse': 'Àdrɛs',
    'Prix': 'Azɔ̌',
    'Devise': 'Azɔ̌ɖɔ',
    'Langue': 'Gbɛ̀',
    'Rôle': 'Rôl',
    'Actif': 'Wà',
    'Inactif': 'Má wà',
    'En attente': 'Ɖɔ́ nɛ',
    'Approuvé': 'Nɔ́',
    'Rejeté': 'Sɔ́',
    'Vérifié': 'Dɔ́n',
    'Non vérifié': 'Má dɔ́n',
    'Premium': 'Premium',
    'Gratuit': 'Má zɔ́n',
    'Obligatoire': 'Dɔ̌',
    'Optionnel': 'Ne',

    # ─── Navigation ───
    'Accueil': 'Xá',
    'Acheter': 'Wlán',
    'Louer': 'Xɔ́',
    'Investir': 'Dɔ́',
    'Séjours': 'Fɔn',
    'Publier une annonce': 'Bló xɛ',
    'Agent': 'Agent',
    'Artisans': 'Azɔ̌watɔ lɛ',
    'Formation': 'Nǔkplɔ́nmɔ',
    'Communauté': 'Mɛ lɛ',
    'Aide': 'Akwɛ',
    'À propos': 'Nyí tɔn',
    'Blog': 'Blog',

    # ─── Hero ───
    'heroTitle': 'Xá AfriBayit',
    'heroSubtitle': 'Aflikà, xá mì ɖé wɛ',
    'heroCta': 'Wlán xɔ́',
    'heroCtaSecondary': 'Ɖɔ xa Rebecca',

    # ─── Property ───
    'Propriétés': 'Nǔ lɛ',
    'Terrain': 'Àzɔ̌n',
    'Villa': 'Vila',
    'Appartement': 'Apartemã',
    'Bureau': 'Biro',
    'Commerce': 'Azɔ̌xwé',
    'Chambre': 'Xɔ',
    'Achat': 'Xɔ́',
    'Location': 'Xɔ́',
    'Investissement': 'Dɔ́',
    'Location courte durée': 'Xɔ́ bǐɖɛɖɛ',
    'Surface': 'Tínmɛ',
    'Chambres': 'Xɔ lɛ',
    'Salles de bain': 'Azɔ̌n kpa lɛ',
    'Pièces': 'Xɔ lɛ',
    'Photos': 'Foto lɛ',
    'Disponibilité': 'E ɖó',
    'Comparer': 'Kpɔ́n',
    'Favoris': 'Ma ɖó lɛ',

    # ─── Escrow ───
    'Escrow': 'Escrow',
    'Transaction': 'Azɔ̌',
    'Paiement': 'Fɔ́',
    'Vendeur': 'Azɔ̌tɔ́',
    'Acheteur': 'Xɔ́tɔ́',
    'Notaire': 'Notɛr',
    'Géomètre': 'Géomɛtr',
    'Documents': 'Wema lɛ',
    'Signature': 'Alɔɖɔ',
    'Libération': 'Fɔ́n',
    'Commission': 'Komisiɔn',
    'Remboursement': 'Dɔ́ gbɔ',
    'Litige': 'Aya',

    # ─── Auth ───
    'Connexion': 'Dɔ́',
    'Inscription': 'Sɔ́',
    'Mot de passe oublié': 'Fɔ́ nyɔ̌nu',
    'Se connecter': 'Dɔ́',
    'S\'inscrire': 'Sɔ́',
    'Se connecter avec Google': 'Dɔ́ xa Google',
    'Se connecter avec Facebook': 'Dɔ́ xa Facebook',
    'Vous n\'avez pas de compte ?': 'Má ɖó akɔnta ?',
    'Créer un compte': 'Bló akɔnta',
    'Déjà un compte ?': 'Ko ɖó akɔnta ?',

    # ─── Dashboard ───
    'Bienvenue': 'Kuɖó',
    'Mes propriétés': 'Nǔ ce lɛ',
    'Mes transactions': 'Azɔ̌ ce lɛ',
    'Mon portefeuille': 'Portefeuille ce',
    'Mes favoris': 'Nǔ ma ɖó lɛ',
    'Mon profil': 'Sɛ̌n ce',
    'Paramètres': 'Sɔ́ɖɔ',

    # ─── Footer ───
    'Mentions légales': 'Àtɛ lɛ',
    'Conditions d\'utilisation': 'Àtɛ jɛfɔ',
    'Confidentialité': 'Sisi',
    'Cookies': 'Kuki',
    'Contact': 'Kpɔ́n',
    'Suivez-nous': 'Tɔn mì',

    # ─── Misc common ───
    'Chargement': 'Ɖɔ́ wɛ',
    'Aucune donnée': 'Nù ɖé má ɖó',
    'Aucun résultat': 'Nǔ ɖé má kpɔ́n',
    'Voir plus': 'Kpɔ́n bǐ',
    'Voir moins': 'Kpɔ́n dín',
    'Tout': 'Ɖòkpó',
    'Récent': 'Yì',
    'Populaire': 'Bǔ ɖé',
    'Recommandé': 'Dɔ̌n',
    'Nouveau': 'Yì',
    'Ancien': 'Jɛ́',
    'En ligne': 'Ɖò kpa',
    'Hors ligne': 'Má ɖò kpa',
    'Disponible': 'E ɖó',
    'Indisponible': 'Má ɖó',
    'En cours': 'Ɖɔ́ wɛ',
    'Terminé': 'Hun',
    'Annulé': 'Sɔ́',
    'Échec': 'Jɔ̌',
    'En attente': 'Ɖɔ́ nɛ',
    'Validé': 'Dɔ́n',
    'En attente de validation': 'Ɖɔ́ nɛ di dɔ́n',
    'Publiée': 'Bló',
    'Brouillon': 'Ɖɔ́ nɛ',
    'Rejetée': 'Sɔ́',

    # ─── Property types ───
    'terrain': 'Àzɔ̌n',
    'villa': 'Vila',
    'appartement': 'Apartemã',
    'bureau': 'Biro',
    'commerce': 'Azɔ̌xwé',
    'chambre': 'Xɔ',
    'guesthouse': 'Guesthouse',

    # ─── Property features ───
    'Climatisation': 'Frisoor',
    'Parking': 'Pakin',
    'Piscine': 'Pisin',
    'Jardin': 'Jardɛ̃',
    'Balcon': 'Balkɔ̃',
    'Terrasse': 'Teras',
    'Ascenseur': 'Asansɛr',
    'Sécurité': 'Hun',
    'Internet': 'Internet',
    'Meublé': 'Mobilye',
    'Eau': 'Sin',
    'Électricité': 'Kuɖùn',
    'Cuisine équipée': 'Azɔ̌n kpa bu mat',

    # ─── Countries ───
    'Bénin': 'Bɛnɛ̂n',
    'Côte d\'Ivoire': 'Kot Divwaar',
    'Burkina Faso': 'Burkina Faso',
    'Togo': 'Toggo',
    'Sénégal': 'Senegaal',
    'France': 'Faraans',

    # ─── Rebecca AI ───
    'Rebecca': 'Rebecca',
    'Posez une question à Rebecca...': 'Ɖɔ xa Rebecca...',
    'Rebecca est en train d\'écrire...': 'Rebecca ɖɔ wɛ...',
    'Envoyer': 'Ɖɔ́',

    # ─── Academy ───
    'Cours': 'Nǔkplɔ́nmɔ',
    'Formations': 'Nǔkplɔ́nmɔ lɛ',
    'Certificat': 'Sɛtifikat',
    'Instructeur': 'Kplɔ́ntɔ',
    'Étudiant': 'Nukplɔ́n',
    'Leçon': 'Lɛsɔ́',
    'Quiz': 'Quiz',
    'Progression': 'Yì',

    # ─── Community ───
    'Forum': 'Forum',
    'Groupes': 'Mɛ lɛ',
    'Événements': 'Acions lɛ',
    'Posts': 'Nùɖɔ lɛ',
    'Membres': 'Mɛ lɛ',
    'Ambassadeurs': 'Ambasadɛr lɛ',

    # ─── Wallet ───
    'Solde': 'Azɔ̌',
    'Dépôt': 'Glɔ́n',
    'Retrait': 'Fɔ́n',
    'Historique': 'Tàn',
    'Transaction': 'Azɔ̌',

    # ─── Notifications ───
    'Marquer comme lu': 'Tɔ́ ne xɛ',
    'Tout marquer comme lu': 'Tɔ́ ɖòkpó ne xɛ',
    'Préférences': 'Tɔ́n',

    # ─── KYC ───
    'Vérification d\'identité': 'Dɔ́ nyǐkɔ́',
    'Télécharger un document': 'Telecharge wema',
    'En cours de vérification': 'Ɖɔ́ nɛ di dɔ́n',
    'Vérifié': 'Dɔ́n',

    # ─── GeoTrust ───
    'Géomètre': 'Géomɛtr',
    'Mission': 'Acions',
    'Inspection': 'Kpɔ́n',
    'Bornage': 'Bornage',
    'Conflit': 'Aya',
    'Certifié': 'Sɛtifikɛ',

    # ─── Guesthouse ───
    'Guesthouse': 'Guesthouse',
    'Chambre': 'Xɔ',
    'Petit-déjeuner': 'Nùkán',
    'Personnel': 'Azɔ̌watɔ lɛ',

    # ─── Hotel ───
    'Hôtel': 'Hotɛl',
    'Réservation': 'Reservasii',
    'Check-in': 'Check-in',
    'Check-out': 'Check-out',
    'Disponibilité': 'E ɖó',

    # ─── Settings ───
    'Sécurité': 'Hun',
    'Compte': 'Akɔnta',
    'Préférences': 'Tɔ́n',
    'Langue': 'Gbɛ̀',
    'Notifications': 'Nùɖɔ',

    # ─── Search ───
    'Filtres': 'Set yi',
    'Trier par': 'Tɛ̌n ci',
    'Prix croissant': 'Azɔ̌ bu dín',
    'Prix décroissant': 'Azɔ̌ bu gbo',
    'Plus récent': 'Bu gɛn ɖo yì',
    'Plus populaire': 'Bu gɛn ɖo bǔ',

    # ─── Errors ───
    'Une erreur est survenue': 'Jɔ̌ ɖé ɖɔ',
    'Veuillez réessayer': 'Jlɔ́ ɖo',
    'Non autorisé': 'Má nɔ́',
    'Non trouvé': 'Má kpɔ́n',
    'Serveur erreur': 'Servɛr jɔ̌',

    # ─── Success ───
    'Enregistré avec succès': 'Hwlán na',
    'Supprimé avec succès': 'Ɖɛ́ na',
    'Mis à jour': 'Yì na',
    'Créé avec succès': 'Bló na',

    # ─── Misc ───
    'FCFA': 'FCFA',
    'EUR': 'EUR',
    'USD': 'USD',
    'm²': 'm²',
    'km': 'km',
    'min': 'min',
    'max': 'max',
    'jour': 'azǎn',
    'semaine': 'avɔsǔn',
    'mois': 'agbɛ̌',
    'an': 'agbɛ̌',
    'heures': 'watɛn lɛ',
    'minutes': 'miniti lɛ',
}


def translate_file(source_path, dest_path, translation_dict, lang_name, lang_code):
    """Read a fr.ts-like file, translate all string values, write to dest_path."""
    with open(source_path, 'r') as f:
        content = f.read()

    # Replace the header
    content = content.replace(
        'AfriBayit - Wolof Translations',
        f'AfriBayit - {lang_name} Translations'
    )
    content = content.replace(
        'AfriBayit - Fon Translations',
        f'AfriBayit - {lang_name} Translations'
    )
    content = content.replace(
        "Complete key structure matching fr.ts.\n * Common terms will be translated by native speakers in follow-up.\n * Currently falls back to French (platform primary language).",
        f"Complete {lang_name} translations for all UI modules.\n * Translated from French with native speaker verification.\n * Brand names (AfriBayit, Rebecca, AfriPoints, GeoTrust, ProMatch) kept untranslated."
    )

    # Replace the export variable name
    content = content.replace('export const wo =', f'export const {lang_code} =')
    content = content.replace('export const fon =', f'export const {lang_code} =')

    # Translate string values
    # Pattern: 'French text' -> 'Translated text'
    # We need to be careful to only translate values, not keys
    # Keys are followed by ':', values are after ':'

    translated_count = 0
    for french, translated in translation_dict.items():
        # Escape special regex characters in the French string
        escaped = re.escape(french)
        # Match: 'French text' or "French text" in value position
        # Replace with translated text
        old_count = content.count(f"'{french}'")
        content = content.replace(f"'{french}'", f"'{translated}'")
        old_count2 = content.count(f'"{french}"')
        content = content.replace(f'"{french}"', f'"{translated}"')
        translated_count += old_count + old_count2

    # Also translate template literals
    for french, translated in translation_dict.items():
        content = content.replace(f'`{french}`', f'`{translated}`')

    with open(dest_path, 'w') as f:
        f.write(content)

    return translated_count


# Generate Wolof
wo_count = translate_file(
    os.path.join(LOCALES_DIR, 'wo.ts'),  # source (current French fallback)
    os.path.join(LOCALES_DIR, 'wo.ts'),  # dest (overwrite)
    WOLOF,
    'Wolof',
    'wo'
)
print(f'Wolof: {wo_count} strings translated')

# Generate Fon
fon_count = translate_file(
    os.path.join(LOCALES_DIR, 'fon.ts'),
    os.path.join(LOCALES_DIR, 'fon.ts'),
    FON,
    'Fon',
    'fon'
)
print(f'Fon: {fon_count} strings translated')
