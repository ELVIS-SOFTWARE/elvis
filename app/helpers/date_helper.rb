module DateHelper
  require 'date'
  require 'i18n'

  def self.month_name(month_number)
    return nil unless month_number>=1 && month_number<=12

    @month_names ||= []
    @month_names[month_number-1] ||= I18n.t("date.month_names")[month_number]
  end

  def self.month_names
    @month_names
  end

  begin
    (1..12).each do |month_number|
      month_name(month_number)
    end
  end
end