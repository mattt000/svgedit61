const API_BASE_URL = 'https://teleagam.outeraspect.com';

const checkLogin = () => {
    const getUser = localStorage.getItem('user');
    const user = JSON.parse(getUser);

    if (!user) {
        return {
            access_token: null,
            user: null,
            isloggedIn: false
        }
    }

    return {
        access_token: user.access_token,
        user: user.user,
        isloggedIn: true
    }
}

const http = {};

http.get = async (endpoint) => {
    const {access_token} = checkLogin();
    let options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${access_token}`
        },
    };

    try {
        const response = await fetch(API_BASE_URL + endpoint, options)
        const result = await response.json();

        if (response.status === 200) {
            return Promise.resolve(result);
        }
        return Promise.reject(result);
    } catch (err) {
        return Promise.reject(err)
    }
};

http.post = async (endpoint, body) => {
    const {access_token} = checkLogin();
    let options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${access_token}`
        },
        body: JSON.stringify(body)
    };

    if (body instanceof FormData) {
        options = {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${access_token}`
            },
            body: body
        };
    }
    

    try {
        const response = await fetch(API_BASE_URL + endpoint, options)
        const result = await response.json();

        if (response.status === 200) {
            return Promise.resolve(result);
        }
        return Promise.reject(result);
    } catch (err) {
        return Promise.reject(err)
    }
};


http.put = async (endpoint, body) => {
    const {access_token} = checkLogin();
    let options = {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${access_token}`
        },
        body: body instanceof FormData ? body : JSON.stringify(body)
    };

    try {
        const response = await fetch(API_BASE_URL + endpoint, options)
        const result = await response.json();

        if (response.status === 200) {
            return Promise.resolve(result);
        }
        return Promise.reject(result);
    } catch (err) {
        return Promise.reject(err)
    }
};


http.delete = async (endpoint) => {
    const {access_token} = checkLogin();
    let options = {
        method: 'delete',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${access_token}`
        },
    };

    try {
        const response = await fetch(API_BASE_URL + endpoint, options)
        const result = await response.json();

        if (response.status === 200) {
            return Promise.resolve(result);
        }
        return Promise.reject(result);
    } catch (err) {
        return Promise.reject(err)
    }
};

export default http;


