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
        res = find_by(attributes)

        if res.present?
          if all.where(id: [(self::BUILTIN_IDS.max + 1)..]).any?
            const_set('MUST_RESET_PK_SEQUENCE', true) unless const_defined?('MUST_RESET_PK_SEQUENCE')
          end

          return res
        end

        if attributes[:id].present?
          res = find_by(id: attributes[:id]) # si on trouve un objet avec cet ID, on le met à jour avec nos valeurs afin de le rendre d'equerre

          # dans le cas où on a un objet avec cet ID, mais qu'il ne correspond pas à notre modèle
          if res.present?

            # on duplique l'objet
            new_data = res.dup.as_json

            # on supprime l'ID afin de créer un nouvel objet
            new_data[:id] = nil

            new_data = create!(new_data.as_json) # on crée un nouvel objet avec les données dupliquées

            # on met à jour les clés étrangères de tous les objets qui pointent vers l'objet que l'on duplique
            self.associations_that_reference_me.each do |reflection|
              reflection
                .active_record # on récupère le modèle de l'association
                .where(reflection.foreign_key => attributes[:id])
                .update_all(reflection.foreign_key => new_data.id) # on met à jour les clés étrangères avec l'ID du nouvel objet
            end

            # on met a jour l'objet de base afin qu'il corresponde à notre modèle
            res.update! attributes

            return res
          end
        end

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
