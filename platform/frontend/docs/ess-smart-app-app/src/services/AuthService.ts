import { AuthenticationDetails, CognitoUser, CognitoUserSession, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { emailUserPool, phoneUserPool } from '../config/UserPool';
import Logger from '../logger/Logger';

const BUFFER_TIME = 60000;

interface ChallengeParameters {
    userAttributes: Record<string, string>;
    challengeName: string;
}

interface TokenClaims {
    username: string;
    roles: string[];
    exp: number;
}

type SuccessCallback = (result: CognitoUserSession | ChallengeParameters) => void;
type ErrorCallback = (error: Error) => void;

class AuthService {
    private userCognito: CognitoUser | null = null;

    public async initiateAuth(method: string, clientId: string, email: string, onSuccessCallback: SuccessCallback, onErrorCallback: ErrorCallback): Promise<void> {
        const pool = method === "phone" ? phoneUserPool : emailUserPool;
        localStorage.setItem("userMethodPool", method);

        if (method === "phone") {
            email = this.clearPhone(email);
        } else {
            email = email.toLowerCase();
        }

        this.userCognito = new CognitoUser({ Username: `${clientId}|${email}`, Pool: pool });

        const validationData = {
            "user": email,
            "method": method,
            "clientId": clientId
        };

        const authDetails = new AuthenticationDetails({
            Username: `${clientId}|${email}`,
            ValidationData: validationData
        });

        await this.goAuth(authDetails, onSuccessCallback, onErrorCallback);
    }

    private clearPhone(str: string): string {
        return str.replace(/\D/g, '');
    }

    private async goAuth(authDetails: AuthenticationDetails, onSuccessCallback: SuccessCallback, onErrorCallback: ErrorCallback): Promise<void> {
        if (!this.userCognito) return;

        this.userCognito.initiateAuth(authDetails, {
            onSuccess: (result: CognitoUserSession) => {
                Logger.debug('Authentication successful:', result);
                onSuccessCallback(result);
            },
            customChallenge: (challengeParameters: ChallengeParameters) => {
                Logger.debug('Challenge:', challengeParameters);
                onSuccessCallback(challengeParameters);
            },
            onFailure: (err: Error) => {
                Logger.error('Authentication error:', err);
                onErrorCallback(err);
            }
        });
    }

    public async confirmAuth(code: string, onSuccess: (result: CognitoUserSession) => void, onFailure: (err: Error) => void): Promise<void> {
        if (!this.userCognito) {
            Logger.error("Session data is missing, cannot verify the challenge response.");
            return;
        }

        this.userCognito.sendCustomChallengeAnswer(code, {
            onSuccess: (result) => {
                Logger.debug("Confirmation successful", result);
                onSuccess(result);
            },
            onFailure: (err) => {
                Logger.error("Confirmation failed", err);
                onFailure(err);
            }
        });
    }

    public isTokenExpired(): boolean {
        const token = localStorage.getItem('accessToken');
        if (!token) return true;

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = decodedToken.exp * 1000;
        return (expiryTime - BUFFER_TIME) < new Date().getTime();
    }

    public getClaim(): TokenClaims | null {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        return JSON.parse(atob(token.split('.')[1]));
    }

    public async refreshAuthToken(): Promise<CognitoUserSession> {
        return new Promise((resolve, reject) => {
            const refreshToken = localStorage.getItem('refreshToken');
            const method = localStorage.getItem('userMethodPool');
            if (!refreshToken) {
                Logger.error('No refresh token available');
                return reject('No refresh token available');
            }

            const refreshTokenObj = new CognitoRefreshToken({ RefreshToken: refreshToken });
            const claim = this.getClaim();
            if (claim === null || typeof claim['username'] === "undefined") {
                Logger.error('No username available');
                return reject('No username available');
            }

            Logger.debug("Claim", claim);

            this.userCognito = new CognitoUser({ Username: `${claim['username']}`, Pool: method === "phone" ? phoneUserPool : emailUserPool });

            this.userCognito.refreshSession(refreshTokenObj, (err, session) => {
                if (err) {
                    Logger.error('Error refreshing the token:', err);
                    return reject(err);
                }
                resolve(session);
            });
        });
    }
}

export default new AuthService();