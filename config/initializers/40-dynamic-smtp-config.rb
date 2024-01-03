require 'openssl'

class String
  def encrypt
    cipher = OpenSSL::Cipher.new('aes-256-cbc').encrypt
    cipher.key = Digest::MD5.hexdigest(ENV["INSTANCE_NAME"] || "development")
    s = cipher.update(self) + cipher.final

    s.unpack('H*')[0].upcase
  end

  def decrypt
    cipher = OpenSSL::Cipher.new('aes-256-cbc').decrypt
    cipher.key = Digest::MD5.hexdigest(ENV["INSTANCE_NAME"] || "development")
    s = [self].pack("H*").unpack("C*").pack("c*")

    cipher.update(s) + cipher.final
  end
end

class EmailConfigInterceptor
  def self.delivering_email(message)

    password = Parameter.get_value("app.email.password")

    options = {
      address: Parameter.get_value("app.email.address") || "",
      authentication: Parameter.get_value("app.email.authentication") || :login,
      domain: Parameter.get_value("app.email.domain") || "",
      password: password.present? ? password.to_s.decrypt : "",
      port: (Parameter.get_value("app.email.port") || "587").to_i,
      user_name: Parameter.get_value("app.email.username") || "",
      ssl: Parameter.get_value("app.email.ssl_tls")=="true",
      tls: Parameter.get_value("app.email.ssl_tls")=="true"
    }

    # check si message.from == nil, si c'est le cas on lui attribue la valeur de la base de donnée
    if message.from.nil?
      message.from = Parameter.get_value("app.application_mailer.default_from")
    end

    redirect = Parameter.get_value("app.email.redirect") || []

    if redirect.length > 0
      message.to = redirect
    end

    return if options[:user_name].blank? || options[:password].blank?

    message.delivery_method.settings.merge!(options)
  end
end

ActionMailer::Base.register_interceptor(EmailConfigInterceptor)
