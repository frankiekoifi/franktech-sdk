import * as rrweb from "rrweb";

class FrankTech {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("FrankTech: API key is required");
    }

    this.apiKey = config.apiKey;
    this.endpoint =
      config.endpoint || "https://franktech-api.franktechspace.dev";
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

    this.enableReplay = config.enableReplay !== false;
    this.replaySampleRate = config.replaySampleRate || 1.0;
    this.replayMaskInputs = config.replayMaskInputs !== false;
    this.replayBlockClass = config.replayBlockClass || "franktech-block";
    this.replayMaxDuration = config.replayMaxDuration || 60000;
    this.replayEvents = [];
    this.replayRecording = false;
    this.replayStopFn = null;

    if (this.enabled) {
      this.setupGlobalHandlers();
      this.startBackgroundFlush();
      if (this.enableReplay && typeof window !== "undefined") {
        this.initReplayRecording();
      }
    }
  }

  setUser(user) {
    this.user = user;
  }

  async initReplayRecording() {
    if (this.replayRecording || !this.enableReplay) return;
    if (Math.random() > this.replaySampleRate) return;

    try {
      this.replayRecording = true;
      this.replayEvents = [];

      this.replayStopFn = rrweb.record({
        emit: (event) => {
          this.replayEvents.push(event);
          if (this.replayEvents.length > 2000) {
            this.replayEvents.shift();
          }
        },
        maskAllInputs: this.replayMaskInputs,
        blockClass: this.replayBlockClass,
      });

      setTimeout(() => {
        this.stopReplayRecording();
      }, this.replayMaxDuration);
    } catch (err) {
      console.warn("FrankTech: Failed to initialize session replay:", err);
      this.replayRecording = false;
    }
  }

  stopReplayRecording() {
    if (this.replayStopFn) {
      this.replayStopFn();
      this.replayStopFn = null;
    }
    this.replayRecording = false;
  }

  getReplayData() {
    if (!this.enableReplay || this.replayEvents.length === 0) {
      return null;
    }

    const now = Date.now();
    const cutoff = now - 30000;
    const recentEvents = this.replayEvents.filter((e) => e.timestamp > cutoff);

    if (recentEvents.length === 0) return null;

    return {
      events: recentEvents,
      startTimestamp: recentEvents[0]?.timestamp || now,
      endTimestamp: recentEvents[recentEvents.length - 1]?.timestamp || now,
    };
  }

  getReplayEvents() {
    return this.replayEvents;
  }

  clearReplayEvents() {
    this.replayEvents = [];
  }

  isReplayEnabled() {
    return this.enableReplay;
  }

  isReplayRecording() {
    return this.replayRecording;
  }

  captureError(error, context = {}) {
    if (!this.enabled) return;

    let replayData = null;
    if (this.enableReplay && this.replayRecording) {
      replayData = this.getReplayData();
      this.stopReplayRecording();
      setTimeout(() => {
        this.initReplayRecording();
      }, 1000);
    }

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
      session_replay: replayData,
      created_at: new Date().toISOString(),
    };

    this.enqueue(errorData);

    if (this.onError) {
      this.onError(errorData);
    }
  }

  enqueue(errorData) {
    this.queue.push(errorData);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);

    try {
      const response = await fetch(`${this.endpoint}/api/v1/errors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.warn("FrankTech: Failed to send errors:", response.status);
        setTimeout(() => {
          this.queue = [...batch, ...this.queue];
        }, 5000);
      }
    } catch (err) {
      console.warn("FrankTech: Network error, events queued for retry");
      this.queue = [...batch, ...this.queue];
    }
  }

  setupGlobalHandlers() {
    if (typeof window === "undefined") return;

    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, { severity: "error" });
    });

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

  startBackgroundFlush() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  destroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.stopReplayRecording();
    this.flush();
  }
}

export function useFrankTech(config) {
  const [monitor] = React.useState(() => new FrankTech(config));
  React.useEffect(() => {
    return () => monitor.destroy();
  }, []);
  return monitor;
}

export function franktechMiddleware(monitor) {
  return (req, res, next) => {
    const start = Date.now();
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
