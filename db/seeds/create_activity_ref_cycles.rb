un_a_deux_enfance = ActivityRef.find_by(label: "Eveil 12/24 mois")
deux_a_trois_enfance = ActivityRef.find_by(label: "Eveil 24 mois / 3 ans")
trois_a_quatre_enfance = ActivityRef.find_by(label: "Eveil 3/4 ans")
quatre_a_cinq_enfance = ActivityRef.find_by(label: "Eveil 4/5 ans")
cinq_a_six_enfance = ActivityRef.find_by(label: "Eveil 5/6 ans")

decouverte_instrumentale = ActivityRef.find_by(label: "Découverte instrumentale")
petit_orchestre = ActivityRef.find_by(label: "Petit Orchestre")

# On ajouter les liens entre activités d'Enfance
ActivityRefCycle.create!([
    {
        from: un_a_deux_enfance,
        to: deux_a_trois_enfance,
    },
    {
        from: deux_a_trois_enfance,
        to: trois_a_quatre_enfance,
    },
    {
        from: trois_a_quatre_enfance,
        to: quatre_a_cinq_enfance,
    },
    {
        from: quatre_a_cinq_enfance,
        to: cinq_a_six_enfance,
    },
    {
        from: cinq_a_six_enfance,
        to: decouverte_instrumentale,
    },
    {
        from: cinq_a_six_enfance,
        to: petit_orchestre,
    },
    {
        from: petit_orchestre,
        to: decouverte_instrumentale,
    }
])

# On ouvre découverte instru et petit orchestre aux cours d'instrument
ActivityRef.where.not("UPPER(kind) IN ('ENFANCE', 'ACTIONS CULTURELLES', 'CHAM', 'FORMATION PROFESSIONNELLE', 'REPETITION')").each do |ref|
    ActivityRefCycle.create!([
        {
            from: petit_orchestre,
            to: ref,
        },
        {
            from: decouverte_instrumentale,
            to: ref,
        },
    ])
end