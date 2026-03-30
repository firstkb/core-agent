package authsvc

import (
	"testing"
	"time"

	"dtriton.com/platform/backend/internal/platform/auth"
)

func TestFindMatchingOTPAcceptsAnyActiveCodeInWindow(t *testing.T) {
	oldHash, err := auth.HashOTP("111111")
	if err != nil {
		t.Fatalf("HashOTP(old): %v", err)
	}
	newHash, err := auth.HashOTP("222222")
	if err != nil {
		t.Fatalf("HashOTP(new): %v", err)
	}

	otps := []*OTP{
		{CodeHash: newHash, CreatedAt: time.Now()},
		{CodeHash: oldHash, CreatedAt: time.Now().Add(-time.Minute)},
	}

	matched, err := findMatchingOTP("111111", otps)
	if err != nil {
		t.Fatalf("findMatchingOTP(old): %v", err)
	}
	if matched == nil {
		t.Fatal("expected old active otp to match")
	}

	matched, err = findMatchingOTP("222222", otps)
	if err != nil {
		t.Fatalf("findMatchingOTP(new): %v", err)
	}
	if matched == nil {
		t.Fatal("expected latest active otp to match")
	}
}

func TestFindMatchingOTPReturnsNilForInvalidCode(t *testing.T) {
	hash, err := auth.HashOTP("333333")
	if err != nil {
		t.Fatalf("HashOTP: %v", err)
	}

	matched, err := findMatchingOTP("999999", []*OTP{{CodeHash: hash}})
	if err != nil {
		t.Fatalf("findMatchingOTP: %v", err)
	}
	if matched != nil {
		t.Fatal("expected invalid code to return no match")
	}
}
