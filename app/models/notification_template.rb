# frozen_string_literal: true

# == Schema Information
#
# Table name: notification_templates
#
#  id         :bigint           not null, primary key
#  body       :text
#  path       :string
#  locale     :string
#  handler    :string
#  partial    :boolean          default(FALSE)
#  format     :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  name       :string
#  json       :string
#
class NotificationTemplate < ApplicationRecord
  store_templates

  def self.find_by_path(path)
    find_by path: path
  end
end
