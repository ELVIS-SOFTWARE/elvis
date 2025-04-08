import React, {Fragment} from "react";

import swal from "sweetalert2";
import _ from "lodash";

import {toast} from "react-toastify";

import PaymentsSummary from "./PaymentsSummary";
import DuePaymentsList from "./DuePaymentsList";
import PaymentsList from "./PaymentsList";
import CommentSection from "./../CommentSection";

import {indexById, csrfToken, findAndGet} from "../utils/";
import SwitchPayerModal from "./SwitchPayerModal";
import {set} from "../../tools/api";
import * as api from "../../tools/api";

const SEASON_STORED_KEY = "PaymentsSummarySelectedSeason";

function calculateTotals(duePayments, payments, itemsForPayment) {
    const totalDue = _.reduce(
        _.filter(itemsForPayment, item => !item.isFormulaItem),
        (sum, item) => sum + (item.discountedTotal || 0),
        0.0
    );

    const previsionalTotal = _.chain(duePayments)
        .values()
        .flatten()
        .map(dp => parseFloat(dp.adjusted_amount))
        .reduce((sum, n) => (sum + n), 0)
        .value();

    const totalPayments = _.chain(payments)
        .values()
        .flatten()
        .map(p => parseFloat(p.adjusted_amount))
        .reduce((sum, n) => (sum + n), 0)
        .value();

    const totalPayback = _.chain(payments)
        .values()
        .flatten()
        .map(p => parseFloat(p.adjusted_amount))
        .compact()
        .reduce((sum, n) => (sum + n), 0)
        .value();

    const totalPaymentsToDay = _.chain(payments)
        .values()
        .flatten()
        .filter(
            p =>
                !p.payment_status_id && Date.parse(p.cashing_date) <= Date.now()
        )
        .map(p => parseFloat(p.adjusted_amount))
        .reduce((sum, n) => (sum + n), 0)
        .value();

    return {
        totalDue,
        totalPayback,
        totalPayments,
        previsionalTotal,
        totalPaymentsToDay,
    };
}

function roundCurrency(value, digits = 2) {
    return Number(value.toFixed(digits));
}

function getDiscountedAmount(amount, percentOff) {
    const res = (amount || 0) * (1 - percentOff / 100);
    return roundCurrency(res);
}

function generateDataForPaymentSummaryTable({
                                                activities,
                                                desired,
                                                options,
                                                seasonId,
                                                seasons,
                                                adhesions,
                                                adhesionPrices,
                                                adhesionEnabled,
                                                packs,
                                                user,
                                                formulas = []
                                            }) {
    let data = [];

    const formulaActivities = {};
    const nonFormulaActivities = [];
    const seasonActivities = activities.filter(a =>
        desired.find(d => d.activity_id === a.activity.id)
    );

    seasonActivities.forEach(act => {
        const a = act.activity;
        const des = desired.find(
            d =>
                d.activity_id === act.activity_id &&
                d.activity_application.user_id === act.user_id
        );

        if (des) {
            const formulaId = des.activity_application.formule_id;
            if (formulaId) {
                if (!formulaActivities[formulaId]) {
                    formulaActivities[formulaId] = [];
                }
                formulaActivities[formulaId].push({ act, des, activity: a });
            } else {
                nonFormulaActivities.push({ act, des, activity: a });
            }
        }
    });

    nonFormulaActivities.forEach(({ act, des, activity: a }) => {
        const activityNbLessons = a.intended_nb_lessons;
        const season = seasons.find(s => s.id === seasonId);
        const priceAssociations = [];
        a.activity_ref.activity_ref_pricing.forEach(arp => {
            if (
                new Date(arp.from_season.start) <= new Date(season.start) &&
                (!arp.to_season || new Date(arp.to_season.end) >= new Date(season.end))
            ) {
                priceAssociations.push(arp);
            }
        });
        const priceAssociation = priceAssociations.find(
            pa => pa.pricing_category_id === des.pricing_category_id
        );
        let amount = 0;
        if (priceAssociation && priceAssociation.price) {
            amount = _.round(
                (priceAssociation.price / activityNbLessons) *
                (des.prorata || activityNbLessons),
                2
            );
        }
        const coupon = _.get(des, "discount.coupon", 0);
        const percentOff = _.get(des, "discount.coupon.percent_off", 0);
        data.push({
            id: des.id,
            activity: `${a.activity_ref.label} (${a.activity_ref.kind})`,
            stopped_at: des.activity_application.stopped_at,
            intended_nb_lessons: a.intended_nb_lessons,
            des,
            ref: a.activity_ref,
            prorata: des.prorata,
            coupon: { ...coupon },
            studentId: act.id,
            user: act.user,
            pricingCategoryId: des.pricing_category_id,
            activityId: a.id,
            paymentLocation: act.payment_location,
            due_total: amount || 0,
            discountedTotal: getDiscountedAmount(amount, percentOff),
            unitPrice:
                priceAssociation && priceAssociation.price
                    ? _.round(priceAssociation.price / activityNbLessons, 2)
                    : 0,
            formula: null,
            isFormula: false
        });
    });

    _.forEach(formulaActivities, (activitiesArray, formulaId) => {
        const formula = _.find(formulas, f => String(f.id) === String(formulaId));

        const user = activitiesArray[0].act.user;
        const formulaPricing = formula.formule_pricings && formula.formule_pricings[0];
        const formulaPrice = formulaPricing ? formulaPricing.price : 0;

        const coupon = _.get(formula, "discount.coupon", {});
        const percentOff = _.get(formula, "discount.coupon.percent_off", 0);
        const discountedFormulaPrice = getDiscountedAmount(formulaPrice, percentOff);

        data.push({
            id: `formula-${formula.id}`,
            activity: `${formula.name}`,
            subActivities: activitiesArray.map(
                ({ activity: a }) => `${a.activity_ref.label} (${a.activity_ref.kind})`
            ),
            frequency: 1,
            initial_total: formulaPrice,
            due_total: formulaPrice,
            coupon: coupon,
            discountedTotal: discountedFormulaPrice,
            unitPrice: formulaPrice,
            user: user,
            studentId: user.id,
            formulaId: formula.id,
            formula_activities: activitiesArray.map(item => item.des["id"]),
            isFormula: true,
            formula: formula
        });
    });


    if (options && options.length > 0) {
        const taken = seasonActivities.map(act => act.activity.id);
        const takenDesired = data
            .filter(d => !d.isFormula)
            .map(d => d.id)
            .filter(id => typeof id === 'number');

        options.forEach(option => {
            if (taken.includes(option.activity.id)) return;

            const a = option.activity;
            const des = desired.find(d => d.id === option.desired_activity_id);

            if (!des || takenDesired.includes(des.id)) return;

            takenDesired.push(des.id);

            const activity_nb_lessons = a.intended_nb_lessons;
            const season = seasons.find(s => s.id === seasonId);
            const priceAssociations = [];

            a.activity_ref.activity_ref_pricing.forEach(arp => {
                if (new Date(arp.from_season.start) <= new Date(season.start) &&
                    (!arp.to_season || new Date(arp.to_season.end) >= new Date(season.end))) {
                    priceAssociations.push(arp);
                }
            });

            const priceAssociation = priceAssociations.find(pa => pa.pricing_category_id === des.pricing_category_id);

            let amount = 0;
            if (priceAssociation && priceAssociation.price) {
                amount = _.round((priceAssociation.price / activity_nb_lessons) * (des.prorata || activity_nb_lessons), 2);
            }

            const coupon = _.get(des, "discount.coupon", 0);
            const percentOff = _.get(des, "discount.coupon.percent_off", 0);

            data.push({
                id: des.id,
                activity: `${a.activity_ref.label} (${a.activity_ref.kind})`,
                intended_nb_lessons: a.intended_nb_lessons,
                des,
                ref: a.activity_ref,
                prorata: des.prorata,
                coupon: coupon,
                studentId: option.id,
                user: option.desired_activity.activity_application.user,
                pricingCategoryId: des.pricing_category_id,
                paymentLocation: option.payment_location,
                due_total: amount || 0,
                discountedTotal: getDiscountedAmount(amount, percentOff),
                isOption: true,
                unitPrice: priceAssociation && priceAssociation.price ? _.round((priceAssociation.price / activity_nb_lessons), 2) : 0
            });
        });
    }

    if (adhesionEnabled && adhesions && adhesions.length > 0) {
        adhesions.forEach(adhesion => {
            const adhesionPrice = adhesionPrices.find(p => p.id === adhesion.adhesion_price_id) || {};

            if (adhesionPrice) {
                const coupon = _.get(adhesion, "discount.coupon", 0);
                const percentOff = _.get(adhesion, "discount.coupon.percent_off", 0);

                data.push({
                    id: 0,
                    activity: `Adhésion de ${adhesion.user.first_name} ${adhesion.user.last_name}`,
                    frequency: 1,
                    initial_total: 1,
                    due_total: adhesionPrice.price || 0,
                    coupon: coupon,
                    discountedTotal: getDiscountedAmount(adhesionPrice.price, percentOff),
                    unitPrice: adhesionPrice.price || 0,
                    user: adhesion.user,
                    studentId: adhesion.user.id,
                    adhesionPriceId: adhesionPrice.id,
                    adhesionId: adhesion.id
                });
            }
        });
    }

    if (packs && packs.length > 0) {
        const userPacks = packs.filter(p => p);

        if (userPacks.length > 0) {
            userPacks.forEach(pack => {
                const pack_price = pack.activity_ref_pricing.price;
                const coupon = _.get(pack, "discount.coupon", 0);
                const percentOff = _.get(pack, "discount.coupon.percent_off", 0);

                data.push({
                    id: 0,
                    activity: `Pack de ${user.first_name} ${user.last_name} pour ${pack.activity_ref.label} (${pack.activity_ref.kind})`,
                    frequency: 1,
                    initial_total: 1,
                    due_total: pack_price || 0,
                    coupon: coupon,
                    discountedTotal: getDiscountedAmount(pack_price || 0, percentOff),
                    unitPrice: pack_price || 0,
                    user: user,
                    studentId: user.id,
                    packPrice: pack.activity_ref_pricing,
                    packId: pack.id
                });
            });
        }
    }

    return data;
}


