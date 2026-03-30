package authsvc

import "time"

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

type IssuedTokens struct {
	AccessToken      string
	RefreshToken     string
	RefreshExpiresAt time.Time
	ExpiresIn        int
}

func (t *IssuedTokens) PublicResponse() *TokenResponse {
	if t == nil {
		return nil
	}
	return &TokenResponse{
		AccessToken: t.AccessToken,
		ExpiresIn:   t.ExpiresIn,
	}
}

type CleanupExpiredTokensRequest struct{}

type CleanupExpiredRefreshTokensRequest struct{}
