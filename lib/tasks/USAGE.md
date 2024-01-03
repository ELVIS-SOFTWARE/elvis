## spécific plugins commands
migrate all plugins: `rails elvis:plugins:migrate`  
migrate specific plugin: `rails elvis:plugins:migrate[plugin_name, version(optionelle)]`  
rollback spécific plugins 1 time: `rails elvis:plugins:rollback[plugin_name]`  
enregistrer les plugins du gemfile dans la bdd: `rails elvis:plugins:discover`  


### Rappel
generate plugin: `rails generate elvis_plugin plugin_name`