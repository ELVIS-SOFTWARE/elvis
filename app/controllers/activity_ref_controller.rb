class ActivityRefController < ApplicationController
  load_and_authorize_resource param_method: :ref_params
  require 'elvis/csv_responder.rb'

  respond_to :csv

  def index

    respond_to do |format|
      format.html do
        @activities = ActivityRef.all
                                 .joins(:activity_ref_kind)
                                 .group_by(&:activity_ref_kind)
                                 .sort_by { |kind, _| kind.name }
      end

      format.json do
        render json: ActivityRef.all.includes(:activity_ref_kind).as_json(
          except: [:created_at, :updated_at, :deleted_at])
      end

      format.csv do
        model_name = controller_name.classify
        default_serializer = "Templates::#{model_name}Serializer".constantize

        template_name = params[:template]&.to_sym

        query = model_name.constantize.all

        filename = "Export_activites_#{Time.now.strftime('%Y/%m/%d-%H:%M:%S')}.csv"

        # encode filename for url
        filename = URI.encode_www_form_component(filename)

        render csv: query,
               filename: filename,
               serializer: default_serializer,
               stream: false
      end
    end
  end

  def new
    @activity_ref = ActivityRef.new(substitutable: false)
    @activity_ref_application_options = []

    @activity_kinds = ActivityRefKind.all.map { |ar| [ar.name, ar.id] }

    @seasons = Season.order(:start)
    @activity_refs = ActivityRef.all.group_by(&:kind).transform_values { |arr| arr.map { |a| { label: a.label, id: a.id } } }.to_a
    @next_cycles = []

    @teachers = @activity_ref.users.map { |u| { first_name: u.first_name, last_name: u.last_name, id: u.id } }

  end

  def create
    ref_param = ref_params
    @activity_ref = ActivityRef.create!(ref_param)

    pricings = params[:activity_ref][:pricings]
    pricings.each do |pricing|
      p = ActivityRefPricing.create(
        activity_ref_id: @activity_ref.id,
        price: "#{pricing[:price]}".gsub(',', '.').to_f,
        from_season_id: pricing[:from_season_id],
        to_season_id: pricing[:to_season_id],
        pricing_category_id: pricing[:pricing_category][:id])
      p.save!

      unless p
        render json: { class: "ActivityRefPricing", errors: p.errors }, status: 500
        return
      end
    end

    unless (@activity_ref)
      render json: { class: "ActivityRef", errors: @activity_ref.errors }, status: 500
      return
    end

    update_associated_objects(ref_param)

    render json: { activityRefId: @activity_ref.id }, status: 200
  end

  def edit

    @activity_ref = ActivityRef.find(params[:id])

    @activity_kinds = ActivityRefKind.all.order(:name).map { |ar| [ar.name, ar.id] }
    @seasons = Season.order(:start)
    @activity_refs = ActivityRef.all.group_by(&:activity_ref_kind).transform_values { |arr| arr.map { |a| { label: a.label, id: a.id } } }.to_a
    @next_cycles = @activity_ref.next_cycles.pluck(:to_activity_ref_id)

    @teachers = @activity_ref.users.map { |u| { first_name: u.first_name, last_name: u.last_name, id: u.id } }
  end

  def save_picture
    params.require([:id, :picture])

    @activity_ref = ActivityRef.find(params[:id])

    if params[:picture] == "undefined"
      @activity_ref.picture.purge_later
    else
      @activity_ref.picture.attach(params["picture"])
    end

    render json: {}, status: 200
  end

  def update
    @activity_ref = ActivityRef.find(params[:id])
    ref_param = ref_params.to_h

    # force activity_type to nil if it's not set (because of the way the form is built)
    ref_param[:activity_type] = nil unless ref_param[:activity_type]

    @activity_ref.activity_ref_kind = ActivityRefKind.find ref_param[:activity_ref_kind_id]

    res = @activity_ref.update(ref_param)

    unless res
      render json: { class: "ActivityRef", errors: @activity_ref.errors }, status: 500
      return
    end

    render json: {}, status: 200 if update_associated_objects(ref_param)
  end

  def update_associated_objects(ref_param)

    #########
    # puis on enregistre les changements sur les prochains cycles
    begin
      ActivityRef.transaction do
        @activity_ref.next_cycles.destroy_all

        res = @activity_ref.next_cycles.create!(
          params[:activity_ref][:next_cycles]
            .select { |s| !s.blank? }
            .map { |to_id| { to_activity_ref_id: to_id } }
        )
      end
    rescue StandardError => e
      render json: { class: "NextCycles", errors: e }, status: 500
      return false
    end

    # puis au tour des profs
    begin
      ActivityRef.transaction do
        @activity_ref.teachers_activity_refs.where.not(user_id: params[:activity_ref][:users]).destroy_all

        params[:activity_ref][:users].each do |user_id|
          unless @activity_ref.users.where(id: user_id).any?
            @activity_ref.users << User.find(user_id)
          end
        end
      end
    rescue StandardError => e
      render json: { class: "Teachers", errors: e }, status: 500
      return false
    end

    #########
    # et enfin on enregistre les changements sur la composition de l'atelier (le cas échéant)
    begin
      ActivityRef.transaction do
        @activity_ref.activity_refs_instruments.where.not(instrument_id: params[:activity_ref][:instruments].keys).destroy_all

        params[:activity_ref][:instruments].each do |instrument_id, count|
          next if count.blank? || count.to_i.zero?

          base_count = @activity_ref.instruments.where(id: instrument_id).count
          instrument = Instrument.find(instrument_id)

          if base_count > count.to_i
            @activity_ref.activity_refs_instruments.where(instrument_id: instrument_id).limit(base_count - count.to_i).destroy_all
          else
            # add instrument as many times as requested
            (0...(count - base_count)).each do
              @activity_ref.instruments << instrument
            end
          end
        end
        @activity_ref.save!
      end
    rescue StandardError => e
      render json: { class: "Instruments", errors: e }, status: 500
      return false
    end

    true
  end

  def destroy
    # @type [ActivityRef]
    @activity_ref = ActivityRef.find(params[:id])

    references = @activity_ref.objects_that_reference_me

    deletable_references = []
    undeletable_references = []

    references.each do |ref|
      if [ActivityRefPricing].include?(ref.class)
        deletable_references << ref
      elsif [ActivityRefKind].include?(ref.class)
        # ignored references
      else
        undeletable_references << ref
      end
    end

    if undeletable_references.any?
      flash[:destroy_error] = "Impossible de supprimer cette activité car elle est référencée par #{undeletable_references.map { |r| "#{r.class.name&.underscore}".humanize }.uniq.join(', ')}}"

      redirect_to activity_ref_index_path
      return
    end

    begin
      ActiveRecord::Base.transaction do
        deletable_references.each(&:destroy)
        @activity_ref.activity_ref_pricing.destroy_all
        @activity_ref.destroy
      end
    rescue StandardError => e
      flash[:destroy_error] = "Impossible de supprimer cette activité car elle est référencée par d'autres objets"
    end

    redirect_to activity_ref_index_path
  end

  def set_instruments
    activity_ref = ActivityRef.find(params[:id])

    ActivityRef.transaction do
      activity_ref.instruments.clear

      params[:instruments].each do |instrument_id, count|
        instrument = Instrument.find(instrument_id)

        # add instrument as many times as requested
        (0...count).each do
          activity_ref.instruments << instrument
        end
      end
    end

    render json: { res: "ok" }
  end

  private

  def ref_params
    params.require(:activity_ref).permit(
      :id,
      :label,
      :activity_ref_kind_id,
      :occupation_limit,
      :occupation_hard_limit,
      :image,
      :monthly_price,
      :quarterly_price,
      :annual_price,
      :special_price,
      :has_additional_student,
      :picture,
      :is_lesson,
      :is_visible_to_admin,
      :from_age,
      :to_age,
      :is_unpopular,
      :is_evaluable,
      :allows_timeslot_selection,
      :substitutable,
      :next_cycles,
      :is_work_group,
      :activity_type,
      :users,
      :nb_lessons,
      :duration,
    )
  end
end
