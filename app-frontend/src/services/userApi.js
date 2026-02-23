import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export async function signIn(formData) {
    try {
        const response = await axios.post(`${API_URL}/users/login`, formData);
        return response.data;
    } catch (error) {
        console.log(error);
        return error.response.data;
    }
}