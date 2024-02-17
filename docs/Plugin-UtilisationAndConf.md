Basé sur https://www.redmine.org/projects/redmine/wiki/plugin_tutorial
# Créer le plugin
Créer le plugin avec les commandes référencées dans le fichier [CreerPlugin.md](CreerPlugin.md)


# Utilisation du plugin depuis Elvis
## Ajout des plugins

### Solution locale
Pour ajouter un/des plugin(s) localement, il faut créer un fichier `plugin.json` à la racine du projet. Ce dernier devra contenir uniquement un json comme ceci:
```json
[
    {
        "name": "nom du plugin comme specifié dans son gemspec",
        "fullUrl": "url vers un repo git",
        "hidden": true,
        "branch": "nom d'une branche (null si tag utilisé)",
        "tag": "nom d'un tag sur le dépot git (null si branche utilisée)",
        "autoActivate": false,
        "isLibrary": false
    }
]
```

- `autoActivate` permet d'activer le plugin automatiquement au démarrage de l'application
- `isLibrary` permet de définir si le plugin est une librairie ou non. Si c'est le cas, il ne sera pas affiché dans la liste des plugins dans l'interface d'administration d'Elvis et ne sera pas chargé en tant que plugin (voir le [plugin_loader](../lib/elvis/plugin_loader.rb))
- `hidden` permet de cacher le plugin dans l'interface d'administration d'Elvis => activation automatique ou manuelle (depuis base de données ou console rails) nécessaire.

### Solution distante
Il est possible de charger les plugins depuis une URL distante. Cette dernière doit être renseignée dans la variable d'environnement `PLUGINS_LIST_DOWNLOAD_URL`.  
Cette URL doit renvoyer exactement le même JSON que celui décrit dans la partie précédente.  

Un argument supplémentaire sera passé à l'URL : `?version=<version d'Elvis>`. Ce numéro de version est récupéré depuis le fichier [version.rb](../lib/elvis/version.rb)
pour que le serveur puisse savoir quelle version d'Elvis est utilisé et ainsi renvoyer la liste des plugins compatibles avec cette version.

### Installation manuelle
L'installation automatique de plugin ne peut se faire que depuis un dépôt git pour le moment (ni téléchargement autre, ni installation locale).  
Il est tout de même possible d'installer manuellement un plugin pourvu que ce dernier soit une gem. Pour cela, il faut:
- Installer manuellement la gem en l'ajoutant au Gemfile
- Ajouter le plugin à la table plugins de la bdd. Les seuls champs obligatoires sont `name`, `id`, `hidden` et les deux colonnes `created_at` & `updated_at`.

Le plus important est que la colonne name corresponde bien au nom de la gem pour que le chemin vers le plugin soit bien trouvé avec la commande `bundle show nom_de_la_gem`.

Ces étapes sont l'équivalent de l'instruction "discover" décrite plus bas. Il sera donc pris en compte pour tout le reste de la procédure.

### Génération d'in fichier plugin.json
Il est possible de généré un fichier plugin.json à partir de la liste des plugins installés. Pour cela, il faut lancer la commande `rake elvis:plugins:generate_pluginjson_from_url`.  
Attention tous de même, le fichier généré écrit par dessus le fichier existant.

## Préparation de la bdd avant démarrage
Cette étape est très importante afin que les commandes suivantes s'éxécutent correctement.  
Ajouter le plugin à la table plugins de la bdd grace à la commande `rake elvis:plugins:discover`  

## Ajout du front (composants React)
Lancer la commande `rake elvis:plugins:install_npm_dependencies` qui liste les dépendances des plugins et les installe.

Lancer la commande `rake elvis:plugins:copy_react` qui va copier  le contenu de chaque dossier react_component vers le dossier /frontend/components/plugins/<nom du plugin> 

Lancer la commande `rake elvis:plugins:assets` qui va copier les fichiers assets de chaque plugin

Ces commandes sont à lancer à chaque mise à jour des composants du plugin.

## Exécuter les migrations
Chaque plugin peut définir des migrations. Pour les exécuter, il faut lancer la commande:  
`rake elvis:plugins:migrate`  

ATTENTION : cela va modifier le fichier schema.rb. En environnement de développement, il faut bien penser à ne pas commit les modifications correspondantes dues aux plugins.

Si tout s'est passé avec succès, vous pouvez démarrer l'application : le plugin doit apparaître dans la page de configuration des plugins.  
