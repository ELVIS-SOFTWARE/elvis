# frozen_string_literal: true

class PricingCategory < ApplicationRecord

  has_many :activity_ref_pricing

  def self.display_class_name(singular= true)
    singular ? "Catégorie prix" : "Catégories prix"
  end

  def self.class_name_gender
    return :M
  end
end
