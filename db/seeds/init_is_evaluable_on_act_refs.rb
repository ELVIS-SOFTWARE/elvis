EVALUABLE_KINDS = [
    "BASSE",
    "PIANO",
    "CHANT",
    "UKULELE",
    "GUITARE",
    "ATELIERS",
    "BATTERIE",
    "MANDOLINE",
    "ATELIERS 1H30",
    "GUITARE & CHANT"
].freeze

to_change = ActivityRef.joins(:activity_ref_kind).where(activity_ref_kinds: {name: EVALUABLE_KINDS})
to_change.update_all(is_evaluable: true)
