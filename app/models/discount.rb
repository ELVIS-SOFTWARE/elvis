# frozen_string_literal: true

# == Schema Information
#
# Table name: discounts
#
#  id                :bigint           not null, primary key
#  coupon_id         :bigint           not null
#  discountable_type :string           not null
#  discountable_id   :bigint           not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class Discount < ApplicationRecord
  belongs_to :coupon
  belongs_to :discountable, polymorphic: true

  validates :coupon, :discountable, presence: true
end
