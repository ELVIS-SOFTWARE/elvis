class RoomsController < ApplicationController
  load_and_authorize_resource param_method: :room_params

  def index
    @rooms = Room.includes(:activities).all
    unless params[:location].blank?
      @location = Location.find_by_id(params[:location])
      @rooms = @rooms.where(location: @location)
    end

    respond_to do |format|
      format.html do
        @rooms = @rooms.group_by(&:floor)

        if @rooms[nil].present?
          @rooms[0] ||= []

          @rooms.delete(nil).each do |room|
            @rooms[0] << room
          end
        end
      end

      format.json do
          render json: @rooms.as_json(
              except: [:created_at, :updated_at, :deleted_at] )
      end
    end
  end

  # Renvoie la liste des salles avec leur disponibilité sur le créneau spécifié
  # **Paramètres**
  # - start : le début du créneau sur lequel vérifier les disponibilités
  # - end : la fin du créneau sur lequel vérifier les disponibilités
  # - recurrence (optionnel) : 1 pour vérifier la disponibilité toutes les semaines ; 0 ou absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # - from_date (optionnel) : date de début pour la récurrence ; absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # - to_date (optionnel) : date de fin pour la récurrence ; absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # **Retourne**
  # - un JSON avec les objets Room correspondant aux salles et enrichi avec une propriété "has_overlap"
  # - la propriété "has_overlap" vaut false si la salle est disponible ; sinon, elle contient le 1er créneau où la salle n'est pas disponible
  def index_with_overlap
    @current_user = current_user
    authorize! :manage, @current_user.is_admin

    ti_params = params.permit( 
      :startTime, 
      :endTime,
      :recurrence,
      :fromDate,
      :toDate,
      :activityRefId,
    )

    interval = TimeInterval.new({start: ti_params[:startTime], end: ti_params[:endTime]})
    if(interval.start.nil? || interval.end.nil?)
      render json: { errors: "invalid start or end" }, status: 500
      return
    end

    recurrence = 0
    if ti_params[:recurrence]
      recurrence = ti_params[:recurrence].to_i
      from_date = ti_params[:fromDate]&.to_date
      to_date = ti_params[:toDate]&.to_date
    end


    # on récupère la liste des salles
    if(ti_params[:activityRefId])
    room_id = RoomActivity.where(activity_ref_id: ti_params[:activityRefId]).pluck(:room_id)
    @rooms = Room.where(id: room_id)
    else
      @rooms = Room.order(label: :asc)
    end



    rooms_json = @rooms.as_json(
      except: [:created_at, :updated_at, :deleted_at,
               :authentication_token, :authentication_token_created_at, :first_connection, :is_creator] )
        
    # et on l'enrichit avec leur disponibilité
    i = 0
    @rooms.each do |room|

      # si c'est une vérification d'un créneau unique      
      if(recurrence==0)
        overlap = interval.overlap_room(room.id)

      # si c'est une vérification de tous les créneaux au cours de la saison
      else
        # on sécurise le from et le to
        from_date, to_date = interval.check_and_adjust_range(from_date, to_date).values

        # et on récupère, le cas échéant, le 1er intervalle en conflit
        overlap = interval.overlap_room_over_weeks(room.id, from_date, to_date).as_json(
                          except: [:created_at, :updated_at, :deleted_at])
      end

      rooms_json[i][:has_overlap] = overlap || false

      i = i+1
    end
        
    respond_to do |format|

      format.json do
          render json: rooms_json
          return
      end
    end
  end


  def show; end

  def destroy
    begin
      room = Room.find params[:id]
      unless room.nil?
        unless room.picture.nil?
          room.picture&.purge if room.picture&.attached?
        end
        room.destroy
      end
    rescue StandardError => e
      Rails.logger.logger.error "#{e}\n#{e.backtrace.join("\n")}"
    end

    redirect_to rooms_path
  end

  def new
    test = params
    @room = Room.new

    location = Location.find params[:location_id]

    @location_id = location.id
    @locations = Location.all.collect { |l| [l.label, l.id] }
    @all_features = RoomFeatures.where(active: true).collect { |f| [f.name, f.id] }
  end

  def create
    values = room_params

    values[:is_practice_room] = false if values[:is_practice_room].nil?

    values[:activity_refs] = params[:act_str].split "," if params[:act_str].is_a? String
    # On considère que les activity_ref sont une liste d'id. Peut importe le type (str, int etc...)
    values[:activity_refs] = values[:activity_refs].map { |id| ActivityRef.find id }

    values[:picture] = nil if values[:picture].is_a?(String)

    values[:image] = values[:picture].original_filename unless values[:picture].nil?

    @room = Room.new(values)

    if @room.save!
      if !params[:features].nil? && !params[:features].blank?
        features = params[:features].split(",") || [""]

        features.each do |nf|
          feature = RoomFeatures.find(nf.to_i)

          next if feature.nil?

          new_feature = RoomRoomFeature.new room: @room, room_features: feature
          new_feature.save!
        end
      end

      redirect_to rooms_url(location: @room.location_id)
    else
      render :new
    end
  end

  def edit
    @all_features = RoomFeatures.where(active: true).collect { |f| [f.name, f.id] }
    @locations = Location.all.collect { |l| [l.label, l.id] }

    @location_id = @room.location_id
    @selected_features = RoomRoomFeature.where(room_id: @room.id).collect(&:room_features_id)
  end

  def delete
  end

  def update
    room = Room.find(params[:id])

    values = room_params

    values[:activity_refs] = values[:activity_refs].split "," if values[:activity_refs].is_a? String

    # On considère que les activity_ref sont une liste d'id. Peut importe le type (str, int etc...)
    values[:activity_refs] = values[:activity_refs].map { |id| ActivityRef.find id }

    values[:is_practice_room] = false if values[:is_practice_room].nil?

    if params[:image_supp] == "true"
      values[:image] = nil
      room.picture.purge
    end

    values[:picture] = nil if values[:picture].is_a?(String)

    values[:image] = values[:picture].original_filename unless values[:picture].nil?

    if room.update(values)
      exist_features = RoomRoomFeature.where(room_id: room.id).all

      if !params[:features].nil? && !params[:features].blank?
        features = params[:features].split(",") || [""]

        exist_features&.each do |ef|
          if features.include? ef.room_features_id.to_s
            ef.updated_at = Time.now
            ef.save
            features.delete ef.room_features_id.to_s
          else
            ef.destroy
          end
        end

        features.each do |nf|
          feature = RoomFeatures.find(nf.to_i)

          next if feature.nil?

          new_feature = RoomRoomFeature.new room: room, room_features: feature
          new_feature.save!
        end
      else
        exist_features.destroy_all
      end

      redirect_to "#{rooms_path}?location=#{room.location_id}"
    else
      render edit
    end
  end

  def edit_activities
    room = Room.includes(:activity_refs).find(params[:id])
    authorize! :edit, room
    @room = room
    @activities = ActivityRef.all
  end

  def update_activities
    room = Room.find(params[:id])

    authorize! :edit, room
    room.activity_refs = ActivityRef.find(params[:activities])
    room.save

    redirect_to room
  end

  private

  def room_params
    params.require(:room).permit(:label, :kind, :floor, :activity_refs, :picture, :is_practice_room, :area, :location_id)
  end
end
