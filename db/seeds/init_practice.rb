# init rooms 

Room.transaction do
    Room.create!([
        {label: "STAX", kind: "?", floor: 0, location_id: 1, is_practice_room: true},
        {label: "RAK", kind: "?", floor: 0, location_id: 1, is_practice_room: true},
        {label: "SUN", kind: "?", floor: 0, location_id: 1, is_practice_room: true},
        {label: "CHESS", kind: "?", floor: 0, location_id: 1, is_practice_room: true},
        {label: "ELECTRIC LADY", kind: "?", floor: 0, location_id: 1, is_practice_room: true},
        {label: "MOTOWN", kind: "?", floor: 0, location_id: 1, is_practice_room: true},
    ])
end

BandType.transaction do
    BandType.create!([
        {name: "Professionnel"},
        {name: "Semi-professionnel"},
        {name: "Amateur"},
    ])
end

MusicGenre.transaction do
    MusicGenre.create!([
        {name: "Rock"},
        {name: "Pop"},
        {name: "Alternatif"},
        {name: "Chants Guturaux"},
    ])
end

Band.transaction do
    Band.create!([
        {name: "Rolling Stones", band_type_id: 1, music_genre_id: 1},
        {name: "Beatles", band_type_id: 2, music_genre_id: 2},
        {name: "Led Zeppelin", band_type_id: 3, music_genre_id: 3},
        {name: "The Who", band_type_id: 1, music_genre_id: 4},
        {name: "Creedence", band_type_id: 2, music_genre_id: 1},
        {name: "ZZ Top", band_type_id: 3, music_genre_id: 2},
    ])
end

Material.transaction do
    Material.create!([
        {name: "Cymballes", active: true},
        {name: "Baguettes", active: true},
        {name: "Médiator", active: true},
        {name: "Pile", active: true},
        {name: "Cordes", active: true},
        {name: "Pédales", active: true},
    ])
end

FlatRate.transaction do
    FlatRate.create!([
        {name: "Forfait 10h", enable: true, nb_hour: 10, solo_duo_rate: 0, group_rate: 100},
        {name: "Forfait 20h", enable: true, nb_hour: 20, solo_duo_rate: 135, group_rate: 190},
        {name: "Forfait 40h", enable: true, nb_hour: 40, solo_duo_rate: 0, group_rate: 360},
    ])
end

PracticeSession.transaction do
    rooms = Room.practice
    start = Time.now.beginning_of_hour
    stop = start + 1.hour
    band = Band.first
    rooms.each{|r| 
        Practices::CreateSession.new(band, r, start, stop).execute 
    };
end