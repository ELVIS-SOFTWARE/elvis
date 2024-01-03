# == Schema Information
#
# Table name: message_recipients
#
#  id         :bigint           not null, primary key
#  message_id :bigint           not null
#  user_id    :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class MessageRecipient < ApplicationRecord
    belongs_to :message
    belongs_to :recipient, class_name: :User, foreign_key: :user_id

    def self.display_class_name(singular = true)
        singular ? "destinataire de message" : "destinataire de messages"
    end

    def self.class_name_gender
        return :M
    end

end