class PaymentsManagement extends React.Component {
    constructor(props) {
        super(props);

        const season =
            parseInt(localStorage.getItem(SEASON_STORED_KEY)) ||
            this.props.currentSeason.id;

        this.state = {
            activities: this.props.activities,
            options: this.props.options,
            adhesion_payment_method: 0,
            schedule: this.props.schedule,
            schedulesBySeason: this.props.schedules,
            paymentsBySeason: this.props.payments,
            payersBySeason: this.props.payers,
            season,
            adhesions: this.props.adhesions,
            newComment: "",
            editedComment: null,
            formulas: this.props.formulas || [],
        };

        this.state = {
            ...this.state,
            ...this.getSeasonDependentState(season),
        };

        const status = this.getStatus(
            this.state.schedules,
            this.props.schedule_statuses
        );

        this.state = {
            ...this.state,
            scheduleStatus: status,
            schedule_status_id: status ? status.id : null,
        };
    }

    getStatus(schedules, statuses) {
        const schedule = _.chain(schedules)
            .values()
            .head()
            .value();

        if (schedule) {
            return _.find(
                statuses,
                s => s.id == schedule.payment_schedule_status_id
            );
        } else {
            return null;
        }
    }

    /**
     * Returns an object containing all season related data, to merge
     * with a superstate.
     * @param {*} seasonId the id of the season for which we request the data.
     */
    getSeasonDependentState(seasonId) {
        const payments = this.state.paymentsBySeason[seasonId] || {};
        const desiredActivities = this.props.desiredActivities[seasonId] || [];
        const adhesions = this.props.adhesions.filter(adh => adh.season_id == seasonId);
        const schedules = this.state.schedulesBySeason[seasonId] || {};
        const payers =
            findAndGet(
                this.state.payersBySeason,
                ps => parseInt(ps.season_id) === seasonId,
                "payers"
            ) || {};

        const duePayments = _.reduce(
            schedules,
            (acc, s) => ({...acc, [s.payable_id]: s.due_payments}),
            {}
        );

        const comments = _.chain(schedules)
            .values()
            .map(s => s.comments)
            .flatten()
            .value();

        const contextId = _.chain(schedules)
            .values()
            .map(s => s.id)
            .head()
            .value();

        return {
            payments,
            duePayments,
            schedules,
            desiredActivities,
            adhesions,
            payers,
            comments,
            contextId,
        };
    }

