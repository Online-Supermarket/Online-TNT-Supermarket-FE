/**
 * Minimal full-page loading spinner.
 * Shown while authentication state is being restored on browser refresh.
 */
export default function LoadingSpinner() {
  return (
    <div className="loading-spinner-overlay" aria-busy="true" aria-label="Loading">
      <div className="loading-spinner" />
    </div>
  );
}
