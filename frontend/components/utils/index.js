import _ from "lodash";
import moment from "moment";
import React from "react";

export const ISO_DATE_FORMAT = "YYYY-MM-DD";
export const FR_DATE_FORMAT = "DD/MM/YYYY";

export const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");

export function indexById(arr) {
    return _.keyBy(arr, "id");
}

// DRY option creator
// Function creating an option element with a given data
// Takes two arguments:
//  - the actual data that will be queried to output the option's
//    options (key, value, label)
//  - an options object specifying what information will be extracted,
//    this parameter has defaults which represent the most frequent use cases
export const optionCreator = (data, i, arr, {id = d => d.id, label = d => d.label}) => (<option key={id(data, i, arr)} value={id(data, i, arr)}>
    {label(data, i, arr)}
</option>);

// This is a preparation function, which in advance gives the options object
// which will be used to create the options
// This is so we don't have to pass a lambda to the map call, and so
// that everything stays "simple" enough
export const optionMapper = (options = {}) => (data, i, arr) => optionCreator(data, i, arr, options);

export const reactOptionCreator = (data, i, arr, {id = d => d.id, label = d => d.label}) => ({value: id(data, i, arr), label: label(data, i, arr)});

export const reactOptionMapper = (options = {}) => (data, i, arr) => reactOptionCreator(data, i, arr, options);

export const USER_OPTIONS = { label: d => `${d.first_name} ${d.last_name}` }
export const USER_OPTIONS_SHORT = { label: d => `${d.first_name} ${d.last_name.charAt(0)}.` };

export function hasKeys(o, keys) {
    return keys.reduce((acc, k) => acc && _.has(o, k), true);
}

export function findAndGet(data, f, path, def=null) {
    return _.get(_.find(data, f), path, def);
}

export function isRadioTrue(v) {
    return v === true || v === "true";
}

function downloadFile({
    url,
    format="csv",
    fileName=moment().format("DD_MM_YYYY-HH_mm_ss"),
} = {}) {
    fetch(url, {
        method: "GET",
        headers: {
            "X-Csrf-Token": csrfToken,
        },
    })
        .then(res => res.blob())
        .then(file => {
            const download = document.createElement("a");
            download.download = `${fileName}.${format}`;
            download.href = URL.createObjectURL(file);
            document.body.appendChild(download);
            download.click();
            document.body.removeChild(download);
        });
}

export function DownloadButton({url, format, fileName, children, ...passProps}) {
    return <button
        className="btn btn-sm btn-primary"
        {...passProps}
        onClick={() => downloadFile({
            url,
            format,
            fileName,
        })}>
        {children}
    </button>;
}

export function displayGenitiveName(name) {
    return name ? `${name.match(/^[aeiou]/i) ? "d'" : "de "}${name}` : "de";
}

export function displayInlineAddress(a) {
    return `${a.street_address}, ${a.postcode} ${a.city}`;
}

export function frenchEnumeration(list) {
    if(list.length === 0)
        return "";
    else if(list.length === 1)
        return list[0];
    else {
        const withoutLast = list.slice(0, list.length-1).join(", ");
        const last = list[list.length -1];
        return `${withoutLast} et ${last}`;
    }
}