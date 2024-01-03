# Créer une librairie
1. Créer une gem avec la commande `bundle gem nom_de_la_gem`
2. Créer un fichier `lib/nom_de_la_gem/init.rb` (celui-ci contiendra du code chargé au lancement) qui contient le code suivant:
```ruby
require_relative '../nom_de_la_gem'
```
### Si il y a besoin de migration
3. Créer un dossier `db/migrate` et y mettre les migrations de la gem
4. Créer un fichier `lib/tasks/nom_de_la_gem.rake` (pour créer une commande rake permettant au plugin ou autre d'importer les migrations) qui contient le code suivant :
```ruby
namespace :elvis_stripe_plugin_lib do
  namespace :copy do
    task :migrations do |_, args|

      Dir.glob(File.join(File.dirname(__FILE__ ), "../../../db/migrate/*.rb")).each do |file|
        FileUtils.cp file, "./db/migrate/"
      end
    end
  end
end
```
5. Créer un fichier `lib/nom_de_la_gem/railtie.rb` (celui-ci contiendra du code chargé au lancement) qui contient le code suivant:
```ruby
require "nom_de_la_gem"
require "rails"
require "rake"

module NomDeLaGem
  class Railtie < Rails::Railtie
    railtie_name :nom_de_la_gem

    path = File.expand_path(__dir__)
    Dir.glob("#{path}/tasks/**/*.rake").each { |f| load f; }
  end
end
```

# Utiliser une librairie
## Si besoin dans un plugin
1. Ajouter la gem dans le fichier `Gemfile` du plugin (en environnement de développement)
2. Ajouter la gem dans le fichier `*.gemspec` du plugin avec la commande `spec.add_dependency "nom_de_la_gem"` (pour prod)
3. Ajouter `require "nom_de_la_gem"` ou `require "nom_de_la_gem/init"` dans le fichier `init.rb` du plugin

## Dans le projet Elvis, dans tous les cas
1. Ajouter la gem dans le fichier `Gemfile` du projet (sauf si la gem se trouve sur rubygem.org)