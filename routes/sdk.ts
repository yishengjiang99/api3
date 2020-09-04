import axios from 'axios';

export const sdk = (props) => {
    const API_DIR = "https://api.spotify.com/v1";
    const { access_token, refresh_token, exiry } = props

    const fetchAPI = (uri, method = "GET") => {
        console.log(uri);
        return axios
            .get(API_DIR + uri, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + access_token,
                },
            })
            .then((response) => response.data).catch(e => console.error(e));
        //console.log(response.data));// && return response.data)
    };

    const fetchAPIPut = (uri, body) =>
        axios(API_DIR + uri, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            data: JSON.stringify(body)
        }).catch((err) => console.error(err));
    return {
        fetchAPIPut,
        fetchAPI,
    };
};