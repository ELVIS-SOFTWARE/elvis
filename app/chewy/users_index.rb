class UsersIndex < Chewy::Index
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

  index_scope User
  field :kind, value: ->(user) { user.class.name.downcase }
  field :user_id, value: -> { id }
  field :user_first_name, analyzer: "autocomplete", value: -> { first_name }
  field :user_last_name, analyzer: "autocomplete", value: -> { last_name }
  field :user_adherent_number, value: -> { adherent_number }
  field :user_email, analyzer: "autocomplete", value: -> { email }
  field :user_age, value: -> { age }
  field :user_sex, value: -> { sex }
  field :user_handicap, value: -> { handicap }
end
