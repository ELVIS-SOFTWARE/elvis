module DateHelper
  require 'date'
  require 'i18n'

  def self.month_name(month_number)
    I18n.t("date.month_names")[month_number]
  end
end