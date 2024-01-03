# == Schema Information
#
# Table name: activity_refs
#
#  id                        :bigint           not null, primary key
#  label                     :string           not null
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  image                     :string
#  occupation_limit          :integer
#  occupation_hard_limit     :integer
#  monthly_price             :integer
#  quarterly_price           :integer
#  annual_price              :integer
#  special_price             :integer
#  has_additional_student    :boolean          default(FALSE)
#  is_lesson                 :boolean          default(TRUE)
#  is_visible_to_admin       :boolean          default(FALSE)
#  deleted_at                :datetime
#  from_age                  :integer          not null
#  to_age                    :integer          not null
#  is_evaluable              :boolean          default(FALSE)
#  is_unpopular              :boolean          default(FALSE)
#  is_work_group             :boolean          default(FALSE)
#  activity_ref_kind_id      :bigint           not null
#  activity_type             :integer
#  allows_timeslot_selection :boolean          default(FALSE)
#  nb_lessons                :integer
#

class ActivityRefSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  attributes :id, :label, :kind, :occupation_limit
end
