package artifacts

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var ErrUnsafePath = errors.New("unsafe artifact path")

type Store struct {
	root string
}

type Target struct {
	WorkID    string
	TaskID    string
	StageID   string
	AttemptID string
}

type File struct {
	Target  Target
	Name    string
	Content []byte
}

type WrittenFile struct {
	URI     string `json:"uri"`
	RelPath string `json:"rel_path"`
	Size    int64  `json:"size"`
}

func New(root string) *Store {
	root = strings.TrimSpace(root)
	if root == "" {
		root = "artifacts/current"
	}
	if abs, err := filepath.Abs(root); err == nil {
		root = abs
	}
	return &Store{root: root}
}

func (s *Store) Root() string {
	if s == nil {
		return ""
	}
	return s.root
}

func (s *Store) WriteEvidenceFile(file File) (WrittenFile, error) {
	segments, err := targetSegments(file.Target)
	if err != nil {
		return WrittenFile{}, err
	}
	segments = append(segments, "evidence", file.Name)
	return s.write(segments, file.Content)
}

func (s *Store) WriteAttemptFile(file File) (WrittenFile, error) {
	segments, err := targetSegments(file.Target)
	if err != nil {
		return WrittenFile{}, err
	}
	if file.Target.AttemptID == "" {
		return WrittenFile{}, fmt.Errorf("%w: attempt_id is required", ErrUnsafePath)
	}
	segments = append(segments, file.Name)
	return s.write(segments, file.Content)
}

func (s *Store) write(segments []string, content []byte) (WrittenFile, error) {
	if s == nil || s.root == "" {
		return WrittenFile{}, errors.New("artifact root is not configured")
	}
	for _, segment := range segments {
		if err := validateSegment(segment); err != nil {
			return WrittenFile{}, err
		}
	}

	root, err := filepath.Abs(s.root)
	if err != nil {
		return WrittenFile{}, err
	}

	fullPath := filepath.Join(append([]string{root}, segments...)...)
	relPath, err := filepath.Rel(root, fullPath)
	if err != nil {
		return WrittenFile{}, err
	}
	if relPath == "." || strings.HasPrefix(relPath, ".."+string(filepath.Separator)) || filepath.IsAbs(relPath) {
		return WrittenFile{}, fmt.Errorf("%w: %s", ErrUnsafePath, relPath)
	}

	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return WrittenFile{}, err
	}

	handle, err := os.OpenFile(fullPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return WrittenFile{}, err
	}
	defer handle.Close()

	n, err := handle.Write(content)
	if err != nil {
		return WrittenFile{}, err
	}

	return WrittenFile{
		URI:     "artifact://current/" + filepath.ToSlash(relPath),
		RelPath: filepath.ToSlash(relPath),
		Size:    int64(n),
	}, nil
}

func targetSegments(target Target) ([]string, error) {
	if target.WorkID == "" {
		return nil, fmt.Errorf("%w: work_id is required", ErrUnsafePath)
	}
	segments := []string{"work", target.WorkID}
	if target.TaskID != "" {
		segments = append(segments, "tasks", target.TaskID)
	}
	if target.StageID != "" {
		segments = append(segments, "stages", target.StageID)
	}
	if target.AttemptID != "" {
		segments = append(segments, "attempts", target.AttemptID)
	}
	return segments, nil
}

func validateSegment(segment string) error {
	if segment == "" {
		return fmt.Errorf("%w: empty segment", ErrUnsafePath)
	}
	if filepath.IsAbs(segment) {
		return fmt.Errorf("%w: absolute segment", ErrUnsafePath)
	}
	if strings.ContainsAny(segment, `/\`) {
		return fmt.Errorf("%w: segment contains separator", ErrUnsafePath)
	}
	clean := filepath.Clean(segment)
	if clean != segment || clean == "." || clean == ".." {
		return fmt.Errorf("%w: invalid segment", ErrUnsafePath)
	}
	return nil
}
