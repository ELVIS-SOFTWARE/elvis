class AddressesController < ApplicationController
  def search
    query = params[:query].downcase.strip
    user = User.find(params[:user_id])

    if !user.nil?
      matches = user
        .family
        .uniq
        .map{ |m| m.user_addresses }
        .flatten
        .select{ |ua| ua.address.street_address.downcase.match? /.*#{query}.*/ }
        .as_json(
          include: {
            address: {},
            user: {}
          }
        )
    end
    render :json => matches
  end

  def get
    address = Address.find(params[:id])
    render json: address
  end

  def update
    address = Address.find(params[:id])
    address.update(address_params)
    render json: address
  end

  def new
    render json: Address.create(address_params)
  end

  private
    def address_params
        params.require(:address).permit(:street_address, :postcode, :city, :department, :country);
    end
end
