import React, { Component, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      stack: "",
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({
      stack: info?.componentStack || "",
    });
    console.error("App render error:", error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-rose-400/30 bg-rose-950/40 p-5 shadow-2xl">
          <div className="mb-3 text-xs font-extrabold tracking-[0.22em] text-rose-300">APP ERROR</div>
          <h1 className="mb-3 text-2xl font-black">앱 실행 중 오류가 발생했습니다</h1>
          <p className="mb-4 text-sm font-medium text-rose-100/90">
            아래 오류 내용을 기준으로 바로 수정할 수 있습니다.
          </p>
          <div className="overflow-auto rounded-2xl bg-black/40 p-4 text-sm text-rose-100">
            <div className="whitespace-pre-wrap break-all font-bold">
              {String(this.state.error?.message || this.state.error)}
            </div>
            {this.state.stack ? (
              <div className="mt-4 whitespace-pre-wrap text-xs text-rose-100/80">
                {this.state.stack}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
