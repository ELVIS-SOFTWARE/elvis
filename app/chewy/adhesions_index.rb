class AdhesionsIndex < Chewy::Index
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

  index_scope Adhesion 
  field :kind, value: ->(adhesion) { adhesion.class.name.downcase }
  field :adhesion_user_id, value: -> { user.id }
  field :adhesion_adherent_number, value: -> { user.adherent_number }
  field :adhesion_first_name, analyzer: "autocomplete", value: -> { user.first_name }
  field :adhesion_last_name, analyzer: "autocomplete", value: -> { user.last_name }
end
