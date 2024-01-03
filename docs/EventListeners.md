# Fonctionnement des écouteurs et des événements

## Explication générale

### Souscrire à un événement
Il est possible d'écouter les événements émis par les objets de la BDD ou les contrôleurs. Cela permet de réagir à des actions de l'utilisateur ou de l'application.  
Pour cela il suffit d'appeler la fonction subscribe depuis `EventHandler`.
Par exemple:
```ruby
EventHandler.user.create.subscribe do |sender:, args:|
  puts "Un nouvel utilisateur a été créé: #{args[:model]}"
end
```

Dans l'exemple ci-dessus, on écoute les événements de création d'utilisateur.

Voici les différents éléments:
- `EventHandler` regroupe tous les modules d'écoute. Un module regroupe tous les évènements qui sont liés (ici tous les évènements liés à l'utilisateur)
- `EventHandler.user` regroupe tous les types d'évènements liés à l'utilisateur
- `EventHandler.user.create` représente l'évènement de création d'utilisateur. On peut souscrire ou déclencher cet évènement.

Pour être autorisé à souscrire, le bloc doit obligatoirement prendre 2 arguments nommés :
- `sender`: l'objet qui a déclenché l'évènement
- `args`: un tableau contenant les arguments passés à l'évènement

Pour voir les différentes méthodes appelables sur un évènement, voir la documentation de la classe [Event](../lib/elvis/event.rb)


### Déclencher un évènement

Il est possible de déclencher un évènement depuis n'importe quel objet. Pour cela il suffit d'appeler la méthode `trigger`:
    
```ruby
user = User.new
EventHandler.user.create.trigger(sender: self, args: {model: user}, params: {})
```

Dans l'exemple ci-dessus, on déclenche l'évènement de création d'utilisateur.

Voici les différents éléments:
- `user` est l'objet qui a déclenché l'évènement. Il est possible de passer `nil` si l'objet n'est pas connu.
- `args` est un objet contenant les arguments passés à l'évènement. Il faut mettre un tableau vide si aucun argument n'est passé.
- `sender` est l'objet qui a déclenché l'évènement. Il est possible de passer `nil` si l'objet n'est pas connu.

### Information supplémentaire
Pour enregistrer et déclencher les évènements, la librairie [Rails event store](https://railseventstore.org/) est utilisée.  
De ce fait, il est possible de souscrire et de déclencher des évènements manuellement si besoin depuis l'objet `event store` accessible depuis la configuration:
```ruby
Rails.configuration.event_store
```

Pour plus d'informations sur la librairie, voir la documentation de la librairie [ici](https://railseventstore.org/docs/).
## Liste des événements

### Model active records
Pour chacun des modèles Active Record, les événements suivants sont déclenchés :
- `create` : déclenché lors de la création d'un objet
- `update` : déclenché lors de la mise à jour d'un objet
- `destroy` : déclenché lors de la suppression d'un objet

Pour souscrire à ces événements, il suffit d'appeler la méthode `subscribe` sur l'événement correspondant :
```ruby
EventHandler."nom du model"."nom de l'event".subscribe do |sender:, args:|
  puts "..."
end
```

Dans le cas de ces évènements automatiques ci-dessus, le `sender` sera toujours le modèle qui vient d'être changé. Ce dernier est aussi passé dans les `args`, sous le nom `model`.  
Un attribut supplémentaire nommé `changes` est ajouté aux args, qui représente les eventuels changements d'un modèle (dans le cas de la création ou de la mise à jour)  
Dans le cas où l'événement est déclenché depuis un contrôleur, les paramètres du contrôleur sont passés dans les `args` sous le nom `controller_params`.

### Notifications
- `notification.create_user` : déclenché lors de la création d'un utilisateur pour envoyer une notification à l'utilisateur comme quoi sont compte vient d'être créé 
- `notification.activity_accepted` : déclenché lorsque le statut de l'affectation d'un utilisateur à un cours passe à "Proposition Acceptée" dans la page des inscriptions. Se déclenche aussi lorsqu'un utilisateur accepte directement la proposition à un cours 