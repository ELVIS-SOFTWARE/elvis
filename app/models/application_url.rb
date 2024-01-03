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

  def self.main_root_url
    ApplicationUrl.where(is_main: true).first&.url
  end

end
