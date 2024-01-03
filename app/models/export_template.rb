# frozen_string_literal: true

# == Schema Information
#
# Table name: export_templates
#
#  id         :bigint           not null, primary key
#  name       :string(30)       not null
#  model      :string           not null
#  content    :string           not null
#  user_id    :bigint
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class ExportTemplate < ApplicationRecord

  def self.display_class_name(singular = true)
    singular ? "modèle d'export" : "modèles d'export"
  end

  def self.class_name_gender
    return :M
  end

end
