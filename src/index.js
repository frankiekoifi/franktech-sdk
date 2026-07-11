// FrankTech SDK - Main entry point

class FrankTech {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("FrankTech: API key is required");
    }

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "https://api.franktechspace.dev";
    this.environment = config.environment || "production";
    this.release = config.release || "unknown";
    this.enabled = config.enabled !== false;
    this.captureConsole = config.captureConsole !== false;
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 3000;

    this.queue = [];
    this.flushTimer = null;
    this.user = config.user || null;
    this.onError = config.onError || null;

    if (this.enabled) {
      this.setupGlobalHandlers();
      this.startBackgroundFlush();
    }
  }

  // Set user context
  setUser(user) {
    this.user = user;
  }

  // Capture error manually
  captureError(error, context = {}) {
    if (!this.enabled) return;

    const errorData = {
      type: error.name || "Error",
      message: error.message || String(error),
      stack_trace: error.stack,
      severity: context.severity || "error",
      url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      environment: this.environment,
      release_version: this.release,
      user_id: this.user?.id,
      user_email: this.user?.email,
      extra_data: context.metadata || {},
      created_at: new Date().toISOString(),
    };

    this.enqueue(errorData);

    // Call custom error handler if provided
    if (this.onError) {
      this.onError(errorData);
    }
  }

  // Queue error for sending
  enqueue(errorData) {
    this.queue.push(errorData);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  // Send errors to FrankTech API
  async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);

    try {
      const response = await fetch(`${this.endpoint}/api/v1/errors/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.warn("FrankTech: Failed to send errors:", response.status);
        // Re-queue on failure
        setTimeout(() => {
          this.queue = [...batch, ...this.queue];
        }, 5000);
      }
    } catch (err) {
      console.warn("FrankTech: Network error, events queued for retry");
      // Re-queue
      this.queue = [...batch, ...this.queue];
    }
  }

  // Setup global error handlers
  setupGlobalHandlers() {
    if (typeof window === "undefined") return;

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, { severity: "error" });
    });

    // Global errors
    window.addEventListener("error", (event) => {
      this.captureError(event.error || new Error(event.message), {
        severity: "error",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Console errors
    if (this.captureConsole) {
      const originalError = console.error;
      console.error = (...args) => {
        const error =
          args.find((a) => a instanceof Error) ||
          new Error(args.map(String).join(" "));
        this.captureError(error, { severity: "error" });
        originalError.apply(console, args);
      };
    }
  }

  // Start background flush
  startBackgroundFlush() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  // Clean up
  destroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flush();
  }
}

// React Hook (optional)
export function useFrankTech(config) {
  const [monitor] = React.useState(() => new FrankTech(config));
  React.useEffect(() => {
    return () => monitor.destroy();
  }, []);
  return monitor;
}

// Express middleware
export function franktechMiddleware(monitor) {
  return (req, res, next) => {
    const start = Date.now();

    // Store original end
    const originalEnd = res.end;

    res.end = function (...args) {
      const duration = Date.now() - start;

      if (res.statusCode >= 400) {
        monitor.captureError(
          new Error(`${req.method} ${req.path} - ${res.statusCode}`),
          {
            severity: res.statusCode >= 500 ? "error" : "warning",
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              duration,
              query: req.query,
              ip:
                req.ip ||
                req.headers["x-forwarded-for"] ||
                req.connection?.remoteAddress,
            },
          },
        );
      }

      originalEnd.apply(this, args);
    };

    next();
  };
}

// Vue plugin (optional)
export function createFrankTechVuePlugin(config) {
  return {
    install(app) {
      const monitor = new FrankTech(config);
      app.config.globalProperties.$franktech = monitor;

      app.mixin({
        errorCaptured(err, vm, info) {
          monitor.captureError(err, {
            severity: "error",
            metadata: {
              component: vm?.$options?.name || "unknown",
              info,
            },
          });
          return false;
        },
      });
    },
  };
}

export default FrankTech;
