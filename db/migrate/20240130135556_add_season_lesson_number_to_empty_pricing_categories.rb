class AddSeasonLessonNumberToEmptyPricingCategories < ActiveRecord::Migration[6.1]
  def change
    PricingCategory.where(number_lessons: nil, is_a_pack: false).update_all(number_lessons: Season.current&.nb_lessons)
  end
end
