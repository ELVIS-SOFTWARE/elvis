# frozen_string_literal: true

class DiscountController < ApplicationController
  def upsert
    discount = Discount.find_or_initialize_by(
      discountable_type: discount_params[:discountable_type],
      discountable_id: discount_params[:discountable_id]
    )

    respond_to do |format|
      format.json do
        if discount.update({ coupon_id: discount_params[:coupon_id] })
          render status: :ok, json: {}
        else
          render status: :unprocessable_entity, json: { errors: discount.errors.full_messages }
        end
      end
    end
  end

  def destroy
    if(params[:id])
      discount = Discount.find(params[:id])
    else
      discount = Discount.find_by(
        discountable_type: discount_params[:discountable_type],
        discountable_id: discount_params[:discountable_id]
      )
    end

    res = discount.destroy

    respond_to do |format|
      format.json do
        render status: :ok, json:{} and return if res
        render status: :unprocessable_entity, json: { errors: discount.errors.full_messages }
      end
    end
  end

  private

  def discount_params
    params.require(:discount).permit(:coupon_id, :discountable_type, :discountable_id)
  end
end
