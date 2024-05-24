import { findAndGet } from "../components/utils";
import _ from "lodash";

export const mapFamily = (rawFamilyUsers, rawInverseFamilyMembers, family = []) => {
    const members = _.map(
        _.compact(
            _.concat(rawFamilyUsers, rawInverseFamilyMembers, family)
        ),
        f => {
            const user = f.member || f.user;

            user.link = f.link;
            user.kind = "user";
            user.is_inverse = f.member ? true : false,
            user.is_to_call = f.is_to_call,
            user.is_paying_for = f.is_paying_for;
            user.is_accompanying = f.is_accompanying;
            user.is_legal_referent = f.is_legal_referent;

            return user;
        }
    );

    return members;
};

export const checkNonEmptyValues = (obj, properties) => {
    for(let p of properties) {
        if (_.isEmpty(obj[p])) {
            return false;
        }
    }

    return true;
};

export const generateUserInfos = () => ({ // corrigé ?
    id: 0,
    checked_gdpr: false,
    checked_rules: false,
    is_paying: false,
    planning: {},
    first_name: "",
    last_name: "",
    email: "",
    adherent_number: "",
    birthday: "",
    sex: 0,
    street_address: "",
    postcode: "",
    city: "",
    department: "",
    country: "",
    telephones: [{}],
    job: "",
    school: "",
    handicap: false,
    handicap_description: "",
    family: [],
    addresses: [{ isNew: true }],
    availabilities: null,
});

export const retrieveUserLevel = (user, activityRefId, seasonId) => findAndGet(
    user.levels,
    l => l.season_id === seasonId && l.activity_ref_id === activityRefId,
    "evaluation_level_ref.label"
);

export const infosFromUser = user => ({
    ...generateUserInfos(),
    ...user,
    addresses: user.addresses.length ? user.addresses : [{ isNew: true }],
    telephones: user.telephones.length ? user.telephones : [{}],
    family: user.family_links_with_user,
    consent_docs: (() => {
        const docs = {};

        for (const doc of (user.consent_document_users || [])) {
            docs[`id_${doc.consent_document_id}`] = {
                agreement: doc.expected_answer ? doc.has_consented : doc.has_consented.toString()
            };
        }

        return docs;
    })(),
});

export const generateBandInfos = () => ({
    id: 0,
    name: "",
    blacklisted: false,
    users: [],
    old_members: []
});

export const generateBandUsersInfos = users => ({
    id: 0,
    last_name: "",
    first_name: "",
    instrument_id:0
});

export const infosFromBand = band => ({
    ...generateBandInfos(),
    ...band,
    users: band.bands_users.filter(user => !user.left_at).map(({id, user, instrument_id, joined_at, left_at, last_name, first_name, email}) => ({
        id: user === undefined ? 0 : user.id,
        last_name: user === undefined ? last_name : user.last_name,
        first_name: user === undefined ? first_name : user.first_name,
        email: user === undefined ? email : user.email,
        instrument_id: instrument_id,
        joined_at: joined_at,
        left_at: left_at
    })),
    old_members: band.bands_users.filter(user => user.left_at).map(({id, user, instrument_id, joined_at, left_at, last_name, first_name, email}) => ({
        id: user === undefined ? 0 : user.id,
        last_name: user === undefined ? last_name : user.last_name,
        first_name: user === undefined ? first_name : user.first_name,
        email: user === undefined ? email : user.email,
        instrument_id: instrument_id,
        joined_at: joined_at,
        left_at: left_at
    })),
})