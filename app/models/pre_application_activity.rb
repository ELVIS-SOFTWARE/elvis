# == Schema Information
#
# Table name: pre_application_activities
#
#  id                      :bigint           not null, primary key
#  status                  :boolean
#  comment                 :string
#  action                  :string
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  pre_application_id      :bigint
#  activity_id             :bigint
#  activity_application_id :bigint
#

class PreApplicationActivity < ApplicationRecord
  belongs_to :pre_application
  belongs_to :activity

  belongs_to :activity_application, optional: true

  def self.display_class_name(singular = true)
    singular ? "cours attribué dans le cadre d'une réinscription" : "cours attribués dans le cadre d'une réinscription"
  end

  def self.class_name_gender
    return :M
  end


  def reset
    self.status = false
    self.action = ""
    self.save!
  end
end
