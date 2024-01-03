Rails.configuration.to_prepare do
  ActiveStorage::Blob.class_eval do
    before_create :generate_key_with_prefix

    def generate_key_with_prefix
      self.key = if prefix
                   File.join prefix, self.class.generate_unique_secure_token
                 else
                   self.class.generate_key_with_prefix
                 end
    end

    def prefix
      ENV["INSTANCE_SLUG"].blank? ? "elvis-dev" : ENV["INSTANCE_SLUG"]
    end
  end
end
