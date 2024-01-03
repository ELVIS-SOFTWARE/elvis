# frozen_string_literal: true

module Elvis
  class CsvResponder
    def initialize(controller, stream)
      @controller = controller
      @stream = stream
    end

    def stream!(filename)
      headers = @controller.headers
      headers['Last-Modified'] = Time.now.to_s
      headers["Content-Type"] = "text/csv"
      headers["Content-disposition"] = "attachment; filename=\"#{filename}\""
      headers['X-Accel-Buffering'] = 'no'
      headers["Cache-Control"] ||= "no-cache"
      headers.delete("Content-Length")

      @controller.response.status = 200
      @controller.response_body = @stream
    end

    def self.stream(controller, query, options, &block)
      filename = options[:filename]
      enum     = Elvis::CsvExporter.new(query, options).enumerator(&block)
      new(controller, enum).stream!(filename)
    end

    def self.generate(controller, query, options)
      Elvis::CsvExporter.new(query, options).generate
    end
  end
end

ActionController::Renderers.add :csv do |query, options|
  filename = options.fetch(:filename, "data-#{DateTime.now.to_s}.csv")

  if options[:stream]
    Elvis::CsvResponder.stream(self, query, options, &options[:block])
  else # no stream:
    data = Elvis::CsvResponder.generate(self, query, options)

    send_data data,
              type: "text/csv",
              disposition: "attachment; filename=\"#{filename}\""
  end
end

class ActionController::Responder
  def to_csv
    if options[:stream] == true
      Elvis::CsvResponder.stream!(controller, resources.last, options)
    else
      controller.render({:csv => resources.last, :stream => false }.merge(options))
    end
  end
end
