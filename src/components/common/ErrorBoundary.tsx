/**
 * 通用错误边界:捕获子树渲染异常,展示降级 UI,不影响外层布局。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
  name?: string
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 开发环境下打印,方便排查
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[ErrorBoundary:${this.props.name ?? 'default'}]`, error, info)
    }
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.retry)
      return (
        <div className="flex h-full w-full items-center justify-center bg-cryo-950 p-4">
          <div className="cc-glass max-w-sm rounded-xl px-5 py-4 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <div className="font-mono text-sm font-semibold text-slate-200">
              {this.props.name ?? '组件'}加载异常
            </div>
            <div className="mt-1 line-clamp-2 font-mono text-[11px] text-slate-400">
              {this.state.error.message}
            </div>
            <button
              onClick={this.retry}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-frost/20 px-3 py-1.5 text-xs font-mono text-frost transition hover:bg-frost/30"
            >
              <RefreshCcw className="h-3 w-3" />
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
