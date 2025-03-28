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
          status: 'ok',
          message: "",
          duration: "#{(stop - start) * 1000}ms"
        }
      else
        raise 'Database is not active'
      end

    rescue StandardError => e
      stop = Time.now
      components_status[:database] = {
        status: 'ko',
        message: e.message,
        duration: "#{(stop - start) * 1000}ms"
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
          status: 'ok',
          message: "",
          duration: "#{(stop - start) * 1000}ms"
        }
      rescue StandardError => e
        stop = Time.now
        components_status[:redis] = {
          status: 'ko',
          # remove urls from string
          message: "#{e.message}",
          duration: "#{(stop - start) * 1000}ms"
        }
      end
    end

    # test elsticsearch connection
    start = Time.now
    begin
      Chewy.client.cluster.health
      stop = Time.now

      components_status[:elasticsearch] = {
        status: 'ok',
        message: "",
        duration: "#{(stop - start) * 1000}ms"
      }

    rescue StandardError => e
      stop = Time.now
      components_status[:elasticsearch] = {
        status: 'ko',
        message: e.message,
        duration: "#{(stop - start) * 1000}ms"
      }
    end

    final_status = {}
    final_status.merge!(components_status)

    final_status[:status] = final_status.values.all? { |status| status[:status] == 'ok' } ? 'ok' : 'ko'
    final_status[:message] = final_status[:status] == 'ok' ? 'All systems operational' : 'Some systems are down'

    render json: final_status, status: final_status[:status] == 'ok' ? 200 : 500

  rescue StandardError => e
    render json: {
      status: 'ko',
      message: e.message
    }, status: 500
  end

end
