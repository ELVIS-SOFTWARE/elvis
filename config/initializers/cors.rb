Rails.application.config.middleware.insert_before 0, Rack::Cors, debug: true do
  allow do
    origins "*"
    resource "*", headers: :any, methods: [:get]
  end
end
