# All activities
ActivityRef.all.update({ :from_age => 1, :to_age => 150 })

# Enfance
ActivityRef.where(label: 'Eveil 12/24 mois').update({ :from_age => 1, :to_age => 2 })
ActivityRef.where(label: 'Eveil 24 mois / 3 ans').update({ :from_age => 2, :to_age => 3 })
ActivityRef.where(label: 'Eveil 3/4 ans').update({ :from_age => 3, :to_age => 4 })
ActivityRef.where(label: 'Eveil 4/5 ans').update({ :from_age => 4, :to_age => 5 })
ActivityRef.where(label: 'Eveil 5/6 ans').update({ :from_age => 5, :to_age => 6 })
ActivityRef.where(label: 'Découverte instrumentale').update({ :from_age => 6, :to_age => 8 })
ActivityRef.where(label: 'Petit Orchestre').update({ :from_age => 6, :to_age => 7 })