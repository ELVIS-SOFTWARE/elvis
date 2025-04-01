class HealthcheckController < ActionController::Base
  http_basic_authenticate_with name: "#{ENV['HEALTH_CHECK_USER']}", password: "#{ENV['HEALTH_CHECK_PASSWORD']}" if ENV['HEALTH_CHECK_USER'].present? && ENV['HEALTH_CHECK_PASSWORD'].present?

  def index
    components_status = {}

    # test database connection
    start = Time.now
    begin
      database_active = ActiveRecord::Base.connection.active?

      if database_active
        res = ActiveRecord::Base.connection.execute('SELECT 1')
        stop = Time.now

        unless res.present?
          raise 'Database is not accessible'
        end

        components_status[:database] = {
          status: 1,
          message: "",
          duration: (stop - start) * 1000
        }
      else
        raise 'Database is not active'
      end

    rescue StandardError => e
      stop = Time.now
      components_status[:database] = {
        status: 0,
        message: e.message,
        duration: (stop - start) * 1000
      }
    end

    if ENV['REDIS_URL']
      # test redis connection
      start = Time.now
      begin
        redis = Redis.new(url: ENV['REDIS_URL'])
        redis.ping
        stop = Time.now

        components_status[:redis] = {
          status: 1,
          message: "",
          duration: (stop - start) * 1000
        }
      rescue StandardError => e
        stop = Time.now
        components_status[:redis] = {
          status: 0,
          # remove urls from string
          message: "#{e.message}",
          duration: (stop - start) * 1000
        }
      end
    end

    # test elsticsearch connection
    start = Time.now
    begin
      Chewy.client.cluster.health
      stop = Time.now

      components_status[:elasticsearch] = {
        status: 1,
        message: "",
        duration: (stop - start) * 1000
      }

    rescue StandardError => e
      stop = Time.now
      components_status[:elasticsearch] = {
        status: 0,
        message: e.message,
        duration: (stop - start) * 1000
      }
    end

    final_status = {}

    all_system_up = components_status.values.all? { |status| status[:status] == 1 }

    final_status[:status] = all_system_up ? 1 : 0
    final_status[:message] = all_system_up ? 'All systems operational' : 'Some systems are down'

    final_status = final_status.merge(components_status)

    render json: final_status, status: all_system_up ? 200 : 500

  rescue StandardError => e
    render json: {
      status: 0,
      message: e.message
    }, status: 500
  end

end
