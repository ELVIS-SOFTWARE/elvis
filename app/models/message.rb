# == Schema Information
#
# Table name: messages
#
#  id         :bigint           not null, primary key
#  title      :text             not null
#  content    :text             not null
#  is_sms     :boolean          not null
#  is_email   :boolean          not null
#  user_id    :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Message < ApplicationRecord
    has_many :message_recipients
    has_many :recipients, through: :message_recipients
    belongs_to :sender, class_name: :User, foreign_key: :user_id

    def self.display_class_name(singular = true)
        singular ? "message" : "messages"
    end

    def self.class_name_gender
        return :M
    end

end
