package collectiontable

import "errors"

var ErrInvalidQuery = errors.New("collection table invalid query")

var ErrExportLimitExceeded = errors.New("collection table export limit exceeded")
