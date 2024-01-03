module Onboarding
  class StartupReporter
    def self.execute(*args)
      new(*args).execute
    end

    def initialize(step)
      instance_name = (ENV["INSTANCE_SLUG"]).to_s
      pod_id = (ENV["POD_ID"]).to_s

      @body = {
        instanceName: instance_name,
        podId: pod_id,
        context: 0,
        step: step
      }

      @uri = URI("http://elvis-onboarding-api.elvis.svc:5000/api/cockpit/instanceActivity")
      # @uri = URI("http://192.168.12.1:5284/api/podActivity")
      pp "will call #{@uri} with body #{@body}"
    end

    def execute
      begin
        http = Net::HTTP.new(@uri.host, @uri.port)
        http.use_ssl = (@uri.scheme.eql? "https")

        response = http.post(@uri.path, @body.to_json, "Content-Type" => "application/json")

        pp "error : ", response if response.code != "200"
        return response.code == "200"
      rescue StandardError => e
        pp e
      end

      false
    end
  end
end
