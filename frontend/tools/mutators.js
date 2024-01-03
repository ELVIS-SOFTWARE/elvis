import { findAndGet } from "../components/utils";

export function selectPhoneType([index, type], state, { changeValue }) {
    changeValue(state, `telephones[${index}].label`, () => type);
}

export function changeUser([user], state, { changeValue }) {
    changeValue(state, "", () => user);
}

export function changeRelationshipDirection([fieldVal], state, { changeValue }) {
    changeValue(state, "is_inverse", () => fieldVal);
}


export function findFamilyMemberById([id], { formState: { values } }) {
    return findAndGet(values, "family", { id });
}
