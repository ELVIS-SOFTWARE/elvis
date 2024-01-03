# frozen_string_literal: true
module Templates
  class ActivityRefSerializer < ActiveModel::Serializer
    attribute "label", key: "Label"
    attribute "occupation_limit", key: "Capacité"
    attribute "occupation_hard_limit", key: "Capacité (avec surbooking)"

    belongs_to "activity_ref_kind"

    class ActivityRefKindSerializer < ActiveModel::Serializer
      attribute "name", key: "Famille"
      attribute "Pour enfants ?", {} do
        object.is_for_child ? "VRAI" : "FAUX"
      end
    end
  end

end