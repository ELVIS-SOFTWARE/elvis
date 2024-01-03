class SwitchSeasonJob < ApplicationJob
  def perform(params)
    new_season = Season.find( params.is_a?(Array) ? params[0] : params)

    ################################################################## 
    # code refactorisé ci-dessous 
    #                       vvvv
    ################################################################## 

    # fmus = []

    # FamilyMemberUser.where(season: new_season.previous).each do |fmu|

    #   fmus << {
    #     user_id: fmu.user_id,
    #     member_id: fmu.member_id,
    #     link: fmu.link,
    #     is_accompanying: fmu.is_accompanying,
    #     is_paying_for: fmu.is_paying_for,
    #     is_legal_referent: fmu.is_legal_referent,
    #     is_to_call: fmu.is_to_call,
    #     season_id: new_season.id,
    #     created_at: DateTime.now,
    #     updated_at: DateTime.now
    #   }
    # end

    # tmp = fmus.uniq{ |e| e[:season_id].to_s + e[:member_id].to_s + e[:user_id].to_s }

    # FamilyMemberUser.insert_all tmp, unique_by: %i[user_id member_id season_id] if tmp.any?


    ################################################################## 
    # le code ci-dessous est une refacto en SQL du code ci-dessus pour optimiser les perf
    ################################################################## 

    # on duplique pour la nouvelle saison les liens familiaux de la saison précédente
    # seulement s'ils n'existent pas déjà pour la nouvelle saison (ça évite d'écraser des liens familiaux déclarés récemment)
    ActiveRecord::Base.connection.exec_query(

        "INSERT INTO public.family_member_users (user_id, member_id, link, is_accompanying, is_paying_for, is_legal_referent, is_to_call, season_id, created_at, updated_at,  deleted_at)
        SELECT user_id, member_id, link, is_accompanying, is_paying_for, is_legal_referent, is_to_call, $2, NOW(), NOW(), NULL
        FROM public.family_member_users AS fmu1
        WHERE season_id = $1 and deleted_at IS NULL
        AND NOT EXISTS(
          SELECT 1 from public.family_member_users AS fmu2
          WHERE fmu2.user_id = fmu1.user_id AND fmu2.member_id = fmu1.member_id 
          AND fmu2.season_id = $2 AND fmu2.deleted_at IS NULL
        );",  

        "raw SQL", [
            [nil, new_season.previous.id],
            [nil, new_season.id],
          ]
    )





  end
end
