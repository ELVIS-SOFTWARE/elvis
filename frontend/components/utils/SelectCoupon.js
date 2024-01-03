import React from "react";

export default function SelectCoupon({coupons, onChange, value, ...props}) {

    return <select
        className="form-control"
        value={value || 0}
        onChange={e => onChange(e.target.value)}
    >
        <option value="-1" disabled>
            Sélectionner une remise
        </option>
        <option value="0">
            (aucune)
        </option>
        {coupons.map(coupon => (
            <option key={coupon.id} value={coupon.id}>
                {coupon.percent_off} % ({coupon.label})
            </option>
        ))}
    </select>
}