    handleCreateNewPayment(payment) {
        if (payment.id != undefined) {
            fetch(`/payments/${payment.id}`, {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    payment: {
                        ...payment,
                        payer: this.props.payer,
                    },
                }),
            })
                .then(response => response.json())
                .then(payment => {
                    let payments = this.state.payments[payment.payable_id];

                    const index = _.findIndex(
                        payments,
                        p => p.id == payment.id
                    );
                    payments.splice(index, 1, payment);

                    this.setState(
                        {
                            payments: {
                                ...this.state.payments,
                                [payment.payable_id]: payments,
                            },
                        },
                        () => window.location.reload()
                    );
                });
        } else {
            fetch("/payments", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    payment,
                }),
            })
                .then(response => response.json())
                .then(newPayment => {
                    const duePayments = {...this.state.duePayments};

                    if (newPayment.due_payment)
                        duePayments[newPayment.payable_id] = Object.values({
                            ...indexById(duePayments[newPayment.payable_id]),
                            [newPayment.due_payment_id]: newPayment.due_payment,
                        });

                    this.setState({
                        payments: {
                            ...this.state.payments,
                            [newPayment.payable_id]:
                                this.state.payments[newPayment.payable_id] ==
                                undefined
                                    ? [newPayment]
                                    : [
                                        ...this.state.payments[
                                            newPayment.payable_id
                                            ],
                                        newPayment,
                                    ],
                        },
                        duePayments,
                    });
                });
        }
    }

    handleCreatePaymentSchedule(schedule) {
        const targetSchedule =
            this.props.schedules[this.state.season] &&
            this.props.schedules[this.state.season][schedule.payer.id];

        schedule.season_id = this.state.season;

        fetch("/payments/schedule", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                schedule,
                schedule_id: targetSchedule ? targetSchedule.id : null,
            }),
        })
            .then(response => response.json())
            .then(schedule => {
                let payableId = schedule.payable_id;

                this.setState({
                    duePayments: {
                        ...this.state.duePayments,
                        [payableId]: schedule.due_payments,
                    },
                    schedules: {
                        ...this.state.schedules,
                        [payableId]: schedule,
                    },
                    contextId: schedule.id,
                });
            });
    }

    handleChangePricingChoice(desId, userId, evt) {
        const pricing = this.props.pricingCategories.find(p => p.id == evt.target.value);

        let dess = {...this.state.desiredActivities};
        let des = _.find(
            dess,
            i => i.activity_application.user_id === userId && i.id == desId
        );

        if (pricing && des) {
            dess = _.filter(dess, i => i.id != des.id);

            des.pricing_category_id = pricing.id;

            dess = [...dess, des];

            fetch(`/desired_activities/${desId}/pricing`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pricing_category_id: pricing.id,
                }),
            }).then(() => {
                this.setState({desiredActivities: dess});
            });
        }
    }

    handleChangeAdhesionPricingChoice(adhesionId, newAdhesionPricingId) {
        api.set()
            .success(() => {
                const adhesion = this.state.adhesions.find(adhesion => adhesion.id === adhesionId);
                adhesion.adhesion_price_id = parseInt(newAdhesionPricingId, 10);
                this.setState({activities: [...this.state.activities]});
            })
            .error((e) => {
                console.error(e)
                swal("Erreur", "Une erreur est survenue", "error");
            })
            .post(`/adhesions/${adhesionId}/update_adhesion_pricing?adhesion_price_id=${newAdhesionPricingId}`, {});
    }

    setStateWithCoupon(discountable_id, discountable_type, coupon) {
        let oldCoupon = null;

        switch (discountable_type) {
            case "Adhesion":
                const adhesions = [...this.state.adhesions];
                const index = this.state.adhesions.findIndex(
                    adh => adh.id === discountable_id
                );
                if (index === -1) return null;
                oldCoupon = _.get(adhesions[index], "discount.coupon", null);

                const adhesion = {
                    ...adhesions[index],
                    discount: {coupon: {...coupon}}
                };

                adhesions[index] = adhesion;
                this.setState({adhesions});
                break;

            case "DesiredActivity":
                let dess = [...this.state.desiredActivities];
                const des = this.state.desiredActivities.find(
                    i => i.id === discountable_id
                );
                if (!des) return null;
                oldCoupon = _.get(des, "discount.coupon", null);

                des.discount = {coupon: {...coupon}};
                dess = [...dess, des];
                this.setState({desiredActivities: dess});
                break;

                case "Formula":
                let formulas = [...this.state.formulas];
                const formulaIndex = formulas.findIndex(f => f.id === discountable_id);
                if (formulaIndex === -1) return null;
                oldCoupon = _.get(formulas[formulaIndex], "discount.coupon", null);

                const updatedCoupon = coupon ? { ...coupon } : {};
                if (coupon && !updatedCoupon.id) {
                    updatedCoupon.id = coupon.id || coupon.coupon_id || coupon.label;
                }

                formulas[formulaIndex] = {
                    ...formulas[formulaIndex],
                    discount: { coupon: updatedCoupon },
                    discount_percent: coupon ? coupon.percent_off : 0
                };

                this.setState({ formulas });
                break;        }

        return oldCoupon;
    }
    handleChangePercentOffChoice(discountable_id, discountable_type, couponId) {
        const coupon = _.find(this.props.coupons, c => c.id == couponId);

        const oldCoupon = this.setStateWithCoupon(discountable_id, discountable_type, coupon);


        const fetcher = api.set()
            .error((e) => {
                console.error(e);
                this.setStateWithCoupon(discountable_id, discountable_type, oldCoupon);
                swal("Erreur", "Une erreur est survenue", "error");
            });

        if (parseInt(couponId) === 0) {
            fetcher.del(`/discounts`, {
                discountable_id: discountable_id,
                discountable_type: discountable_type === "Formula" ? "Formule" : discountable_type
            });
        } else {
            fetcher.post(`/discounts/upsert`, {
                discountable_id: discountable_id,
                discountable_type: discountable_type === "Formula" ? "Formule" : discountable_type,
                coupon_id: couponId
            });
        }

    }

    handleChangeActivityPaymentMethod(id, evt) {
        const method = parseInt(evt.target.value, 10);
        let items = {...this.state.activities};

        if (id != 0) {
            let item = _.find(items, i => i.id == id);
            items = _.filter(items, i => i.id != item.id);

            item.payment_method_id = method;

            items = [...items, item];
        }

        fetch("/payments/method", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                user_id: this.props.adhesion.user_id,
                activity: id,
                payment_method_id: method,
            }),
        }).then(() => {
            if (id == 0) {
                this.setState({adhesion_payment_method: method});
            } else {
                this.setState({activities: items});
            }
        });
    }

    handleSaveNewDuePayment(duePayment) {
        const schedule = this.state.schedules[duePayment.payer.id];

        fetch(`/due_payments`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                season_id: this.state.season,
                due_payment: {
                    ...duePayment,
                    payment_schedule_id: schedule ? schedule.id : 0,
                },
            }),
        })
            .then(response => response.json())
            .then(schedule => {
                // let duePayments = this.state.duePayments;
                // duePayments[duePayment.payer.id].push(newDue);

                // this.setState({ duePayments });

                let payableId = schedule.payable_id;

                this.setState({
                    duePayments: {
                        ...this.state.duePayments,
                        [payableId]: schedule.due_payments,
                    },
                    schedules: {
                        ...this.state.schedules,
                        [payableId]: schedule,
                    },
                });
            });
    }

    handleSetToSwitchPayerId(toSwitchPayerId) {
        this.setState({
            toSwitchPayerId,
        });
    }

    handleSwitchPayer(newPayerId) {
        const {toSwitchPayerId: payerId} = this.state;

        const scheduleId = _.get(this.state.schedules[payerId], "id");

        set()
            .error(toast.error)
            .success(() => {
                window.location.reload();
            })
            .post(
                `/payment_schedules/${scheduleId}/change_owner/${newPayerId}`
            );
    }

    handleSaveDuePayment(duePayment, payerId) {
        fetch(`/due_payments/${duePayment.id}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                due_payment: duePayment,
            }),
        })
            .then(response => response.json())
            .then(duePayment => {
                let duePayments = this.state.duePayments[payerId];

                const index = _.findIndex(
                    duePayments,
                    dp => dp.id == duePayment.id
                );
                duePayments.splice(index, 1, duePayment);

                this.setState({
                    duePayments: {
                        ...this.state.duePayments,
                        [payerId]: duePayments,
                    },
                });
            });
    }

    handleDeletePayment(id, payerId) {
        fetch(`/payments/${id}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(res => res.json())
            .then(duePayment => {
                let newPayments = {...this.state.payments};
                newPayments[payerId] = _.filter(
                    newPayments[payerId],
                    p => p.id != id
                );

                let duePayments = [...this.state.duePayments[payerId]];

                if (duePayment) {
                    const index = _.findIndex(
                        duePayments,
                        dp => dp.id == duePayment.id
                    );

                    duePayments.splice(index, 1, duePayment);
                }

                this.setState({
                    duePayments: {
                        ...this.state.duePayments,
                        [payerId]: duePayments,
                    },
                    payments: newPayments,
                });
            });
    }

    handleCreatePayments(payerId, targets) {
        if (targets.length === 0) return;

        fetch(
            `/schedule/${this.state.schedules[payerId].id}/generate_payments`,
            {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({targets}),
            }
        )
            .then(response => response.json())
            .then(dues => {
                const newDuePayments = {
                    ...this.state.duePayments,
                    [payerId]: Object.values({
                        ...indexById(this.state.duePayments[payerId]),
                        ...indexById(dues),
                    }),
                };

                const newPayments = {
                    ...this.state.payments,
                    [payerId]: Object.values({
                        ...indexById(this.state.payments[payerId]),
                        ...indexById(
                            _(dues)
                                .map(d => d.payments)
                                .flatten()
                                .value()
                        ),
                    }),
                };

                this.setState({
                    payments: newPayments,
                    duePayments: newDuePayments,
                });
            });
    }

    handleDeleteDuePayment(id, payerId) {
        fetch(`/due_payment/${id}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        }).then(() => {
            let newDuePayments = {...this.state.duePayments};
            newDuePayments[payerId] = _.filter(
                newDuePayments[payerId],
                dp => dp.id != id
            );

            let newPayments = {...this.state.payments};
            newPayments[payerId] = _.filter(
                newPayments[payerId],
                p => p.due_payment_id != id
            );

            this.setState({
                duePayments: newDuePayments,
                payments: newPayments,
            });
        });
    }

    handleSwitchLocation(scheduleId, locationId) {
        let schedules =
            scheduleId || Object.values(this.state.schedules).map(v => v.id);

        fetch(`/payment_schedules/location`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                schedulesIds: schedules,
                locationId: locationId,
            }),
        }).then(res => {
            if (res.ok) {
                const oldSchedules = this.state.schedules;
                const newSchedules = {};

                Object.keys(oldSchedules).forEach(
                    k =>
                        (newSchedules[k] = {
                            ...oldSchedules[k],
                            location_id: locationId,
                        })
                );

                toast.success("Changement de location sauvegardé", {
                    position: toast.POSITION.BOTTOM_CENTER,
                    autoClose: 3000,
                });
                this.setState({
                    schedules: newSchedules,
                });
            }
        });
    }

    /**
     * Changes the current season and saves current season's frontend data to
     * season related data in the state.
     * @param {*} e select onchange event.
     */
    handleChangeSeason(e) {
        const newSeason = parseInt(e.target.value);

        localStorage.setItem(SEASON_STORED_KEY, newSeason);

        //Transfer current state data for this season to the season stores
        //for due payments
        let newSchedulesBySeason = {...this.state.schedulesBySeason};

        newSchedulesBySeason[this.state.season] = this.state.schedules;

        Object.entries(this.state.duePayments).forEach(([key, val]) => {
            newSchedulesBySeason[this.state.season][key].due_payments = val;
        });

        //for payments
        const newPaymentsBySeason = {...this.state.paymentsBySeason};

        Object.entries(this.state.payments).forEach(([key, val]) => {
            newPaymentsBySeason[this.state.season][key] = val;
        });

        //for comments
        const commentsGroupedByContextId = this.state.comments.reduce(
            (acc, c) => ({
                ...acc,
                [c.commentable_id]: [...(acc[c.commentable_id] || []), c],
            }),
            {}
        );

        for (const [scheduleId, comments] of Object.entries(
            commentsGroupedByContextId
        )) {
            if (scheduleId) {
                const schedule = Object.values(
                    newSchedulesBySeason[this.state.season]
                ).find(s => s.id == scheduleId);

                if (schedule) schedule.comments = comments;
            }
        }

        let newState = {
            schedulesBySeason: newSchedulesBySeason,
            paymentsBySeason: newPaymentsBySeason,
            season: newSeason,
            ...this.getSeasonDependentState(newSeason),
        };
        const status = this.getStatus(
            newState.schedules,
            this.props.schedule_statuses
        );
        if (status) {
            newState = {
                ...newState,
                scheduleStatus: status,
                schedule_status_id: status.id,
            };
        }

        this.setState(newState);
    }

    handleBulkDeleteDuePayments(payerId, dues) {
        fetch("/due_payments/bulkdelete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                targets: dues,
            }),
        }).then(res => {
            if (res.ok) {
                //updates data to mimic reproduce backend's delete operation
                const newDuePayments = {...this.state.duePayments};
                const newPayments = {...this.state.payments};

                newDuePayments[payerId] = newDuePayments[payerId].filter(
                    d => !dues.includes(d.id)
                );

                newPayments[payerId] = newPayments[payerId].filter(
                    d => !dues.includes(d.due_payment_id)
                );

                this.setState({
                    duePayments: newDuePayments,
                    payments: newPayments,
                });
            }
        });
    }

    handleBulkDeletePayments(payerId, targets) {
        fetch("/payments/bulkdelete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                targets,
            }),
        })
            .then(res => res.json())
            .then(dues => {
                //updates data to mimic reproduce backend's delete operation
                const newPayments = {...this.state.payments};

                newPayments[payerId] = newPayments[payerId].filter(
                    p => !targets.includes(p.id)
                );

                const newDuePayments = {
                    ...this.state.duePayments,
                    [payerId]: Object.values({
                        ...indexById(this.state.duePayments[payerId]),
                        ...indexById(dues),
                    }),
                };

                this.setState({
                    payments: newPayments,
                    duePayments: newDuePayments,
                });
            });
    }

    handleBulkEditDuePayments(payerId, targets, edit) {
        const body = {
            targets,
            due_payment: {
                ...edit,
            },
        };

        fetch("/due_payments/bulkedit/user", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then(res => res.json())
            .then(dues => {
                let newPayerDuePayments = [...this.state.duePayments[payerId]];
                newPayerDuePayments = _.map(newPayerDuePayments, due => {
                    const newDue = _.find(dues, d => d.id === due.id);

                    if (newDue) {
                        return newDue;
                    }

                    return due;
                });

                const newPayerPayments = [...this.state.payments[payerId]].map(
                    pay => {
                        const newDue = dues.find(
                            d => d.id === pay.due_payment_id
                        );

                        if (newDue) {
                            const newPay = newDue.payments.find(
                                p => p.id === pay.id
                            );

                            //this should always be true
                            //but we ain't never be too sure
                            if (newPay) return newPay;
                        }

                        return pay;
                    }
                );

                this.setState({
                    duePayments: {
                        ...this.state.duePayments,
                        [payerId]: newPayerDuePayments,
                    },
                    payments: {
                        ...this.state.payments,
                        [payerId]: newPayerPayments,
                    },
                });
            });
    }

    handleBulkEditPayments(payerId, targets, edit) {
        const body = {
            targets,
            ...edit,
        };

        fetch("/payments/bulkedit", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then(res => res.json())
            .then(pays => {
                const newPayerPayments = [...this.state.payments[payerId]].map(
                    pay => {
                        const newPay = pays.find(p => p.id === pay.id);

                        if (newPay) return newPay;

                        return pay;
                    }
                );

                const newDuePayments = {
                    ...this.state.duePayments,
                    [payerId]: Object.values({
                        ...indexById(this.state.duePayments[payerId]),
                        ...indexById(_.compact(pays.map(p => p.due_payment))),
                    }),
                };

                this.setState({
                    duePayments: newDuePayments,
                    payments: {
                        ...this.state.payments,
                        [payerId]: newPayerPayments,
                    },
                });
            });
    }

    handleChangeStatus(e) {
        this.setState({schedule_status_id: e.target.value});
    }

    handleSaveStatus() {
        const scheduleActions = _.map(_.values(this.state.schedules), s => {
            fetch(`/payment_schedule/${s.id}`, {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    schedule_status_id: this.state.schedule_status_id,
                }),
            });
        });

        // const schedules = this.state.schedulesBySeason[seasonId] || {};

        Promise.all(scheduleActions).then(() => {
            const newStatus = _.find(
                this.props.schedule_statuses,
                ss => ss.id == this.state.schedule_status_id
            );
            this.setState({scheduleStatus: newStatus});
        });
    }

    // COMMENT HANDLERS
    handleCommentEdition(comment_id) {
        const comment = _.find(this.state.comments, c => c.id == comment_id);
        this.setState({editedComment: comment});
    }

    handleUpdateNewCommentContent(e) {
        this.setState({newComment: e.target.value});
    }

    handleUpdateEditedCommentContent(e) {
        this.setState({
            editedComment: {
                ...this.state.editedComment,
                content: e.target.value,
            },
        });
    }

    handleSaveComment() {
        fetch("/comments", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                pragma: "no-cache",
                Accept: "application/json",
            },
            body: JSON.stringify({
                comment: {
                    commentable_id: this.state.contextId,
                    commentable_type: "PaymentSchedule",
                    user_id: this.props.user_id,
                    content: this.state.newComment,
                },
            }),
        })
            .then(response => response.json())
            .then(comments => {
                this.setState({comments, newComment: ""});
            });
    }

    handleSaveCommentEdition() {
        fetch(`/comments/${this.state.editedComment.id}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                pragma: "no-cache",
                Accept: "application/json",
            },
            body: JSON.stringify({
                comment: this.state.editedComment,
            }),
        })
            .then(response => response.json())
            .then(comments => {
                this.setState({comments, editedComment: null});
            });
    }

    handlePromptPaymentStatusEdit(payer, paymentId, newStatusId) {
        swal({
            title: "Édition du statut",
            type: "warning",
            confirmButtonText: "Valider",
            input: "select",
            inputOptions: _.zipObject(
                this.props.paymentStatuses.map(status => status.id),
                this.props.paymentStatuses.map(status => status.label)
            ),
            inputClass: "form-control",
            inputValue: newStatusId,
            showCancelButton: true,
            cancelButtonText: "Annuler",
        }).then(res => {
            const newStatusId = res.value;
            if (newStatusId) {
                fetch("/payments/edit_status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                    body: JSON.stringify({id: paymentId, status: res.value}),
                }).then(res => {
                    if (!res.ok) swal("Echec", "", "error");
                    else {
                        let payments = this.state.payments[payer.id];
                        const index = _.findIndex(
                            payments,
                            p => p.id == paymentId
                        );
                        payments[index].payment_status_id = newStatusId;

                        //this.setState({payments[payer.id]: payments});
                        this.setState({
                            payments: {
                                ...this.state.payments,
                                [payer.id]: payments
                            },
                        });
                    }
                });
            }
        });
    }

    sendUpcominPayment()
    {
        swal({
            type: "question",
            title: "Êtes-vous sûr ?",
            text: "Envoyer les paiements à venir par email ?",
            showCancelButton: true,
            confirmButtonText: "Envoyer",
            cancelButtonText: "Annuler",
        })
            .then((res) =>
            {
                if (res.value)
                {
                    swal.showLoading();

                    api.set()
                        .success(() =>
                        {
                            swal("Mail envoyé", "Le mail a bien été envoyé", "success");
                        })
                        .error((e) =>
                        {
                            console.error(e)

                            swal("Erreur", "Une erreur est survenue", "error");
                        })
                        .post("/payments/send_upcoming_payment_mail", {
                            season_id: this.state.season,
                            user_id: this.props.user.id
                        }, {});
                }
            });
    }

    render() {
        const itemsForPayment = generateDataForPaymentSummaryTable({
            activities: this.state.activities,
            desired: this.state.desiredActivities,
            options: this.state.options,
            seasonId: this.state.season,
            seasons: this.props.seasons,
            adhesionPrices: this.props.adhesionPrices,
            adhesionEnabled: this.props.adhesionEnabled,
            adhesions: this.state.adhesions,
            packs: (this.props.packs || {})[this.state.season],
            user: this.props.user,
            formulas: this.state.formulas,
        });



        const {
            totalDue,
            totalPayback,
            totalPayments,
            previsionalTotal,
            totalPaymentsToDay,
        } = calculateTotals(
            this.state.duePayments,
            this.state.payments,
            itemsForPayment
        );

        const globalLocation =
            (Object.keys(this.state.schedules).length > 0 &&
                _.reduce(
                    this.state.schedules,
                    (acc, s) => (s.location_id == acc ? acc : null),
                    Object.entries(this.state.schedules)[0][1].location_id
                )) ||
            null;

        const generateStatusSelection = _.map(
            this.props.schedule_statuses,
            (s, i) => {
                return (
                    <div key={s.id} className="radio radio-primary">
                        <input
                            type="radio"
                            name="status"
                            value={s.id}
                            checked={this.state.schedule_status_id == s.id}
                            onChange={e => this.handleChangeStatus(e)}
                            id={s.id}
                        />
                        <label htmlFor={s.id}>
                            <span>{s.label}</span>
                        </label>
                    </div>
                );
            }
        );

        const previousSeason = findAndGet(
            this.props.seasons,
            s => s.id === this.state.season,
            "previous"
        );

        let previousSeasonCreditNotes = null;
        let previousSeasonBalance = 0;

        if (previousSeason) {
            previousSeasonCreditNotes =
                previousSeason &&
                _(
                    _.find(
                        this.state.paymentsBySeason,
                        (_, sId) => previousSeason.id == sId
                    )
                )
                    .map(a => a)
                    .flatten()
                    .filter("payment_method.is_credit_note")
                    .value();

            const previousSeasonState =
                previousSeason &&
                this.getSeasonDependentState(previousSeason.id);
            const {previsionalTotal, totalPayments} =
            previousSeason &&
            calculateTotals(
                previousSeasonState.duePayments,
                previousSeasonState.payments,
                generateDataForPaymentSummaryTable({
                    activities: this.state.activities,
                    desired: previousSeasonState.desiredActivities,
                    options: this.state.options,
                    seasonId: previousSeason.id,
                    seasons: this.props.seasons,
                    adhesionPrices: this.props.adhesionPrices,
                    adhesionEnabled: this.props.adhesionEnabled,
                    adhesions: previousSeasonState.adhesions,
                    packs: (this.props.packs || {})[this.state.season],
                    user: this.props.user,
                    formulas: this.state.formulas,
                })
            );

            previousSeasonBalance = _.floor(
                previsionalTotal - totalPayments,
                2
            );
        }

        return (
            <React.Fragment>
                <div className="payment-print">
                    <div className="payment-print-identity">
                        <div className="row">
                            <div className="col-xs-8">
                                {_(this.props.activities)
                                    .map(a => a.user)
                                    .compact()
                                    .uniqBy(u => u.id)
                                    .map(u => (
                                        <p
                                            key={u.id}
                                        >{`${u.first_name} ${u.last_name} N°${u.adherent_number}`}</p>
                                    ))
                                    .value()}
                            </div>
                            <div className="col-xs-4 text-right">
                                <p>
                                    {
                                        this.props.seasons.find(
                                            s => s.id === this.state.season
                                        ).label
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="payment-print-content">
                        <h3 className="payment-print-payer">
                            Payeur.s :{" "}
                            {this.state.payers.map((p, i, a) => (
                                <b
                                    key={i}
                                >{`${p.first_name} ${p.last_name}`}</b>
                            ))}
                        </h3>

                        <hr/>

                        <div className="row payment-print-checkbox-section">
                            <div className="col-xs-6">
                                <h2>Moyen de paiement</h2>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Prélèvement
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Chèque
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Espèces
                                </h3>
                            </div>
                            <div className="col-xs-6">
                                <h2>Nombre d'échéance(s)</h2>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Annuel
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Trimestriel (Octobre/Janvier/Avril)
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Mensuel (indiquer nombre d'échéances et
                                    premier mois)
                                </h3>
                            </div>
                        </div>
                        <div className="row payment-print-checkbox-section">
                            <div className="col-xs-6">
                                <h2>Pour les prélèvements, date souhaitée</h2>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    5 du mois
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    15 du mois
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    28 du mois
                                </h3>
                            </div>
                        </div>
                        <div className="row payment-print-checkbox-section">
                            <div className="col-lg-12">
                                <div>
                                    <h2>Adhésion réglée différemment</h2>{" "}
                                    <h3>
                                        <span className="payment-print-checkbox"></span>
                                        Oui{" "}
                                        <span className="payment-print-checkbox"></span>
                                        Non
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="row payment-print-checkbox-section">
                            <div className="col-xs-6">
                                <h3>Moyen de paiement</h3>
                            </div>
                            <div className="col-xs-6">
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Chèque
                                </h3>
                                <h3>
                                    <span className="payment-print-checkbox"></span>
                                    Espèces
                                </h3>
                            </div>
                        </div>
                        <div className="row payment-print-checkbox-section">
                            <div className="col-xs-6">
                                <h2>Commentaire.s :</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="payment-page">
                    <div className="row wrapper border-bottom white-bg page-heading">
                        <div className="col-sm-12">
                            <h2>Règlements concernant {this.props.user.first_name + " " + this.props.user.last_name}</h2>
                            <div className="flex flex-space-between-justified">
                                <div className="flex flex-row">
                                    <button
                                        className="btn btn-primary m-t-sm"
                                        onClick={() => window.print()}
                                    >
                                        <i className="fas fa-print m-r-xs"/>
                                        Imprimer
                                    </button>

                                    {
                                        this.props.is_upcoming_payment_defined && itemsForPayment.every(i => i.pricingCategoryId != undefined || i.adhesionPriceId != undefined) && <button
                                            className="btn btn-primary m-t-sm m-l-sm"
                                            onClick={this.sendUpcominPayment.bind(this)}
                                        >
                                            <i className="fas fa-paper-plane m-r-xs"/>
                                            Envoyer
                                        </button>
                                    }
                                </div>
                                <div>
                                    <p>
                                        {this.state.scheduleStatus
                                            ? this.state.scheduleStatus.label
                                            : "Pas de Statut"}
                                    </p>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-primary m-r-sm"
                                        data-toggle="modal"
                                        data-target="#statusModal"
                                    >
                                        Changer le statut
                                    </button>
                                    <div
                                        className="modal inmodal"
                                        id="statusModal"
                                        tabIndex="-1"
                                        role="dialog"
                                        aria-hidden="true"
                                    >
                                        <div className="modal-dialog">
                                            <div className="modal-content animated">
                                                <div className="modal-header">
                                                    <p>Statut des règlements</p>
                                                </div>
                                                <div className="modal-body">
                                                    {generateStatusSelection}
                                                </div>
                                                <div className="modal-footer flex flex-space-between-justified">
                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        data-dismiss="modal"
                                                    >
                                                        <i className="fas fa-times m-r-sm"></i>
                                                        Annuler
                                                    </button>
                                                    <button
                                                        className="btn btn-primary"
                                                        data-dismiss="modal"
                                                        onClick={() =>
                                                            this.handleSaveStatus()
                                                        }
                                                    >
                                                        <i className="fas fa-check m-r-sm"></i>
                                                        Valider
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="padding-page m-b-md">
                        <div className="row">
                            <div className="col-lg-4 col-md-6 col-sm-12">
                                <div className="form-group">
                                    <label>Saison</label>
                                    <select
                                        className="form-control"
                                        onChange={this.handleChangeSeason.bind(
                                            this
                                        )}
                                        value={this.state.season}
                                    >
                                        {this.props.seasons.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <PaymentsSummary
                                    isStudentView={false}
                                    payers={this.state.payers}
                                    user={this.props.user}
                                    paymentMethods={this.props.paymentMethods}
                                    globalLocation={globalLocation}
                                    locations={this.props.locations}
                                    season={this.state.season}
                                    seasons={this.props.seasons}
                                    pricingCategories={this.props.pricingCategories}
                                    data={itemsForPayment}
                                    coupons={this.props.coupons}
                                    totalDue={isNaN(totalDue) ? null : totalDue}
                                    totalPayments={totalPayments}
                                    totalPayback={totalPayback}
                                    totalPaymentsToDay={totalPaymentsToDay}
                                    previsionalTotal={previsionalTotal}
                                    schedules={this.state.schedules}
                                    handleChangePricingChoice={(desId, userId, evt) => this.handleChangePricingChoice(desId, userId, evt)}
                                    handleChangePaymentMethod={(id, evt) => this.handleChangeActivityPaymentMethod(id, evt)}
                                    handleSwitchLocation={(id, location) => this.handleSwitchLocation(id, location)}
                                    handleChangePercentOffChoice={(discountable_id, discountable_type, couponId) => this.handleChangePercentOffChoice(discountable_id, discountable_type, couponId)}
                                    adhesionPrices={this.props.adhesionPrices}
                                    handleChangeAdhesionPricingChoice={(userId, evt) => this.handleChangeAdhesionPricingChoice(userId, evt)}
                                    formulas={this.props.formulas}
                                    // handleChangeProrataForDesiredActivity={(id, prorata) => this.handleChangeProrataForDesiredActivity(id, prorata)}
                                />
                            </div>
                        </div>
                        <div className="row">
                            {_.get(previousSeasonCreditNotes, "length") > 0 && (
                                <div className="col-lg-4 col-md-6">
                                    <div className="alert alert-warning">
                                        <h4>
                                            Avoir sur {previousSeason.label}
                                        </h4>
                                        <ul>
                                            {previousSeasonCreditNotes.map(
                                                p => (
                                                    <li key={p.id}>
                                                        {_.get(
                                                            p,
                                                            "payment_method.label"
                                                        )}{" "}
                                                        : {p.amount} €
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {previousSeasonBalance !== 0 && (
                                <div className="col-lg-4 col-md-6">
                                    <div className="alert alert-warning">
                                        <h4>
                                            Solde non nul sur{" "}
                                            {previousSeason.label}
                                        </h4>
                                        <h3 className="no-margins">
                                            {previousSeasonBalance}€
                                        </h3>
                                    </div>
                                </div>
                            )}
                        </div>

                        {this.state.payers.length == 0 ?
                            "Aucun échéancier pour cette saison"
                            :
                            _.map(this.state.payers, payer => {
                                const previsionalTotal = _.chain(
                                    this.state.duePayments[payer.id]
                                )
                                    .values()
                                    .flatten()
                                    .map(dp => dp.amount)
                                    .reduce(
                                        (sum, n) =>
                                            (
                                                parseFloat(sum) + parseFloat(n)
                                            ).toFixed(2),
                                        "0"
                                    )
                                    .value();


                                return (
                                    <div className="row" key={payer.id}>
                                        <SwitchPayerModal
                                            payer={_.find(this.state.payers, {
                                                id: this.state.toSwitchPayerId,
                                            })}
                                            payers={this.state.payers}
                                            isOpen={Boolean(
                                                this.state.toSwitchPayerId
                                            )}
                                            onRequestClose={() =>
                                                this.handleSetToSwitchPayerId(null)
                                            }
                                            onSubmit={newPayerId =>
                                                this.handleSwitchPayer(newPayerId)
                                            }
                                        />
                                        <div className="col-lg-12 col-md-12 flex flex-center-aligned m-b-sm">
                                            <h3 className="m-r-sm">
                                                Paiements par{" "}
                                                <a
                                                    href={`/${payer.class_name == "User"
                                                        ? "users"
                                                        : "contacts"
                                                    }/${payer.id}`}
                                                >
                                                    {`${payer.first_name} ${payer.last_name} (${payer.class_name})`}
                                                </a>

                                                {payer["payer_paying_for_current_season?"] ? "" : <span
                                                    className="badge badge-danger m-l-sm"
                                                    data-tippy-content="Cet utilisateur n'est plus payeur pour cette saison, mais apparaît parce que des échéances existent pour lui."
                                                    >
                                                        N'est plus payeur
                                                </span>}
                                            </h3>
                                            {this.state.payers.length > 1 &&
                                                <button
                                                    onClick={() =>
                                                        this.handleSetToSwitchPayerId(
                                                            payer.id
                                                        )
                                                    }
                                                    data-tippy-content="Changer le payeur"
                                                    data-toggle="modal"
                                                    data-target="#switch-payer-modal"
                                                    className="btn btn-sm btn-outline btn-primary"
                                                >
                                                    <i
                                                        className="fas fa-exchange-alt"
                                                        style={{marginRight: "0"}}
                                                    ></i>
                                                </button>
                                            }
                                        </div>

                                        {payer.payment_terms_summary &&
                                            <Fragment>
                                                <div className="col-lg-12 col-md-6 d-flex justify-content-between m-b-sm">
                                                    <div className="alert alert-info w-100">
                                                        Modalités de paiement souhaitées : {payer.payment_terms_summary}
                                                    </div>
                                                </div>
                                            </Fragment>
                                        }


                                        {this.state.payments[payer.id] && this.state.payments[payer.id].length > 0 &&
                                            <Fragment>
                                                <div
                                                    className="col-lg-12 col-md-12 d-flex justify-content-between m-b-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-xs"
                                                        onClick={() => window.open(`/payments/summary/${this.props.user.id}.pdf?season_id=${this.state.season}&payer_id=${payer.id}`)}>
                                                        <i className="fas fa-print text-primary mr-1"/>
                                                        Imprimer une attestation de paiement
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-xs"
                                                        onClick={() => window.open(`/payment_schedule/${(this.state.schedules[payer.id] && this.state.schedules[payer.id].id)}.pdf`)}>
                                                        <i className="fas fa-print text-primary mr-1"/>
                                                        Imprimer l'échéancier
                                                    </button>
                                                </div>

                                                <div className="col-lg-12 col-md-12 print-none">
                                                    &nbsp;
                                                </div>
                                            </Fragment>
                                        }

                                        <div className="col-lg-6 col-md-6 m-b-lg print-none">
                                            <DuePaymentsList
                                                key={payer.id}
                                                adhesionEnabled={this.props.adhesionEnabled}
                                                data={this.state.duePayments[payer.id] || []}
                                                payer={payer}
                                                scheduleId={(this.state.schedules[payer.id] && this.state.schedules[payer.id].id) || null}
                                                payersNumber={this.state.payers.length}
                                                paymentMethods={this.props.paymentMethods}
                                                statuses={this.props.duePaymentStatuses}
                                                itemsForPayment={itemsForPayment}
                                                handleCreatePaymentSchedule={ps => this.handleCreatePaymentSchedule(ps)}
                                                handleCreatePayments={this.handleCreatePayments.bind(this)}
                                                handleSaveNewDuePayment={dp => this.handleSaveNewDuePayment(dp)}
                                                handleSaveDuePayment={(p, payerId) => this.handleSaveDuePayment(p, payerId)}
                                                handleDeleteDuePayment={(id, payerId) => this.handleDeleteDuePayment(id, payerId)}
                                                handleBulkDelete={this.handleBulkDeleteDuePayments.bind(this)}
                                                handleBulkEditCommit={this.handleBulkEditDuePayments.bind(this)}
                                                seasonId={this.state.season}
                                            />{" "}
                                        </div>
                                        <div className="col-lg-6 col-md-6 m-b-lg print-none">
                                            <PaymentsList
                                                payer={payer}
                                                payments={this.state.payments[payer.id]}
                                                paymentMethods={this.props.paymentMethods}
                                                duePayments={this.state.duePayments[payer.id]}
                                                statuses={this.props.paymentStatuses}
                                                handleCreateNewPayment={p => this.handleCreateNewPayment(p)}
                                                handleDeletePayment={(id, payerId) => this.handleDeletePayment(id, payerId)}
                                                handleBulkDelete={this.handleBulkDeletePayments.bind(this)}
                                                handleBulkEditPayments={this.handleBulkEditPayments.bind(this)}
                                                handlePromptStatusEdit={this.handlePromptPaymentStatusEdit.bind(this)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                        <div className="row print-none">
                            <div className="col-lg-8 col-md-8">
                                <CommentSection
                                    comments={this.state.comments}
                                    userId={this.props.user_id}
                                    contextType="PaymentSchedule"
                                    contextId={this.state.contextId}
                                    newComment={this.state.newComment}
                                    editedComment={this.state.editedComment}
                                    handleUpdateNewCommentContent={e =>
                                        this.handleUpdateNewCommentContent(e)
                                    }
                                    handleSaveComment={() =>
                                        this.handleSaveComment()
                                    }
                                    handleUpdateEditedCommentContent={e =>
                                        this.handleUpdateEditedCommentContent(e)
                                    }
                                    handleSaveCommentEdition={() =>
                                        this.handleSaveCommentEdition()
                                    }
                                    handleCommentEdition={id =>
                                        this.handleCommentEdition(id)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default PaymentsManagement;
