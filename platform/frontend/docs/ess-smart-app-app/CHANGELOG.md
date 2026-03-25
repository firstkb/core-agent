# Change Log

This is change log for [ess-smart-app](https://github.com/esafesys-eng/ess-smart-app/) project.

## 1.1.12
Release on Feb 12, 2026

### Added
* Added scrolling to the `Login` page and corrected form centering on small screens.

## 1.1.11
Release on Nov 14, 2025

### Added
* Added output of messages for different levels for each tenant separately from the file /client/message.json for Login page.

### Fixed
* Fixing Authorization Blocking
* Fixing background color for login form

## 1.1.10
Release on Sep 3, 2025

### Added
* Login: added auth-error banner with `Trouble with Signin?` modal ETS iframe.

## 1.1.9
Release on July 18, 2025

### Added
* Login panel now displays a “TEST VERSION” watermark when running in the development environment (`env === 'dev'`)

## 1.1.8
Release on July 9, 2025

### Fixed
* Improved control over tokens in `AuthProvider`. Added check for getting `custom:user_id` from IdToken.

## 1.1.7
Release on Jun 6, 2025

### Changed
* The main menu output has been changed

### Fixed
* minor edits to the `Tutorial` page.

## 1.1.5
Release on Jun 6, 2025

### Changed
* changed color for client

## 1.1.4
Release on May 29, 2025

### Changed
* link to open pdf file

## 1.1.3
Release on May 15, 2025

### Added
* Added a separate page `Tutorials` to display all video tutorials
* Text has been added to the forms near the button for viewing Video tutorial

## 1.1.2
Release on May 06, 2025

### Changed
* changed style DrawerComponent

### Added
* `buildNodules` support part `S`

## 1.1.1
Release on April 28, 2025

### Fixed
* Logic for redirect to `/web` and return.
* theme border card
* list menu order

## 1.1.0
Release on April 28, 2025

### Changed
* changed style file for outputting card as in ShareApp
* changed `dashboard` output and style
* `ClientConfig` - if there are no forms for PWA or the application opens on desctop, then `web app` opens

### Added
* added `buildModule` - a single tool for generating links for ShareApp and PWA
* added the ability to request to `web-api`
* added hook `useIsDesctop` to determine opening on Desctop
* for `Form DB` added the ability to output count From from PageId

## 1.0.35
Release on April 25, 2025

### Changed
* Changed output of `Share link` list

## 1.0.34
Release on April 24, 2025

### Changed
* changed variable `apiUrl` to `appApiUrl`

## 1.0.32
Released on April 21, 2025

### Fixed
* Logic for form `Finish`.

## 1.0.31
Released on April 17, 2025

### Added
* Added video tutorial in forms, we get in `/profile` array `help`

### Changed
* If the status of any form contains `Complete...` the form is considered to have pressed the `Finish` button.

## 1.0.30

Released on April 16, 2025

### Changed
* Modify caching logic for manifest, config and client/config files

## 1.0.28

Released on April 16, 2025

### Changed
* Changed onSubmit function in `Edit.tsx` to handle status which contains `Complete` in its name

### Added
* Added caching logic for config files

## 1.0.27

Released on March 26, 2025

### Changed
* Updated company logo.
* Auto-fill form logic changed, default is false

### Added
* Created VideoModal component for displaying video tutorials
* On the Login page, a video tutorial and qrcode have been added

## 1.0.26

Released on March 22, 2025

### Added
* Stopped syncing file after 2 attempts
* Changed data synchronization, implemented additional check for duplicate records

## 1.0.25

Released on March 15, 2025

### Added
* Vite.config added exceptions for the /app folder
* Allow photo synchronization if the form is not in the IndexDB

## 1.0.24

Released on February 24, 2025

### Changes
* Merged menus **PWA** and **Share App**.
* Adjusted opacity of **Share App** menu items based on online status.

## 1.0.23

Released on February 21, 2025

### Added
* **Conditional Display**: Main `Add Image` button is hidden in SOR type forms and an icon-only camera button is added to the top of the form.
* **Loading Spinner**: Camera icon switches to a spinner during file uploads.

### Fixed
* Converted lastLogEntry to string if it is an object in SyncStatus

## 1.0.22

Released on February 21, 2025

### Fixed
* E-mail to lower case in auth


## 1.0.21

Released on February 19, 2025

### Fixed
* Updated date handling to format by using `toLocaleDateString("en-US")`.

## 1.0.20

Released on February 4, 2025

### Fixed
* Improved and optimized **markerjs2** library functionality for mobile devices.

## 1.0.19

Released on January 31, 2025

### Added
* Integrated the **markerjs2** library.
* Introduced an image editing interface powered by **markerjs2**, allowing users to annotate and modify images.

## 1.0.18

Released on January 31, 2025

### Changed
* Updated logo size.
* Renamed the lookup field filter to "Categories Filter".

## 1.0.17

Released on January 30, 2025

### Added
* When creating a new record, any change in a form field is now immediately saved to the IndexedDB database, and the URL is updated accordingly

## 1.0.16

Released on January 29, 2025

### Added
* Implemented fetching of available Share App links for the user in the `/profile` section.
* Menu now dynamically displays Share App links retrieved during data exchange.
* Added "Filter for categories" to "lookup" fields for narrowing down the list.
* Enabled lazy loading for all fields working with dictionaries during scrolling.

### Fixed
* Resolved an issue with first-level forms containing "Corrective Action" (CA). The "Submit" button no longer includes the CA form in validation.

## 1.0.15

Released on January 22, 2025

### Added
* Introduced a settings page with a new feature for configuring auto-fill for fields.
* Added auto-fill functionality for first-level fields in any form (when creating a new record).
* Added a menu option to navigate to "Share App".

## 1.0.14

Released on January 16, 2025

### Added
* Implemented dynamic replacement of `manifest.json`, which is now fetched from S3: `/{tenant_id}/manifest.json`.

## 1.0.13

Released on January 13, 2025

### Changed
* Updated manifest theme color.

## 1.0.12

Released on January 13, 2025

### Added
* Implemented tenant-specific branding.
* Introduced a `/client/style.css` file to define the primary color for branding.

## 1.0.11

### Changed
* Updated the footer layout for the "Corrective Action" form.
* Modified the mechanism for the "Save" button functionality.

## 1.0.10

### Changed
* Removed automatic scroll to invalid field when editing other fields in a form.

## 1.0.9

### Changed
* Hiding the PDF button if the record is newly created and not yet synchronized with the server.

## 1.0.8

### Added
* Introduced the `Validation` parameter for each form:
  * Forms can now be partially filled and resumed later, but they will not synchronize until all required fields are completed.
* Added a red exclamation mark next to a form entry in the table if `Validation = false`.
* Added a synchronization icon next to each row. If the row encounters two synchronization errors, the icon changes to red.
* Added the `isValid` parameter to the `Form` type.

### Changed
* Enabled the `Edit` button for forms that have either failed synchronization twice or do not pass validation.
* After editing a form, synchronization errors are cleared, and the form will retry synchronization.

### Updated
* Upgraded the IndexedDB database version and added a new index to support synchronization.

## 1.0.7

### Added
* Displayed information about the user's title

### Changed
* made changes to the user model

## 1.0.6

### Removed
* Error list display above the form.

### Changed
* Updated error display to show directly below the relevant field.

## 1.0.5

### Changed
* Refactored the widget for dictionarys:
  * Improved filtering functionality.
  * Added display of additional information.
  * Implemented input delay for dictionary with over 10,000 items.

### Added
* Post-processing of dictionary in the user profile.
* Stopped synchronization for individual forms after two consecutive errors.

## 1.0.4

Released on October 29, 2024

### Changed
* Renamed "Sync Table" section to "Sync Status".
* Added output for:
  * Photo upload
  * Support request
  * Unsynchronized items.

### Added
* Added two sync attempts for Form before stopping further synchronization on error.


## 1.0.0

Released on October 15, 2024

### Added

* First version of ess-smart-app
  * Documentation README
  * License
  * Change Log