# @franktech/sdk

<div align="center">
  <p><strong>AI-powered error monitoring for your applications</strong></p>
  <p>One-line setup. Automatic error capture. AI-powered analysis. Session replay.</p>
</div>

---

## Features

- 🔍 **Automatic Error Capture** - Unhandled rejections, global errors, console.error
- 🤖 **AI-Powered Analysis** - Get root cause and suggested fixes
- 🎬 **Session Replay** - Watch what users did before an error
- 📊 **Performance Monitoring** - Track API response times and page load metrics
- 🚀 **One-Line Setup** - Start monitoring in seconds
- 📊 **Beautiful Dashboard** - Visualize errors and insights
- 🔑 **API Key Authentication** - Secure server-side integration
- ⚡ **Lightweight** - <5KB minified

---

## Installation

```bash
npm install @franktech/sdk
```
## Quick Start

```javascript
import FrankTech from '@franktech/sdk';

const monitor = new FrankTech({
  apiKey: 'ft_your_api_key_here',
  endpoint: 'https://franktech-api.franktechspace.dev'
});

// Errors are automatically captured!
// Unhandled rejections, global errors, console.error all captured.
```
## Manual Error Capture

```javascript
try {
  // risky code
} catch (error) {
  monitor.captureError(error, {
    severity: 'critical',
    metadata: { userId: 123, action: 'checkout' }
  });
}
```
## Session Replay

```javascript
const monitor = new FrankTech({
  apiKey: 'ft_your_api_key',
  endpoint: 'https://franktech-api.franktechspace.dev',
  enableReplay: true,
  replaySampleRate: 0.5,        // Record 50% of sessions
  replayMaskInputs: true,        // Mask sensitive input fields
  replayBlockClass: 'franktech-block' // CSS class to block recording
});

// Replay data is automatically attached to errors
```
## Performance Monitoring

```javascript
const monitor = new FrankTech({
  apiKey: 'ft_your_api_key',
  endpoint: 'https://franktech-api.franktechspace.dev',
  enablePerformance: true,
  performanceSampleRate: 1.0,
  slowRequestThreshold: 500 // ms
});

// Tracks:
// - API call durations
// - Page load metrics (TTFB, FCP, LCP)
// - Long tasks (>50ms)
```
## React Integration

```javascript
import { useFrankTech } from '@franktech/sdk';

function App() {
  const monitor = useFrankTech({
    apiKey: 'ft_your_api_key',
    endpoint: 'https://franktech-api.franktechspace.dev'
  });
  
  const handleClick = () => {
    try {
      // risky code
    } catch (error) {
      monitor.captureError(error);
    }
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

## Express.js Middleware

```javascript
import FrankTech, { franktechMiddleware } from '@franktech/sdk';

const monitor = new FrankTech({
  apiKey: 'ft_your_api_key',
  endpoint: 'https://franktech-api.franktechspace.dev'
});

app.use(franktechMiddleware(monitor));
```

## Vue Plugin
```javascript
import { createFrankTechVuePlugin } from '@franktech/sdk';

const app = createApp(App);
app.use(createFrankTechVuePlugin({
  apiKey: 'ft_your_api_key',
  endpoint: 'https://franktech-api.franktechspace.dev'
}));
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | **Required** | Your FrankTech API key |
| `endpoint` | string | `https://franktech-api.franktechspace.dev` | API endpoint URL |
| `environment` | string | `production` | Environment name |
| `release` | string | `unknown` | Release version |
| `enabled` | boolean | `true` | Enable/disable monitoring |
| `captureConsole` | boolean | `true` | Capture console.error calls |
| `batchSize` | number | `10` | Max errors per batch |
| `flushInterval` | number | `3000` | Flush interval in ms |
| `user` | object | `null` | User context for error tracking |

### Session Replay Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableReplay` | boolean | `true` | Enable/disable session replay |
| `replaySampleRate` | number | `1.0` | Percentage of sessions to record (0-1) |
| `replayMaskInputs` | boolean | `true` | Mask sensitive input fields |
| `replayBlockClass` | string | `franktech-block` | CSS class to block recording |
| `replayMaxDuration` | number | `60000` | Max recording duration in ms |

### Performance Monitoring Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enablePerformance` | boolean | `false` | Enable/disable performance monitoring |
| `performanceSampleRate` | number | `0.5` | Percentage of requests to track (0-1) |
| `slowRequestThreshold` | number | `1000` | Threshold for slow requests in ms |

## API Reference
captureError(error, context)
Manually capture an error with optional context.

```javascript
monitor.captureError(new Error('Something went wrong'), {
  severity: 'critical',
  metadata: { userId: 123 }
});
```
**setUser(user)**
Set user context for tracking.

```javascript
monitor.setUser({ id: 'user-123', email: 'user@example.com' });
```
**flush()**
Force send all queued errors.

```javascript
await monitor.flush();
```
**destroy()**
Clean up and stop monitoring.

```javascript
monitor.destroy();
```
## License
MIT © Francis Ochieng