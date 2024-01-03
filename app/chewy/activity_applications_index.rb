class ActivityApplicationsIndex < Chewy::Index
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

  index_scope ActivityApplication 
  field :kind, value: ->(application) { application.class.name.downcase }
  field :application_id, value: -> { id }
  field :application_status, analyzer: "autocomplete", value: -> { activity_application_status.label }
  field :application_first_name, analyzer: "autocomplete", value: -> { user.first_name }
  field :application_last_name, analyzer: "autocomplete", value: -> { user.last_name }
end
