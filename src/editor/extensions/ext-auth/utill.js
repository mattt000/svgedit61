export const checkLogin = () => {
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