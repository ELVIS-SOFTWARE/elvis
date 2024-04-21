FactoryBot.define do
  factory :activity_ref do
    label { "une activité" }
    activity_ref_kind { nil }
    from_age { 0 }
    to_age { 99 }
    occupation_limit { 5 }
    occupation_hard_limit { 10 }
  end
end