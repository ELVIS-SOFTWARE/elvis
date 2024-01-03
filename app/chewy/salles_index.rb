class SallesIndex < Chewy::Index
  settings analysis: {
    filter: {
      autocomplete_filter: {
        type: "edge_ngram",
        min_gram: 1,
        max_gram: 20
      }
    },
    analyzer: {
      autocomplete: {
        type: "custom",
        tokenizer: "standard",
        filter: %w[lowercase asciifolding autocomplete_filter]
      },
      search: {
        type: "custom",
        tokenizer: "standard",
        filter: %w[lowercase asciifolding]
      },
      email: {
        tokenizer: "keyword",
        filter: ["lowercase"]
      }
    }
  }

  index_scope Room
  # field :type, type: 'keyword', value: ->(room) { room.class.name.downcase }
  field :room_id, value: -> { id }
  field :room_name, analyzer: "autocomplete", value: -> { label }
  field :room_floor, value: -> { floor }
  field :is_practice_room, type: "boolean", value: -> { is_practice_room }
end
