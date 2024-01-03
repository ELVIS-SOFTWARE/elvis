unpopular_refs = ActivityRef.joins(:activity_ref_kind).where(activity_ref_kinds: {name: ["MANDOLINE", "UKULELE", "GUITARE & CHANT"]})

unpopular_refs.update_all(is_unpopular: true)
