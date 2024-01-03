const formatPhoneNumber = function(num) {
    //removes all non digit characters -> only takes the 10 first characters -> insert a space after each 2 character sequence -> removes extra spaces at end
    return num
        .replace(/\D/g, "")
        .substring(0, 10)
        .replace(/.{2}/g, match => `${match} `)
        .trimEnd();
};

export default formatPhoneNumber;
