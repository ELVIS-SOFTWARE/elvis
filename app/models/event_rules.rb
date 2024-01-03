# frozen_string_literal: true

# == Schema Information
#
# Table name: event_rules
#
#  id           :bigint           not null, primary key
#  name         :string
#  sendSMS      :boolean
#  sendMail     :boolean
#  event        :string
#  eventName    :string
#  subject      :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  templateName :string
#  carbon_copy  :string
#
class EventRules < ApplicationRecord
  def self.display_class_name(singular = true)
    singular ? "EventRules" : "EventRules"
  end

  def self.class_name_gender
    return :M
  end


  # n'existera plus dans la phase finale, uniquement pour les tests
  # def self.add_sample
  #   EventRules.create!([
  #                         {
  #                           "id": 9,
  #                           "name": "Activité acceptée",
  #                           "sendSMS": false,
  #                           "sendMail": true,
  #                           "event": "{\"value\":\"activity_accepted\",\"label\":\"une proposition d'activité est acceptée\"}",
  #                           "subject": "",
  #                           "created_at": "2023-06-28 14:25:41.054933",
  #                           "updated_at": "2023-07-05 12:32:41.373483",
  #                           "templateName": "{\"value\":1,\"label\":\"Activité acceptée\"}",
  #                           "carbon_copy": "[{\"value\":\"is_teacher\",\"label\":\"Aux professeurs\"}]",
  #                           "eventName": "activity_accepted"
  #                         },
  #                         {
  #                           "id": 7,
  #                           "name": "Utilisateur créé",
  #                           "sendSMS": true,
  #                           "sendMail": true,
  #                           "event": "{\"value\":\"user_created\",\"label\":\"un utilisateur est créé\"}",
  #                           "subject": "",
  #                           "created_at": "2023-06-28 09:40:53.793791",
  #                           "updated_at": "2023-08-17 07:17:17.910043",
  #                           "templateName": nil,
  #                           "carbon_copy": nil,
  #                           "eventName": "user_created"
  #                         },
  #                         {
  #                           "id": 8,
  #                           "name": "Layout",
  #                           "sendSMS": false,
  #                           "sendMail": true,
  #                           "event": "{\"value\":\"application_created\",\"label\":\"une application est créée\"}",
  #                           "subject": "",
  #                           "created_at": "2023-06-28 09:45:19.525190",
  #                           "updated_at": "2023-07-03 07:26:33.222557",
  #                           "templateName": "{\"value\":3,\"label\":\"layout\"}",
  #                           "carbon_copy": nil,
  #                           "eventName": "application_created"
  #                         },
  #                         {
  #                           "id": 2,
  #                           "name": "Activité assignée",
  #                           "sendSMS": false,
  #                           "sendMail": true,
  #                           "event": "{\"value\":\"activity_assigned\",\"label\":\"une activité est assignée\"}",
  #                           "subject": "",
  #                           "created_at": "2023-06-27 09:39:24.826615",
  #                           "updated_at": "2023-07-05 07:48:29.309621",
  #                           "templateName": "{\"value\":2,\"label\":\"Activité assignée\"}",
  #                           "carbon_copy": "[{\"value\":\"is_admin\",\"label\":\"Aux administrateurs\"},{\"value\":\"is_paying\",\"label\":\"Aux payeurs\"}]",
  #                           "eventName": "activity_assigned"
  #                         }
  #                       ])
  # end
end
