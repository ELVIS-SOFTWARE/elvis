module Elvis

  class CsvExporter
    # test :
    #   Elvis::CsvConverter.new(ActivityRef.all.as_json(include: :activity_ref_kind), "tmp/toto.csv").execute

    KEY_SEP = '/'

    # gérer l'encodage, la séparation des caractères, etc.

    def initialize(query, options)
      @csv_options = {}
      @query = query

      @csv_options[:col_sep] = options.delete(:col_sep) || Parameter.get_value("app.csv_export.col_sep") || ";"
      @csv_options[:encoding] = options.delete(:encoding) || Parameter.get_value("app.csv_export.encoding") || "UTF-8"
      @skip_headers = options.delete(:skip_headers) || false
      template_headers = options.delete(:template_headers)
      serializer = options.delete(:serializer)
      @serialization_options = serializer ? { serializer: serializer } : {}

      @csv_options[:col_sep] = options.delete(:col_sep) || Parameter.get_value("app.csv_export.separator") || ";"
      @csv_options[:row_sep] = options.delete(:row_sep) || "\n"

      serializable_resource = ActiveModelSerializers::SerializableResource.new(query.first, @serialization_options)
      @first_row = serializable_resource.as_json

      avail_headers = collect_keys(@first_row)
      @keys = filter_headers(avail_headers, template_headers)
      @headers_line = @keys.map do |k|
        if k.include? KEY_SEP
          k.split(KEY_SEP)[1]
        else
          k
        end
      end

    end

    def generate
      CSV.generate(write_headers: true, headers: @headers_line, **@csv_options) do |csv|
        @query.find_each do |record|
          serializable_resource = ActiveModelSerializers::SerializableResource.new(record, @serialization_options)
          hash = serializable_resource.as_json
          csv << collect_values(hash, @keys)
          yield(hash) if block_given?
        end
      end
    end

    def enumerator
      Enumerator.new do |stream|

        @query.find_each do |record|
          if !@skip_headers
            stream << CSV.generate_line(@headers_line, **@csv_options)
            yield(1, @keys) if block_given?
            @skip_headers = true
          end
          hash = ActiveModelSerializers::SerializableResource.new(record, @serialization_options).as_json
          begin
            stream << CSV.generate_line(collect_values(hash, @keys), **@csv_options)
            yield(2, hash) if block_given?
          rescue StandardError => e
            pp e
          end
        end

        if block_given? # génération de la ligne des totaux
          array = collect_values(yield(3), @keys)
          array[0] = "Totaux"
          stream << CSV.generate_line(array, **@csv_options)
        end
      end
    end

    private

    def fetch_nested_key(hash, nested_key)
      keys = nested_key.to_s.split KEY_SEP
      keys.each do |key|
        hash = hash.fetch(key, nil)
        break if hash.nil?
      end
      hash
    end

    def row_has_nested_key?(nested_key)
      keys = nested_key.split KEY_SEP
      hash = @first_row
      keys.each do |key|
        hash = hash.fetch(key) { return false }
      end
      true
    end

    def filter_headers(avail_headers, req_headers)
      return avail_headers if req_headers.nil?

      filtered_headers = []
      req_headers.each do |header|
        filtered_headers << header if avail_headers.include?(header) && row_has_nested_key?(header)
      end
      filtered_headers
    end

    def collect_values(hash, headers)
      headers.map do |header|
        fetch_nested_key(hash, header)
      end
    end

    def collect_keys(hash, prefix = nil)
      arr = hash.map do |key, value|
        if value.class != Hash
          if prefix
            "#{prefix}#{KEY_SEP}#{key}"
          else
            key
          end
        else
          if prefix
            collect_keys(value, "#{prefix}#{KEY_SEP}#{key}")
          else
            collect_keys(value, "#{key}")
          end
        end
      end
      arr.flatten
    end

  end
end
