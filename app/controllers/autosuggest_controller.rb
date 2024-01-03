class AutosuggestController < ApplicationController
    def cities
        cities = User.select(:city)
                     .map{|c| c.city}
                     .compact
                     .map{|c| c.titlecase}
                     .uniq
                     .map{|c| { name: c}}
        render :json => cities
    end
end
