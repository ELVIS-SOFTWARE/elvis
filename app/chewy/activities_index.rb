class ActivitiesIndex < Chewy::Index
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

  index_scope ActivityRef     
  field :kind, value: ->(activity) { activity.class.name.downcase }
  field :activity_id, value: -> { id }
  field :activity_name, analyzer: "autocomplete", value: -> { label }
end
