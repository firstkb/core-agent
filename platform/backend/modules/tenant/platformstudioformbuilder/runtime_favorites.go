package platformstudioformbuilder

import (
	"context"
	"net/url"
)

func (s *Service) ToggleRuntimeViewFavorite(
	ctx context.Context,
	modelID string,
	viewID string,
) (*RuntimeViewListFavoriteToggleResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	isFavorite, err := s.repo.ToggleRuntimeFavorite(
		ctx,
		tenant,
		claims.UserID,
		runtimeContext.SurfaceID,
		modelID,
		viewID,
	)
	if err != nil {
		return nil, err
	}

	return &RuntimeViewListFavoriteToggleResponse{IsFavorite: isFavorite}, nil
}

func (s *Service) ListRuntimeFavorites(ctx context.Context) (*RuntimeFavoritesResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	items, err := s.repo.ListRuntimeFavorites(ctx, tenant, claims.UserID)
	if err != nil {
		return nil, err
	}

	out := make([]RuntimeFavoriteShortcut, 0, len(items))
	for _, item := range items {
		out = append(out, RuntimeFavoriteShortcut{
			ID:         item.ID,
			ModelID:    item.ModelID,
			ModelTitle: item.ModelTitle,
			RoutePath:  buildRuntimeViewRoutePath(item.ModelID, item.ViewID),
			TargetType: runtimeViewListSurfacePrefix,
			Title:      item.ViewTitle,
			ViewID:     item.ViewID,
		})
	}

	return &RuntimeFavoritesResponse{Items: out}, nil
}

func buildRuntimeViewRoutePath(modelID string, viewID string) string {
	return "/app/forms/" + url.PathEscape(modelID) + "/views/" + url.PathEscape(viewID)
}
