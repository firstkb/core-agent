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

func TestReadURI(t *testing.T) {
	root := t.TempDir()
	store := New(root)

	written, err := store.WriteAttemptFile(File{
		Target: Target{
			WorkID:    "work-1",
			TaskID:    "task-1",
			StageID:   "stage-1",
			AttemptID: "attempt-1",
		},
		Name:    "handoff.json",
		Content: []byte(`{"ok":true}`),
	})
	if err != nil {
		t.Fatalf("write attempt: %v", err)
	}

	read, err := store.ReadURI(written.URI)
	if err != nil {
		t.Fatalf("read artifact: %v", err)
	}
	if string(read.Content) != `{"ok":true}` {
		t.Fatalf("content = %q", string(read.Content))
	}
	if read.ContentType != "application/json" {
		t.Fatalf("content type = %q", read.ContentType)
	}
}

func TestReadURIRejectsTraversal(t *testing.T) {
	store := New(t.TempDir())

	_, err := store.ReadURI("artifact://current/../secret.txt")
	if !errors.Is(err, ErrUnsafePath) {
		t.Fatalf("err = %v, want ErrUnsafePath", err)
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
