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
    when "duration"
      begin
        value.to_i.send(value.split(".").last || "minutes")
      rescue StandardError
        nil
      end
    else
      value
    end
  end

  def self.get_value(label, default: nil)
    Rails.cache.fetch("parameter_#{label}", expires_in: 1.hour) do
      p = Parameter.find_by(label: label)
      return default unless p

      p.parse || default
    end
  end
end
