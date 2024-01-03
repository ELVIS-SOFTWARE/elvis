# Façon de détruire un objet de la base de données
(Modèle héritant de [ApplicationRecord](../app/models/application_record.rb))

Pour supprimer correctement un objet ET ses dépendances de la base de données, il faut utiliser le [DestroyJob](../app/jobs/destroy_job.rb).  
Mais avant toute chose, il faut configurer (si ce n'est pas déjà fait), les modèles concernés par la suppression.

## Configuration des modèles
Pour que le DestroyJob puisse supprimer correctement les objets, il faut que les modèles concernés soient configurés correctement.

### 1. Surcharge de `destroy_params`

Pour définir les paramètres à supprimer avant la suppression de l'objet, il faut surcharger cette méthode. Elle doit renvoyer un Hash avec les paramètres suivants:
  - `auto_deletable_references` : liste des références qui seront supprimées automatiquement (liste de classes)
  - `ignore_references` : liste des références qui seront ignorées ; la suppression essaiera de se faire même si ces références existent (liste de classes)
  - `undeletable_message` : début du message à afficher si la suppression est impossible (string)
  - `deletable_message` : début du message à afficher si la suppression est possible, mais qu'il faut d'abord faire quelque chose (string)
  - `success_message` : message à afficher si la suppression s'est déroulée correctement (string)

Voici un exemple de surcharge:
```ruby
def self.destroy_params
    base_params = ApplicationRecord.destroy_params
    
    base_params.merge({
      auto_deletable_references: [FamilyMemberUser, UserAddress, Adhesion, Planning, Student, Level, NewStudentLevelQuestionnaire, PreApplication],
      undeletable_message: "L'utilisateur ne peut pas être supprimé parce que:<br/>",
    })
end
```

### 2. Création de la méthode `pre_destroy` (optionnel)
Si cette méthode existe (`respond_to?`) alors, elle sera appelée avant la suppression de l'objet.
Il est possible de faire des vérifications ou des actions avant la suppression de l'objet.

Voici un exemple:
```ruby
def pre_destroy
  Activity.find(activity_id).remove_student(id) if is_validated
  additional_student = AdditionalStudent.find_by(desired_activity_id: id)
  additional_student&.delete
end
```


## Supprimer en utilisant le [RemoveController](../app/controllers/remove_controller.rb)

### Avec le composant [RemoveComponent](../frontend/components/RemoveComponent.js)
Le plus simple est d'utiliser ce composant qui permet d'appeler la route décrire ci-après avec en plus une gestion graphique générique.  
Il ajoute un bouton personnalisable avec des pop-up de confirmation et de réponses aux erreurs.

Voici un exemple d'utilisation:
```erbruby
react_component("RemoveComponent", {
    classname: "User",
    id: @user.id,
    text: "Supprimer cet utilisateur",
    validationText: "Cela supprimera l'utilisateur, ses liens familiaux ainsi que son adhésion. Êtes-vous sûr ?",
    btnProps: {
      className: "btn btn-danger btn-block m-t-sm"
    }
})
```

Il peut évidemment être appelé depuis d'autres composants réact avec les mêmes paramètres. De plus, il est possible de données des composants fils qui s'afficheront dans le bouton, ce qui permet de personnaliser son affichage.

### En appelant la route `generic_destroy`
La seconde façon est d'utiliser la route `generic_destroy` avec les paramètres suivants:

  * `classname` : le nom du model à supprimer
  * `id` : l'id de l'objet à supprimer
  * `selected_dep_to_destroy` : Tableau de class (représentant les dépendances) à supprimer avant de supprimer l'objet

voici un exemple en JS:
```js
const promise = api
    .set()
    .success((data) =>
    {
        console.log(data);
    })
    .error(data =>
    {
        console.error(data);
    })
    .del(`/destroy/${classname}/${id}`, undefined);
```

## Supprimer en appelant directement le [DestroyJob](../app/jobs/destroy_job.rb)
Pour les cas particuliers (processus spécifique au préalable ou autre), il est possible d'appeler directement le `DestroyJob`.  
Pour cela, il y a deux possibilités:
- Appeler le job de manière synchrone. Cela permet de récupérer directement le résultât de la suppression:
  - ```ruby
    result = DestroyJob.perform_now({classname: "user", id: 1})
    ```
- Appeler le job de manière asynchrone. Dans ce cas, il n'est pas possible d'avoir directement le résultat de la suppression.

Dans les deux cas ci-dessus, le job utilise et déclenche des évènements spécifiques qui peuvent être écoutés afin de connaitre l'état de la suppression.  
L'évènement est le suivant : `"destroy_#{classname}_#{id}"`

Il est donc possible d'y souscrire définitivement ou temporairement comme dans la méthode `destroy` du [user controller](../app/controllers/users_controller.rb)

## Informations supplémentaire:
Étapes du job DestroyJob:
1. récupération et tri des références par rapport aux paramètres (`destroy_params`)
2. Appel de la fonction (si existante) `pre_destroy` de l'objet à supprimer (voir ci-dessus)
3. Si des dépendances ont été envoyées pour être supprimées (selected_dep_to_destroy) alors on les supprime en appelant aussi `pre destroy` juste avant
4. Suppression des références si celles-ci sont marquées comme auto_deletable (auto_deletable_references)
5. Suppression de l'objet

Voici un cas plus concret de l'ordre dans lequel les méthodes seront appelées. Partons du principe que l'on veut supprimer l'utilisateur suivant:
```ruby
{
  id: 1,
  name: "John Doe",
  email: "test@gmail.fr",
  adhesion_id: 1,
  planning_id: 1
}
```

Dans ce cas, on a deux références à supprimer : `adhesion_id` et `planning_id`.  

Les méthodes seront appelées dans l'ordre suivant :
1. appel de `pre_destroy` sur l'objet `user` (si existant)
2. appel de `pre_destroy` sur l'objet `adhesion` (si existante)
3. suppression de l'objet adhesion
4. appel de `pre_destroy` sur l'objet `planning` (si existante)
5. suppression de l'objet `planning`
6. suppression de l'objet `user`