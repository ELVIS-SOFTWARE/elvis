# Créer un plugin
Pour créer un plugin, il faut executer la commande suivante dans votre projet Elvis:

```bash
bundle exec rails generate elvis_plugin exemple
```

Il sera créé dans `/plugins`  
Vous pouvez déplacer à votre convenance le squelette généré : l'emplacement n'est pas déterminant puisque c'est la gem qui importe.

## Créer des migration
Utiliser une des deux syntaxes suivantes depuis la racine du plugin:
- ```bash
  rake generate:migration nom_de_la_migration
    ```
- ```bash
  rake generate:migration[nom_de_la_migration]
    ```


## Préparer le packaging
Créer un nouveau dépôt git  
Déplacer l'arborescence du plugin vers le dépôt  
Compléter le gemspec  
Compléter le --plugin-name--.rb  
Compléter le init.rb  

## Vérifications et publication
Compiler la gem :
```bash
rake gem
```
Générer le package :
```bash
rake package
```
Envoyer le code sur le dépôt
```bash
git push
```