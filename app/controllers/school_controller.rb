class SchoolController < ApplicationController

  def get_zone_by_address
    address = params[:address]
    postal_code = params[:postal_code]
    city = params[:city]
    country_code = params[:countryCode]

    return render json: { zone: nil, academy: nil } if country_code != 'FR'

    full_address = "#{address} #{postal_code} #{city}"

    location = Holidays::SchoolHolidays.fetch_location_for_address(full_address)

    return render json: { zone: nil, academy: nil } if location.nil?

    academy = Holidays::SchoolHolidays.fetch_academie_from_location(location)

    return render json: { zone: nil, academy: nil } if academy.nil?

    zone = Holidays::SchoolHolidays.new(DateTime.now.year, academy).fetch_school_zone

    render json: { zone: zone, academy: academy }
  end

end
