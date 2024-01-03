import { csrfToken } from "../components/utils";
import { API_ERRORS_MESSAGES } from "./constants";
import swal from "sweetalert2";

const blobMimeTypes = ["application/pdf"];

/**
 * Handle API response
 * @param {*} response
 */
export const handleResponse = response => {
    if (!response.ok) {
        const errorData = response.json() || Promise.resolve(false);

        return errorData.then(error =>
            Promise.reject(
                Array.isArray(error.errors)
                    ? error.errors.map(err => API_ERRORS_MESSAGES[err] || err)
                    : error
            )
        );
    }

    const contentType = response.headers.get("Content-type")

    if(!contentType)
        return  Promise.resolve(null);
    else if(contentType.indexOf('application/json')!==-1)
        return response.json();
    else
        return response.blob();

    return data;
};

// API REQUESTS
const request = method => (
    url = null,
    data = undefined,
    callbacks = {},
    additionalHeaders = {}
) => {
    if (callbacks.before) {
        callbacks.before();
    }
    
    let body = undefined;
    if(data) {
        if (method === "GET") {
            const searchParams = new URLSearchParams(data);
            url = `${url}?${searchParams.toString()}`
            body = { };
        } else {
            body = { body: JSON.stringify(data) };
        }
    }

    const options = {
        method: method,
        ...body,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "X-Csrf-Token": csrfToken,
            "Content-Type": "application/json",
            ...additionalHeaders,
        },
    };

    if(callbacks.loading)
        window.dispatchEvent(new Event("loadingStart"));

    return fetch(url ? `${url}` : "", options)
        .then(handleResponse)
        .then(data => {
            if (callbacks.loading)
                window.dispatchEvent(new Event("loadingEnd"));

            return callbacks.success ? callbacks.success(data) : { data };
        })
        .catch(error => {
            if (callbacks.loading)
                window.dispatchEvent(new Event("loadingEnd"));

            if(callbacks.error)
                return callbacks.error(error);

            if(error.code)
            {
                swal({
                    type: 'error',
                    title: 'Oops... une erreur est survenue',
                    text: error.message ? `${error.message} (${error.code})` : `Veuillez contactez l'administrateur du site pour plus d'informations et lui donner le cod suivant : ${error.code}`
                });
            }

            return { error };
        });
};

export const get = request("GET");
export const post = request("POST");
export const put = request("PUT");
export const patch = request("PATCH");
export const del = request("DELETE");

export const set = (callbacks = {}) => ({
    useLoading: () => set({ ...callbacks, loading: true }),
    before: func => set({ ...callbacks, before: func }),
    success: func => set({ ...callbacks, success: func }),
    error: func => set({ ...callbacks, error: func }),
    get: (url, data, additionalHeaders = {}) =>
        get(url, data, callbacks, additionalHeaders),
    post: (url, data, additionalHeaders = {}) =>
        post(url, data, callbacks, additionalHeaders),
    put: (url, data, additionalHeaders = {}) =>
        put(url, data, callbacks, additionalHeaders),
    patch: (url, data, additionalHeaders = {}) =>
        patch(url, data, callbacks, additionalHeaders),
    del: (url, data, additionalHeaders = {}) =>
        del(url, data, callbacks, additionalHeaders),
});
