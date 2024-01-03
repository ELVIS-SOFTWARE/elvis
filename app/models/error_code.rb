# == Schema Information
#
# Table name: error_codes
#
#  id           :bigint           not null, primary key
#  name         :string
#  code         :string
#  user_message :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class ErrorCode < ApplicationRecord

  begin
    SYSTEM_EXCEPTION = find_or_create_by(code: "0", user_message: "Une erreur inconnue est survenue", name: "System exception")
  rescue ActiveRecord::ConnectionNotEstablished, ActiveRecord::NoDatabaseError
    SYSTEM_EXCEPTION = nil
  end

  def message
    user_message
  end

  begin
    ErrorCode.all.each do |error_code|
      const_name = error_code.name.gsub(" ", "_").underscore.upcase
      const_set const_name, BaseRendererError.new(error_code.user_message, error_code.code) unless const_defined?(const_name)
    end
  rescue ActiveRecord::ConnectionNotEstablished, ActiveRecord::NoDatabaseError
    Rails.logger.warn "Database not available, error codes not loaded"
  end

end
