package artifacts

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestWriteEvidenceFile(t *testing.T) {
	root := t.TempDir()
	store := New(root)

	written, err := store.WriteEvidenceFile(File{
		Target: Target{
			WorkID: "work-1",
			TaskID: "task-1",
		},
		Name:    "go-test.log",
		Content: []byte("ok"),
	})
	if err != nil {
		t.Fatalf("write evidence: %v", err)
	}

	if written.URI != "artifact://current/work/work-1/tasks/task-1/evidence/go-test.log" {
		t.Fatalf("uri = %q", written.URI)
	}

	body, err := os.ReadFile(filepath.Join(root, "work", "work-1", "tasks", "task-1", "evidence", "go-test.log"))
	if err != nil {
		t.Fatalf("read file: %v", err)
	}
	if string(body) != "ok" {
		t.Fatalf("body = %q", body)
	}
}

func TestWriteRejectsTraversal(t *testing.T) {
	store := New(t.TempDir())

	_, err := store.WriteEvidenceFile(File{
		Target: Target{WorkID: "work-1"},
		Name:   "../secret.txt",
	})
	if !errors.Is(err, ErrUnsafePath) {
		t.Fatalf("err = %v, want ErrUnsafePath", err)
	}
}

func TestWriteAttemptFileRequiresAttempt(t *testing.T) {
	store := New(t.TempDir())

	_, err := store.WriteAttemptFile(File{
		Target: Target{WorkID: "work-1", TaskID: "task-1"},
		Name:   "handoff.json",
	})
	if !errors.Is(err, ErrUnsafePath) {
		t.Fatalf("err = %v, want ErrUnsafePath", err)
	}
}
