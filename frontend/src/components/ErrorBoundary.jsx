import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-6 text-center">
          <div className="max-w-md space-y-6">
            <span className="material-symbols-outlined text-6xl text-error">error</span>
            <h1 className="text-3xl font-bold font-headline">عذراً، حدث خطأ ما</h1>
            <p className="text-on-surface-variant">نعتذر عن الإزعاج. يرجى محاولة إعادة تحميل الصفحة أو التواصل مع الدعم الفني.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 academic-gradient text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
