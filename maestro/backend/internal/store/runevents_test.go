package store

import "testing"

func TestMarshalStateDefaultsToObject(t *testing.T) {
	body, err := marshalState(nil)
	if err != nil {
		t.Fatalf("marshal state: %v", err)
	}
	if string(body) != `{}` {
		t.Fatalf("body = %s, want {}", body)
	}
}

func TestAppendRunEventRequiresActorAndCommand(t *testing.T) {
	err := AppendRunEvent(t.Context(), nil, RunEvent{})
	if err == nil {
		t.Fatal("expected validation error")
	}
}
