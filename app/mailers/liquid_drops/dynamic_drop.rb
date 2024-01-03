# frozen_string_literal: true
module LiquidDrops
  class DynamicDrop < Liquid::Drop
    def initialize(object)
      @object = object
    end

    def liquid_methods
      @object.attributes.keys
    end

    def method_missing(method)
      if liquid_methods.include?(method.to_s)
        @object.send(method)
      else
        super
      end
    end

    def respond_to_missing?(method, include_private = false)
      liquid_methods.include?(method.to_s) || super
    end
  end
end