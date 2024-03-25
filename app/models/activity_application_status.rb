# == Schema Information
#
# Table name: activity_application_statuses
#
#  id          :bigint           not null, primary key
#  label       :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  is_stopping :boolean          default(FALSE)
#  is_active   :boolean          default(TRUE)
#

class ActivityApplicationStatus < ApplicationRecord
    extend Elvis::ConstantLike

    validates :label, presence: true

    #########################################################
    # /!\ conserver ces identifiants                      /!\
    #########################################################
    TREATMENT_PENDING_ID = 1
    TREATMENT_IN_PROGRESS_ID = 2
    ACTIVITY_PENDING_ID = 7
    ACTIVITY_ATTRIBUTED_ID = 5
    STOPPED_ID = 9
    CANCELED_ID = 12
    TREATMENT_IMPOSSIBLE_ID = 13
    PROPOSAL_REFUSED_ID = 18
    PROPOSAL_ACCEPTED_ID = 17
    ASSESSMENT_PENDING_ID = 10
    ACTIVITY_PROPOSED_ID = 19

    BUILTIN_IDS = [TREATMENT_PENDING_ID, ACTIVITY_PENDING_ID, ACTIVITY_ATTRIBUTED_ID, STOPPED_ID, CANCELED_ID, TREATMENT_IMPOSSIBLE_ID, PROPOSAL_REFUSED_ID, PROPOSAL_ACCEPTED_ID, ASSESSMENT_PENDING_ID, ACTIVITY_PROPOSED_ID, TREATMENT_IN_PROGRESS_ID].freeze

    TREATMENT_PENDING = find_or_create_by!(id: TREATMENT_PENDING_ID, label: 'En attente de traitement', is_stopping: false, is_active: true)
    TREATMENT_IN_PROGRESS = find_or_create_by!(id: TREATMENT_IN_PROGRESS_ID, label: 'En cours de traitement', is_stopping: false, is_active: true)
    ACTIVITY_PENDING = find_or_create_by!(id: ACTIVITY_PENDING_ID, label: 'Cours en attente', is_stopping: false, is_active: true)
    ACTIVITY_ATTRIBUTED = find_or_create_by!(id: ACTIVITY_ATTRIBUTED_ID, label: 'Cours attribué', is_stopping: false, is_active: true)
    STOPPED = find_or_create_by!(id: STOPPED_ID, label: 'Arrêtée', is_stopping: true, is_active: true)
    CANCELED = find_or_create_by!(id: CANCELED_ID, label: 'Annulée', is_stopping: false, is_active: true)
    TREATMENT_IMPOSSIBLE = find_or_create_by!(id: TREATMENT_IMPOSSIBLE_ID, label: 'Demande non satisfaite', is_stopping: false, is_active: true)
    PROPOSAL_REFUSED = find_or_create_by!(id: PROPOSAL_REFUSED_ID, label: 'Proposition refusée', is_stopping: false, is_active: true)
    PROPOSAL_ACCEPTED = find_or_create_by!(id: PROPOSAL_ACCEPTED_ID, label: 'Proposition acceptée', is_stopping: false, is_active: true)
    ASSESSMENT_PENDING = find_or_create_by!(id: ASSESSMENT_PENDING_ID, label: 'Attente résultat évaluation', is_stopping: false, is_active: true)
    ACTIVITY_PROPOSED = find_or_create_by!(id: ACTIVITY_PROPOSED_ID, label: 'Cours proposé', is_stopping: false, is_active: true)

    BUILTINS = [TREATMENT_PENDING, ACTIVITY_PENDING, ACTIVITY_ATTRIBUTED, STOPPED, CANCELED, TREATMENT_IMPOSSIBLE, PROPOSAL_REFUSED, PROPOSAL_ACCEPTED, ASSESSMENT_PENDING, ACTIVITY_PROPOSED, TREATMENT_IN_PROGRESS].freeze

    # réinitialise la séquence de l'ID pour permettre de créer des prochains objets en base
    reset_pk_sequence


    def self.display_class_name(singular = true)
        singular ? "Statut d'inscription" : "Statuts d'inscription"
    end

    def self.class_name_gender
        return :M
    end
end
