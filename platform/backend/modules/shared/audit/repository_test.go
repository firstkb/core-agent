package eventsvc

import (
	"strconv"
	"strings"
	"testing"
)

func TestInsertEventQueryPlaceholderCountMatchesArguments(t *testing.T) {
	const want = 12
	for i := 1; i <= want; i++ {
		if !strings.Contains(insertEventQuery, "$"+strconv.Itoa(i)) {
			t.Fatalf("insertEventQuery missing placeholder $%d: %s", i, insertEventQuery)
		}
	}
	if strings.Contains(insertEventQuery, "$13") {
		t.Fatalf("insertEventQuery unexpectedly contains placeholder $13: %s", insertEventQuery)
	}
}
