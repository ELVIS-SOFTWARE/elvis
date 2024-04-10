require_relative '../../lib/elvis/event_handler'

class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  if Rails.env.kubernetes?
    after_commit :commit_callback
    before_save :register_changes
  end

  def self.display_class_name(singular = true)
    singular ? self.class.name : self.class.name.pluralize
  end

  def self.class_name_gender
    return :M
  end

  # Récupère les associations qui pointent vers le modèle courant
  # exemple: si on est dans PaymentMethod, on récupère les associations qui pointent vers PaymentMethod (like: DuePayment, Payment)
  # @return [Array<ActiveRecord::Reflection::BelongsToReflection>]
  def self.associations_that_reference_me
    ApplicationRecord
      .subclasses # on récupère tous les modèles
      .map { |model| model.reflections.filter do |k, v|
        v.class_name == self.name # on récupère les associations qui pointent vers notre modèle
      rescue
        false # on ignore les associations qui ne sont pas définies
      end }
      .filter { |m| m.present? } # on filtre les valeurs nulles ou vides
      .flatten
      .map { |m| m.values } # on récupère les valeurs des associations (c'est un hash)
      .flatten
  end

  def self.build_subject(singular = true)
    d_name = display_class_name(singular)

    if singular
      if d_name[/^[aeiouyAEIOUY]/]
        "l'#{d_name}"
      else
        if class_name_gender == :F
          "la #{d_name}"
        else
          "le #{d_name}"
        end
      end
    else
      "les #{d_name}"
    end
  end

  def self.success_message
    "#{build_subject.capitalize} a bien été supprimé#{class_name_gender == :F ? 'e' : ''}"
  end

  # Récupère les paramètres de suppression
  # @return [{ auto_deletable_references: Array<Class<ApplicationRecord>>, ignore_references: Array<Class<ApplicationRecord>>, undeletable_message: String, deletable_message: String, success_message: String }]
  def self.destroy_params
    {
      auto_deletable_references: [], # auto delete references before deleting object
      ignore_references: [], # ignore references and try to delete object
      undeletable_message: "Impossible de supprimer parce que: <br/>",
      deletable_message: "Il faut d'abord: <br/>",
      success_message: success_message,
    }
  end

  # @return [Array<ActiveRecord::Base>] Liste des objets qui pointent vers le modèle courant
  def objects_that_reference_me
    self.class.associations_that_reference_me
        .filter { |reflection| reflection.active_record != self.class } # on ignore les auto références
        .filter { |reflection| !reflection.through_reflection? } # on ignore les associations qui sont faite via une autre association
        .filter { |reflection| !reflection.foreign_key.include?("_csv") } # on ignore les associations qui sont faite pour des CSV
        .map do |reflection|
      query = reflection.belongs_to? ? { reflection.foreign_key => self[reflection.association_primary_key] } : { reflection.association_primary_key => self[reflection.foreign_key] }
      reflection
        .active_record # on récupère le modèle de l'association
        .where(query) # on récupère les objets qui pointent vers notre modèle
        .records
    end.flatten
  end

  # Instruction permettant de supprimer un objet utilisant la classe courante
  # méthode destiné à être surchargée dans les classes filles
  # @param [ApplicationRecord] source_object objet qui a appelé la méthode
  # @return [{ instruction: String, possible: Boolean }]
  def undeletable_instruction(source_object = nil)
    { instruction: "supprimer (si possible) les \"#{self.class.display_class_name}\" relié(e)s", possible: true }
  end

  class AsyncExecutor
    include Concurrent::Async

    def execute(&block)
      block.call
    end
  end

  # async call of chewy callbacks
  def base_chewy_callbacks
    caller = self
    AsyncExecutor.new.async.execute do
      Chewy.strategy(:active_job) do
        chewy_callbacks.each { |callback| callback.call(caller) }
      end
    end
  end


  # permit caching of any static methods result (with args)
  # cache for 12 hours by default
  def self.use_cache_for_methods(*methods_to_cache, expires_in: 12.hours)
    methods_to_cache.flatten!

    (methods_to_cache || []).each do |method_to_cache|
      next unless self.method(method_to_cache)

      m = self.method(method_to_cache).to_proc

      define_singleton_method method_to_cache do |*args|
        Rails.cache.fetch("#{self.name}:#{method_to_cache}", expires_in: expires_in) do
          m.call(*args)
        end
      end
    end
  end

  # clear cache for a specific methods
  def self.clear_method_cache(*methods)
    methods.each do |method|
      Rails.cache.delete("#{self.name}:#{method}")
    end
  end

  private

  # enregistre les changements avant la sauvegarde (update/create)
  def register_changes
    @changes = nil

    if self.has_changes_to_save?
      @changes = self.changes
    end
  end

  def commit_callback
    classname = "#{self.class.name}".underscore.to_s
    events = []

    events << :create if transaction_include_any_action?([:create])
    events << :update if transaction_include_any_action?([:update])
    events << :destroy if transaction_include_any_action?([:destroy])

    return if @changes.nil? && !events.include?(:destroy)

    request = RequestStore.read :request

    args = {
      model: self,
      changes: @changes,
      controller_params: request&.params
    }

    events.each do |event|
      begin
        EventHandler.send(classname).send(event).trigger(sender: self, args: args)
      rescue StandardError => e
        Rails.logger.error "Error while triggering event #{event} on #{classname}: #{e.message}\n #{e.backtrace&.join("\n")}"
      end
    end
  end
end
