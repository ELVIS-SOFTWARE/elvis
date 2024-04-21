# frozen_string_literal: true

module ActivityApplications

  class CsvImporter
    def initialize(file)
      @file = file
    end

    def call
      raise NotImplementedError
    end
  end
end