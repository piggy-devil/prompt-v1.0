"use client";

import { Card } from "@/components/ui/card";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

type FallbackRender = (args: { error: Error; reset: () => void }) => ReactNode;

interface Props {
  children: ReactNode;
  /** UI ตกแต่งตอน error (component หรือฟังก์ชันก็ได้) */
  fallback?: ReactNode | FallbackRender;
  /** เรียกเมื่อ reset */
  onReset?: () => void;
  /** ถ้า key เหล่านี้เปลี่ยน ให้เคลียร์ error อัตโนมัติ */
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error?: Error;
  /** ใช้บังคับ re-mount children */
  version: number;
}

function shallowEqual(a?: unknown[], b?: unknown[]) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, version: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    // TODO: ส่งไป error monitoring ที่คุณใช้ เช่น Sentry
  }

  componentDidUpdate(prevProps: Props) {
    if (!shallowEqual(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  private reset = () => {
    this.props.onReset?.();
    this.setState((s) => ({
      hasError: false,
      error: undefined,
      version: s.version + 1, // บังคับ re-mount children
    }));
  };

  private renderDefaultFallback() {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          {this.state.error?.message || "An unexpected error occurred"}
        </p>
        {process.env.NODE_ENV !== "production" && this.state.error && (
          <details className="mx-auto mb-4 max-w-prose text-left whitespace-pre-wrap text-xs text-muted-foreground">
            {String(this.state.error.stack || this.state.error.message)}
          </details>
        )}
        <Button onClick={this.reset}>Try again</Button>
      </Card>
    );
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === "function") {
        return (fallback as FallbackRender)({
          error: this.state.error!,
          reset: this.reset,
        });
      }
      return fallback ?? this.renderDefaultFallback();
    }

    // ใช้ key เพื่อ re-mount children ตอน reset
    return <div key={this.state.version}>{this.props.children}</div>;
  }
}
