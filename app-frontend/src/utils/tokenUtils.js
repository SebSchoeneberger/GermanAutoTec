const key = "GermanAutoTec-Token";

export const getToken = () => {
    return localStorage.getItem(key);
};

export const storeToken = (token) => {
    if (!token) {
        localStorage.removeItem(key);
        return;
    }
    localStorage.setItem(key, token);
};
