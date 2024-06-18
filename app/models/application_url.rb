# == Schema Information
#
# Table name: application_urls
#
#  id           :bigint           not null, primary key
#  url          :string
#  is_main      :boolean          default(FALSE), not null
#  last_used_at :datetime
#
#== Schema Information
#
# Table name: application_urls
#
#  id                              :bigint(8)        not null, primary key
#  url                             :string           default("")
#  is_main                         :boolean          not null
#  last_used_at                    :datetime         not null
class ApplicationUrl < ApplicationRecord
  if Rails.env.kubernetes?
    skip_callback :commit, :after, :commit_callback
  end

  def self.main_root_url
    Rails.cache.fetch("ApplicationUrl::main_root_url", expires_in: 12.hours) do
      ApplicationUrl.where(is_main: true).first&.url
    end
  end

  def self.reset_main_root_url_cache
    Rails.cache.delete("ApplicationUrl::main_root_url")
  end
end
