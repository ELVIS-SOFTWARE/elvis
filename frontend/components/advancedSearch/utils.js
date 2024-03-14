import _ from "lodash";
import QueryBuilder from "jQuery-QueryBuilder";
// QueryBuilder Elasticsearch plugin
// =================================
/**
 * Get the right type of query term in elasticsearch DSL
 */
function getQueryDSLWord(rule) {
    const term = /^(equal|not_equal)$/.exec(rule.operator),
        wildcard = /.(\*|\?)/.exec(rule.value),
        terms = /^(in|not_in)$/.exec(rule.operator);

    if (term !== null && wildcard !== null) {
        return "wildcard";
    }
    if (term !== null) {
        return "term";
    }
    if (terms !== null) {
        return "terms";
    }
    return "range";
}

/**
 * Get the right type of clause in the bool query
 */
function getClauseWord(condition, operator) {
    if (
        condition === "AND" &&
        (operator !== "not_equal" &&
            operator !== "not_in" &&
            operator !== "is_null")
    ) {
        return "must";
    }
    if (
        condition === "AND" &&
        (operator === "not_equal" ||
            operator === "not_in" ||
            operator === "is_null")
    ) {
        return "must_not";
    }
    if (condition === "OR") {
        return "should";
    }
}

export const initializeElasticPlugin = () => {
    //const QueryBuilder = $.fn.queryBuilder;
    // ===============================
    // DEFAULT CONFIG
    // ===============================
    QueryBuilder.defaults({
        ESBoolOperators: {
            equal: function(v) {
                return v;
            },
            not_equal: function(v) {
                return v;
            },
            less: function(v) {
                return { lt: v };
            },
            less_or_equal: function(v) {
                return { lte: v };
            },
            greater: function(v) {
                return { gt: v };
            },
            greater_or_equal: function(v) {
                return { gte: v };
            },
            between: function(v) {
                return { gte: v[0], lte: v[1] };
            },
            in: function(v) {
                // const values = v;
                if (_.isString(v)) {
                    v = v.split(",");
                }

                return v.map(function(e) {
                    return e.trim();
                });
            },
            not_in: function(v) {
                if (_.isString(v)) {
                    v = v.split(",");
                }

                return v.map(function(e) {
                    return e.trim();
                });
            },
            is_null: function(v) {
                return v;
            },
            is_not_null: function(v) {
                return v;
            },
        },

        ESQueryStringQueryOperators: {
            is_not_null: function() {
                return "_exists_:";
            },
            is_null: function() {
                return "_missing_:";
            },
            contains: function(v) {
                return v;
            },
            between: function(v) {
                return "[" + v[0] + " TO " + v[1] + "]";
            },
        },
    });

    // PUBLIC METHODS
    // ===============================
    QueryBuilder.extend({
        /**
         * Get rules as an elasticsearch bool query
         * @param data {object} (optional) rules
         * @return {object}
         */
        getESBool: function(data) {
            data = data === undefined ? this.getRules() : data;

            var that = this;

            return (function parse(data) {
                if (!data.condition) {
                    data.condition = that.settings.default_condition;
                }

                if (
                    ["AND", "OR"].indexOf(data.condition.toUpperCase()) === -1
                ) {
                    throw new Error(
                        'Unable to build Elasticsearch bool query with condition "{0}"'.replace(
                            "{0}",
                            data.condition,
                        ),
                    );
                }

                if (!data.rules) {
                    return {};
                }

                const parts = {};
                parts.add = function(k, v) {
                    if (this.hasOwnProperty(k)) {
                        this[k].push(v);
                    } else {
                        this[k] = [v];
                    }
                };

                data.rules.forEach(function(rule) {
                    function get_value(rule) {
                        if (
                            rule.data &&
                            rule.data.hasOwnProperty("transform")
                        ) {
                            return window[rule.data.transform].call(
                                this,
                                rule.value,
                            );
                        } else {
                            return rule.value;
                        }
                    }

                    function make_query(rule) {
                        let mdb = that.settings.ESBoolOperators[rule.operator],
                            ope = that.getOperatorByType(rule.operator),
                            part = {};

                        if (mdb === undefined) {
                            throw new Error(
                                'Unknown elasticsearch operation for operator "{0}"'.replace(
                                    "{0}",
                                    rule.operator,
                                ),
                            );
                        }

                        if (ope.nb_inputs !== 0) {
                            const es_key_val = {};
                            es_key_val[rule.field] = mdb.call(
                                that,
                                get_value(rule),
                            );
                            part[getQueryDSLWord(rule)] = es_key_val;
                        }

                        if (
                            rule.operator === "is_null" ||
                            rule.operator === "is_not_null"
                        ) {
                            part = { exists: { field: rule.field } };
                        }

                        // this is a corner case, when we have an "or" group and a negative operator,
                        // we express this with a sub boolean query and must_not.
                        if (
                            data.condition === "OR" &&
                            (rule.operator === "not_equal" ||
                                rule.operator === "not_in" ||
                                rule.operator === "is_null")
                        ) {
                            return { bool: { must_not: [part] } };
                        } else {
                            return part;
                        }
                    }

                    const clause = getClauseWord(data.condition, rule.operator);

                    if (rule.rules && rule.rules.length > 0) {
                        parts.add(clause, parse(rule));
                    } else {
                        parts.add(clause, make_query(rule));
                    }
                });

                delete parts.add;
                return { bool: parts };
            })(data);
        },

        /**
         * Get rules as an elasticsearch query string query
         * @param data {object} (optional) rules
         * @return {object}
         */
        getESQueryStringQuery: function(data) {
            data = data === undefined ? this.getRules() : data;

            const that = this;

            return (function parse(data) {
                if (!data.condition) {
                    data.condition = that.settings.default_condition;
                }

                if (
                    ["AND", "OR"].indexOf(data.condition.toUpperCase()) === -1
                ) {
                    throw new Error(
                        'Unable to build Elasticsearch query String query with condition "{0}"'.replace(
                            "{0}",
                            data.condition,
                        ),
                    );
                }

                if (!data.rules) {
                    return "";
                }

                // generate query string
                let parts = "";

                data.rules.forEach(function(rule, index) {
                    function get_value(rule) {
                        return rule.value;
                    }

                    function make_query(rule) {
                        let mdb =
                                that.settings.ESQueryStringQueryOperators[
                                    rule.operator
                                    ],
                            ope = that.getOperatorByType(rule.operator),
                            part = "";

                        if (mdb === undefined) {
                            throw new Error(
                                'Unknown elasticsearch operation for operator "{0}"'.replace(
                                    "{0}",
                                    rule.operator,
                                ),
                            );
                        }

                        let es_key_val = "";
                        if (ope.nb_inputs !== 0) {
                            es_key_val +=
                                rule.field + ":" + mdb.call(that, rule.value);
                            part += es_key_val;
                        } else if (ope.nb_inputs === 0) {
                            es_key_val +=
                                mdb.call(that, rule.value) + rule.field;
                            part += es_key_val;
                        }

                        if (data.rules[index + 1]) {
                            return part + " " + data.condition + " ";
                        } else {
                            return part;
                        }
                    }
                    if (rule.rules && rule.rules.length > 0) {
                        parts += "(" + parse(rule) + ")";
                    } else {
                        parts += make_query(rule);
                    }
                });
                return parts;
            })(data);
        },
    });
};

