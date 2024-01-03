# == Schema Information
#
# Table name: error_histories
#
#  id              :bigint           not null, primary key
#  message         :string
#  stack_trace     :jsonb            not null
#  related_objects :jsonb            not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  error_code_id   :bigint           not null
#
class ErrorHistory < ActiveRecord::Base

  belongs_to :error_code

end
