require_relative 'lib/elvis/plugin_gem_utils.rb'

source "https://rubygems.org"

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

gem "base64"

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem "rails", "6.1.7.8"
gem "rails_event_store"
# Use postgresql as the database for Active Record
gem "pg"
# Use Puma as the app server
gem "puma"
gem "bootsnap"
gem "mutex_m"
# Transpile app-like JavaScript. Read more: https://github.com/rails/webpacker
gem "react-rails"
gem "shakapacker"

gem "irb"
gem "i18n"

gem "request_store"

gem "rails-i18n"

gem "aws-sdk-s3", require: false
gem "azure-storage-blob"
gem "cancancan"
gem "devise"
gem "devise-token_authenticatable"

gem "annotate"

gem "responders"
gem "wicked_pdf"
gem "wkhtmltopdf-binary"
gem 'rubyzip'

gem "kaminari", '~> 1.2.2'

gem "deep_cloneable"

gem "active_model_serializers"
gem "fast_jsonapi"
gem "oj"

gem "sentry-rails"
gem "sentry-ruby"

gem "acts_as_paranoid"
gem "chewy", "< 7.4"
gem "sidekiq"

gem "rqrcode"

gem "recaptcha", require: "recaptcha/rails"
gem "countries"
gem "money"
gem "phony_rails"

# Profiling
gem 'redis-namespace'
gem 'rails_performance'
gem 'rack-mini-profiler', require: false
gem 'memory_profiler' # For memory profiling
gem 'stackprof' # For call-stack profiling flamegraphs


group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem "byebug", platforms: %i[mri mingw x64_mingw]
  gem "capybara"
  gem 'rspec-rails'
  gem "minitest-rails"
  gem 'database_cleaner'
  gem "factory_bot_rails"
  gem 'rails-controller-testing'
  gem "rspec"
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem "listen", ">= 3.0.5"
  gem "web-console", ">= 3.3.0"
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  # gem 'spring'
  # gem 'spring-watcher-listen', '~> 2.0.0'
  # gem 'memory_profiler'

  gem "pry-rails"

  gem "bullet"

  gem "seed_dump"
  gem "letter_opener"
  gem "foreman"
end

gem "rack-cors"

gem "composite_primary_keys"

gem "rails_semantic_logger"
gem "translate_enum"
gem "activejob-status"
gem "mimemagic"
gem "phonelib"
gem "rchardet"
gem "acsv-p"
gem "liquid-rails", git:"https://github.com/Countable-us/liquid-rails", branch: 'master'
gem "panoramic", github: "abstracts33d/panoramic"
gem "whenever"

PluginGemUtils.get_plugins_to_install(include_libraries: true).each do |plugin|

  if plugin.is_from_tag?
    gem plugin.name, git: plugin.full_url, tag: plugin.tag
  else
    gem plugin.name, git: plugin.full_url, branch: plugin.branch
  end
end
