var token = {
    BUFFER_TIME: 60000,

    emailUserPool: null,
    phoneUserPool: null,

    initPools: function () {
        function getLocalStorageItem(key) {
            var value = localStorage.getItem(key);
            if (value === null) {
                throw new Error('Error: key "' + key + '" not found in localStorage');
            }
            return value;
        }
        try {
            var userPoolIdEmail = getLocalStorageItem('userPoolId');
            var appClientEmailId = getLocalStorageItem('appClientEmailId');
            var userPoolIdPhone = getLocalStorageItem('userPoolId');
            var appClientPhoneId = getLocalStorageItem('appClientPhoneId');

            var emailPoolData = {
                UserPoolId: userPoolIdEmail,
                ClientId: appClientEmailId
            };

            var phonePoolData = {
                UserPoolId: userPoolIdPhone,
                ClientId: appClientPhoneId
            };

            this.emailUserPool = new AmazonCognitoIdentity.CognitoUserPool(emailPoolData);
            this.phoneUserPool = new AmazonCognitoIdentity.CognitoUserPool(phonePoolData);
        } catch (error) {
            console.error(error);
        }
    },

    isTokenExpired: function () {
        var tokenStr = app.local.accessToken;
        if (!tokenStr) return true;
        var parts = tokenStr.split('.');
        if (parts.length < 2) return true;
        try {
            var payload = JSON.parse(atob(parts[1]));
            var exp = payload.exp * 1000;
            return (exp - this.BUFFER_TIME) < Date.now();
        } catch (e) {
            return true;
        }
    },

    refreshAuthToken: function (callback, errorCallback) {
        var self = this;
        var refreshTokenStr = app.local.refreshToken;
        if (!refreshTokenStr) {
            if (typeof errorCallback === 'function') errorCallback('No refresh token available');
            return;
        }
        var refreshTokenObj = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refreshTokenStr });

        var tokenParts = app.local.accessToken.split('.');
        if (tokenParts.length < 2) {
            if (typeof errorCallback === 'function') errorCallback('Invalid access token');
            return;
        }
        var payload;
        try {
            payload = JSON.parse(atob(tokenParts[1]));
        } catch (e) {
            if (typeof errorCallback === 'function') errorCallback('Error decoding access token');
            return;
        }
        var username = payload.username;
        if (!username) {
            if (typeof errorCallback === 'function') errorCallback('No username found in token');
            return;
        }
        var pool = (app.local.userMethodPool === "phone") ? self.phoneUserPool : self.emailUserPool;
        var userData = {
            Username: username,
            Pool: pool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.refreshSession(refreshTokenObj, function (err, session) {
            if (err) {
                if (typeof errorCallback === 'function') errorCallback(err);
                return;
            }
            var newAccessToken = session.getAccessToken().getJwtToken();
            var newRefreshToken = session.getRefreshToken().getToken();
            app.local.accessToken = newAccessToken;
            app.local.refreshToken = newRefreshToken;
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            console.log('Token refresh');
            if (typeof callback === 'function') callback();
        });
    },

    ensureValidToken: function (callback, errorCallback) {
        if (this.isTokenExpired()) {
            this.refreshAuthToken(callback, errorCallback);
        } else {
            if (typeof callback === 'function') callback();
        }
    },

    addAuthHeaders: function (options) {
        options.crossDomain = true;
        options.headers = options.headers || {};
        if (app.local.accessToken) {
            options.headers['Authorization'] = 'Bearer ' + app.local.accessToken;
        }
        return options;
    }
};