if Rails.cache.is_a?(ActiveSupport::Cache::NullStore)
  ActiveJob::Status.store = :file_store, "/tmp/file_store"
end

ActiveJob::Status.options = { includes: %i[status exception] }