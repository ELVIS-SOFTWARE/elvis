class OrganizationsController < ApplicationController
  before_action -> { @current_user = current_user }

  def create
    attr_organization = organization_params
    tax_id = nil
    if attr_organization[:organization_tax_id].present?
      tax_id = { type: 'eu_vat', value: attr_organization[:organization_tax_id] }
    end
    organization = Organization.new(name: attr_organization[:organization_name], reg_number: attr_organization[:organization_reg_number], tax_id: tax_id)

    if organization.valid?

      if organization.save
        render json: {}, status: 200 and return
      else
        Rails.logger.error "L'enregistrement en base a échoué (création d'une organisation)"
        render json: { message: "L'organisation n'a pas été créé." }, status: 500 and return
      end
    else
      Rails.logger.error "Les données ne sont pas valides (création d'une organisation)"
      render json: { message: "L'organisation n'a pas été créé." }, status: 500
    end
  end

  def update_from_user

    organisation_params = organization_params_update
    user = User.find(organisation_params[:user_id])
    organization = Organization.find(user.organization_id)

    organization.tax_id = { type: 'eu_vat', value: organisation_params[:organization_tax_id] }

    if organization.save
      render json: {}, status: 200 and return
    else
      Rails.logger.error "La mise à jour n'a pas été effectué (modifier une organization)"
      render json: { message: "Le numéro de TVA n'a pas été mise à jour" }, status: 500 and return
    end

  end

  private

  def organization_params
    params.require(:organization).permit(:organization_name, :organization_reg_number, :organization_tax_id)
  end

  def organization_params_update
    params.require(:organization).permit(:user_id, :organization_tax_id)
  end
end