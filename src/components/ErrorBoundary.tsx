import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/**
 * Catches render errors so a single bad state never leaves the player staring
 * at a blank screen — they get a message and a reload button instead.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[YourBid] render error:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="screen center" style={{ gap: 18 }}>
          <div className="card stack center" style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 44 }}>😵‍💫</div>
            <h2>Something glitched</h2>
            <p className="muted" style={{ margin: 0 }}>
              The screen hit an unexpected error. Reloading usually fixes it —
              your room stays live.
            </p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
