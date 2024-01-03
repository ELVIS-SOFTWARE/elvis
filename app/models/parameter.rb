# frozen_string_literal: true

# == Schema Information
#
# Table name: parameters
#
#  id         :bigint           not null, primary key
#  label      :string
#  value      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  value_type :string           default("string")
#
class Parameter < ApplicationRecord
  def parse
    case value_type
    when "json"
      JSON.parse(value)
    when "float"
      value.to_f
    when "int", "integer"
      value.to_i
    when "boolean", "bool"
      value == "true"
    else
      value
    end
  end

  def self.get_value(label)
    p = Parameter.find_by(label: label)
    return nil unless p

    p.parse
  end
end
