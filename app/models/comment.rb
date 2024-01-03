# == Schema Information
#
# Table name: comments
#
#  id               :bigint           not null, primary key
#  content          :string
#  user_id          :bigint
#  commentable_id   :bigint
#  commentable_type :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#

class Comment < ApplicationRecord
    belongs_to :commentable, polymorphic: true
    belongs_to :user
    belongs_to :user_csv, -> { select(:id, :first_name, :last_name) }, class_name: "User", required: false

    def self.display_class_name(singular = true)
        singular ? "commentaire" : "commentaire"
    end

    def self.class_name_gender
        return :M
    end

end
