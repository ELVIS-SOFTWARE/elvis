module Elvis
  module ConstantLike
    def self.included(mod)
      mod.extend ClassMethods
    end

    def self.extended(mod)
      mod.extend ClassMethods
    end

    module ClassMethods

      unless const_defined?('BUILTIN_IDS')
        const_set('BUILTIN_IDS', [])
      end

      def find_or_create_by!(attributes, &block)
        res = find_by(id: attributes[:id])

        return res if res.present?

        res = create!(attributes, &block)
        const_set('MUST_RESET_PK_SEQUENCE', true) unless const_defined?('MUST_RESET_PK_SEQUENCE')
        res
      end

      def reset_pk_sequence
        return unless const_defined?('MUST_RESET_PK_SEQUENCE')
        ActiveRecord::Base.connection.reset_pk_sequence!(table_name)
        remove_const('MUST_RESET_PK_SEQUENCE')
      end

      def self.extended(mod)
        mod.include InstanceMethods
      end
    end

    module InstanceMethods
      def built_in
        self.class::BUILTIN_IDS.include?(self.id)
      end
    end
  end
end
