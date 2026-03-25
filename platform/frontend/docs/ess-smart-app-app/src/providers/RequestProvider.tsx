import { FC, ReactNode } from 'react';
import { RequestContext, RequestState } from '../contexts/RequestContext';
import AuthService from '../services/AuthService';
import { useAuth } from '../hooks/useAuth';
import Logger from "../logger/Logger";

interface ApiResponseSuccess<T> {
  status: "ok";
  data: T;
}

interface ApiResponseError {
  status: "error";
  message: string;
}

type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export const RequestProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken, saveToken, signOut } = useAuth();

  const sendRequest = async (action: string, data = {}, method = 'POST', aspServer: boolean = false, webApi: boolean = false): Promise<any | null> => {
    let token = await getToken();

    if (AuthService.isTokenExpired() && token) {
      try {
        const session = await AuthService.refreshAuthToken();
        Logger.debug("Token refresh.");
        await saveToken(session.getAccessToken().getJwtToken(), session.getIdToken().getJwtToken(), session.getRefreshToken().getToken());
        token = await getToken();
      } catch (error) {
        Logger.error("Token refresh failed: ", error);
        await signOut();
        return;
      }
    }

    if (!token) {
      await signOut();
    }

    if (aspServer) {
      token = localStorage.getItem("aspKey") || null;
      if (token === null) {
        await signOut();
      }
    }

    let headers = new Headers({});

    if (!aspServer) {
      headers = new Headers({
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization': token ? `Bearer ${token}` : '',
      });
    } else {
      action += "?t=" + token;
    }

    const fetchOptions: RequestInit = {
      method: method,
      headers: headers,
      body: method !== "GET" ? JSON.stringify(data) : null,
      mode: 'cors',
      cache: 'no-cache',
    };

    let baseUrl = localStorage.getItem('appApiUrl') && !aspServer ? localStorage.getItem('appApiUrl') : localStorage.getItem('aspUrl');
    if (webApi && localStorage.getItem('webApiUrl')) {
      baseUrl = localStorage.getItem('webApiUrl');
    }
    const url = new URL(`${baseUrl}${action}`);
    try {
      const response = await fetch(url.toString(), fetchOptions);

      const jsonResponse: ApiResponse<any> = await response.json();

      if (!response.ok) {
        if (jsonResponse.status === "error") {
          return jsonResponse.message;
        }
        return null;
      }

      if (jsonResponse.status === "ok") {
        return jsonResponse.data;
      } else {
        Logger.error("API Error: " + jsonResponse.message);
        return jsonResponse.message;
      }
    } catch (error) {
      Logger.error("There has been a problem with your fetch operation:", error);
      throw error;
    }
  };

  const value: RequestState = { sendRequest };

  return (
    <RequestContext.Provider value={value}>
      {children}
    </RequestContext.Provider>
  );
};
