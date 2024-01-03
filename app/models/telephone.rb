# == Schema Information
#
# Table name: telephones
#
#  id            :bigint           not null, primary key
#  number        :string
#  label         :string
#  phonable_id   :bigint
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  phonable_type :string
#

class Telephone < ApplicationRecord
    belongs_to :phonable, :polymorphic => true

    def self.display_class_name(singular = true)
        singular ? "téléphone" : "téléphones"
    end

    def self.class_name_gender
        return :M
    end

end
