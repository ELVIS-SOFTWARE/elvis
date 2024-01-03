# frozen_string_literal: true

# == Schema Information
#
# Table name: coupons
#
#  id          :bigint           not null, primary key
#  label       :string
#  percent_off :float
#  valid       :boolean          default(TRUE)
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Coupon < ApplicationRecord
  has_many :discounts, dependent: :restrict_with_error

  acts_as_paranoid

  validates :label, presence: true
  validates :percent_off, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :enabled, inclusion: { in: [true, false] }


  def self.apply_discount_to_price(price, coupon)
    return unless price
    return price unless coupon

    price - (price * (coupon.percent_off / 100))
  end

  def has_any_discount
    discounts.any?
  end
end
