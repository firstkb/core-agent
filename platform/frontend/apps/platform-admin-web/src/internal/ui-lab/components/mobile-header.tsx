import { CloseIcon, MenuIcon } from "./icons";

type UiLabMobileHeaderProps = {
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function UiLabMobileHeader({ menuOpen, onMenuToggle }: UiLabMobileHeaderProps) {
  return (
    <header className="ui-lab-page__mobile-header">
      <button
        aria-controls="ui-lab-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close UI Lab navigation" : "Open UI Lab navigation"}
        className="ui-lab-page__mobile-menu-button"
        onClick={onMenuToggle}
        type="button"
      >
        {menuOpen ? (
          <CloseIcon className="ui-lab-page__mobile-menu-button-icon" />
        ) : (
          <MenuIcon className="ui-lab-page__mobile-menu-button-icon" />
        )}
      </button>

      <div className="ui-lab-page__mobile-title">UI Lab</div>

      <div aria-hidden="true" className="ui-lab-page__mobile-header-spacer" />
    </header>
  );
}
