# frozen_string_literal: true

class DestroyJob < ApplicationJob

  class DestroyEndError < StandardError
    def initialize(data)
      super(data[:message])

      @data = data
    end

    def data
      @data
    end
  end

  def perform(*params)
    get_objects(*params)

    references = @object.objects_that_reference_me

    deletable_refs = []
    undeletable_refs = []

    # =================================================================================================================
    # | On sépare les références qui peuvent être supprimées automatiquement des références qui ne peuvent pas l'être |
    # =================================================================================================================
    references.each do |reference|
      if @destroy_params[:auto_deletable_references].include?(reference.class)
        deletable_refs << reference
      else
        unless @destroy_params[:ignore_references].include?(reference.class)
          undeletable_refs << reference
        end
      end
    end

    # ==============================================================================================================
    # | A partir d'ici on se met dans une transaction éviter de modifier la base de données si une erreur survient |
    # ==============================================================================================================
    ActiveRecord::Base.transaction do

      # ============================================================================================================
      # | On execute la méthode pre_destroy si elle existe (permet de faire des vérifications avant la suppression |
      # | ou de supprimer des dépendances automatiquement)                                                         |
      # ============================================================================================================
      if @object.respond_to?(:pre_destroy)
        begin
          @object.pre_destroy
        rescue StandardError => e
          data = {
            success: false,
            message: "Une erreur est survenue lors de la pré-suppression de l'objet: <strong>#{e.message}</strong>",
            status: :internal_server_error
          }

          raise DestroyEndError.new(data)
        end
      end

      # ===================================================================================================================
      # | On supprime les dépendances sélectionnées non supprimables automatiquement mais qui peuvent l'être manuellement |
      # ===================================================================================================================
      if @selected_dep_to_destroy.any?
        tmp.each do |ref|
          if @selected_dep_to_destroy.include?(ref.class) && ref.undeletable_instruction(@object)[:possible]
            ref.pre_destroy if ref.respond_to?(:pre_destroy)
            ref.destroy!
            undeletable_refs.delete(ref)
          end
        end
      end

      # ================================================================================================
      # | Si il reste des dépendances non supprimables automatiquement, on affiche un message d'erreur |
      # ================================================================================================
      if undeletable_refs.any?
        messages = undeletable_refs.map {|ref| ref.undeletable_instruction(@object) }

        has_impossible_deletion = messages.any? {|message| !message[:possible] }

        message = has_impossible_deletion ? @destroy_params[:undeletable_message] : @destroy_params[:deletable_message]

        message += "<ul>"

        message += messages.filter{|m| m[:possible] != has_impossible_deletion}.map {|m| "<li>#{m[:instruction]}</li>" }.uniq.take(20).join("")

        # on ne prendra que les 20 premiers messages d'erreur
        if messages.count > 20 && !has_impossible_deletion
          message += "<li>#{undeletable_refs.count - 20} autres dépendances...</li>"
        end

        message += "</ul>"

        data = {
          success: false,
          status: :unprocessable_entity,
          message: message
        }

        raise DestroyEndError.new(data)
      end

      # =======================================================================================================
      # | Si toutes les dépendances sont supprimables automatiquement, on supprime l'objet et ses dépendances |
      # =======================================================================================================

      deletable_refs.each do |ref|
        ref.pre_destroy if ref.respond_to?(:pre_destroy)
        ref.destroy!
      end
      @object.destroy!
    end

    data = {
      success: true,
      message: @destroy_params[:success_message],
      status: :ok
    }

    EventHandler.send("#{@classname.name}").destroy_ended.trigger(
      sender: self.class.name,
      args: data,
      objId: @object&.id
    )

    return data

  # catch all personnal error (bad data, etc.)
  rescue DestroyEndError => e
    EventHandler.send("#{@classname.name}").destroy_ended.trigger(
      sender: self.class.name,
      args: e.data,
      objId: @object&.id
    )

    return e.data

  # catch class not found errors (for personnal errors messages)
  rescue NameError => e
    Rails.logger.error("La classe n'a pas été trouvée: #{e.message}\n#{(e.backtrace || []).join("\n")}")

    data = {
      success: false,
      message: "La classe #{params&.first&.fetch(:classname, "Inconnue")} n'a pas été trouvée.",
      status: :not_found
    }

    EventHandler.send("#{params&.first&.fetch(:classname, "Inconnue")}").destroy_ended.trigger(
      sender: self.class.name,
      args: data,
      objId: @object&.id
    )

    return data

    # catch record not found errors (for personnal errors messages)
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("L'objet n'a pas été trouvé: #{e.message}\n#{(e.backtrace || []).join("\n")}")

    data = {
      success: false,
      message: "L'objet n'a pas été trouvé.",
      status: :not_found
    }

    EventHandler.send("#{@classname.name}").destroy_ended.trigger(
      sender: self.class.name,
      args: data,
      objId: @object&.id
    )

    return data

  # catch all other errors with généric message
  rescue StandardError => e
    Rails.logger.error("Une erreur est survenue lors de la suppression de l'objet. #{e.message}\n#{(e.backtrace || []).join("\n")}")

    data = {
      success: false,
      message: "Une erreur est survenue lors de la suppression de l'objet. #{e.message}",
      status: :internal_server_error
    }

    EventHandler.send("#{@classname&.name || params&.first&.fetch(:classname, "notFound")}").destroy_ended.trigger(
      sender: self.class.name,
      args: data,
      objId: @object&.id
    )

    return data
  end

  private

  def get_objects(params)
    # @type [Class<ApplicationRecord>]
    @classname = params[:classname].camelcase.constantize

    # @type [{ auto_deletable_references: Array<Class<ApplicationRecord>>, undeletable_message: String, deletable_message: String, success_message: String }]
    @destroy_params = @classname.destroy_params

    # @type [ApplicationRecord]
    @object = params[:object] || @classname.find(params[:id])

    begin
      # @type [Array<Class<ApplicationRecord>>]
      @selected_dep_to_destroy = (params[:selected_dep_to_destroy] || []).map(&:constantize)
    rescue StandardError => e
      Rails.logger.error("Une erreur est survenue lors de la récupération des dépendances sélectionnées. #{e.message}\n#{(e.backtrace || []).join("\n")}")
      @selected_dep_to_destroy = []
    end
  end
end
