export const makeDebounce = () => {
    let timer = null;

    return (callback, duration) => {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            callback();

            timer = null;
        }, duration);
    };
};
