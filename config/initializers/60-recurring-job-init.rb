# frozen_string_literal: true

require 'whenever'

if Rails.env.production? || Rails.env.kubernetes?
  `whenever --update-crontab`
  puts "Crontab updated"

  at_exit do
    `whenever --clear-crontab`
    puts "Crontab cleared"
  end
else
  puts "recurring job not started in development mode because that touches the crontab"
end