// QueryBuilder lang
// =================================
export const initializeLang = () => {
    const QueryBuilder = $.fn.queryBuilder;

    QueryBuilder.regional["fr"] = {
        __locale: "French (fr)",
        __author: 'Damien "Mistic" Sorel, http://www.strangeplanet.fr',
        add_rule: "Ajouter une règle",
        add_group: "Ajouter un groupe",
        delete_rule: "Supprimer",
        delete_group: "Supprimer",
        conditions: {
            AND: "ET",
            OR: "OU",
        },
        operators: {
            equal: "est égal à",
            not_equal: "n'est pas égal à",
            in: "est compris dans",
            not_in: "n'est pas compris dans",
            less: "est inférieur à",
            less_or_equal: "est inférieur ou égal à",
            greater: "est supérieur à",
            greater_or_equal: "est supérieur ou égal à",
            between: "est entre",
            not_between: "n'est pas entre",
            begins_with: "commence par",
            not_begins_with: "ne commence pas par",
            contains: "contient",
            not_contains: "ne contient pas",
            ends_with: "finit par",
            not_ends_with: "ne finit pas par",
            is_empty: "est vide",
            is_not_empty: "n'est pas vide",
            is_null: "est nul",
            is_not_null: "n'est pas nul",
        },
        errors: {
            no_filter: "Aucun filtre sélectionné",
            empty_group: "Le groupe est vide",
            radio_empty: "Pas de valeur selectionnée",
            checkbox_empty: "Pas de valeur selectionnée",
            select_empty: "Pas de valeur selectionnée",
            string_empty: "Valeur vide",
            string_exceed_min_length: "Doit contenir au moins {0} caractères",
            string_exceed_max_length:
                "Ne doit pas contenir plus de {0} caractères",
            string_invalid_format: "Format invalide ({0})",
            number_nan: "N'est pas un nombre",
            number_not_integer: "N'est pas un entier",
            number_not_double: "N'est pas un nombre réel",
            number_exceed_min: "Doit être plus grand que {0}",
            number_exceed_max: "Doit être plus petit que {0}",
            number_wrong_step: "Doit être un multiple de {0}",
            number_between_invalid:
                "Valeurs invalides, {0} est plus grand que {1}",
            datetime_empty: "Valeur vide",
            datetime_invalid: "Fomat de date invalide ({0})",
            datetime_exceed_min: "Doit être après {0}",
            datetime_exceed_max: "Doit être avant {0}",
            datetime_between_invalid:
                "Valeurs invalides, {0} est plus grand que {1}",
            boolean_not_valid: "N'est pas un booléen",
            operator_not_multiple:
                'L\'opérateur "{1}" ne peut utiliser plusieurs valeurs',
        },
        invert: "Inverser",
        NOT: "NON",
    };

    QueryBuilder.defaults({ lang_code: "fr" });
};

export const PAYMENT_SCHEDULE_OPTIONS_PAYMENTS_NUMBERS = [
    {
        nb: 1,
        label: "Annuel (1)"
    },
    {
        nb: 2,
        label: "Semestriel (2)"
    },
    {
        nb: 3,
        label: "Trimestriel (3)"
    },
    {
        nb: 9,
        label: "Mensuel (9)"
    }
];