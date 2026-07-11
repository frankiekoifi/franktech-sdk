# @franktech/sdk

<div align="center">
  <p><strong>AI-powered error monitoring for your applications</strong></p>
  <p>One-line setup. Automatic error capture. AI-powered analysis.</p>
</div>

---

## Features

- 🔍 **Automatic Error Capture** - Unhandled rejections, global errors, console.error
- 🤖 **AI-Powered Analysis** - Get root cause and suggested fixes
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
  endpoint: 'https://api.franktechspace.dev'
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
## React Integration
```javascript
import { useFrankTech } from '@franktech/sdk';

function App() {
  const monitor = useFrankTech({
    apiKey: 'ft_your_api_key',
    endpoint: 'https://api.franktechspace.dev'
  });
  
  // Use monitor anywhere in your component
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
  endpoint: 'https://api.franktechspace.dev'
});

app.use(franktechMiddleware(monitor));
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **Required** | Your FrankTech API key |
| `endpoint` | `string` | `https://api.franktechspace.dev` | API endpoint URL |
| `environment` | `string` | `production` | Environment name |
| `release` | `string` | `unknown` | Release version |
| `enabled` | `boolean` | `true` | Enable/disable monitoring |
| `captureConsole` | `boolean` | `true` | Capture console.error calls |
| `batchSize` | `number` | `10` | Max errors per batch |
| `flushInterval` | `number` | `3000` | Flush interval in ms |
| `user` | `object` | `null` | User context for error tracking |

**Example:**

```javascript
new FrankTechClient({
  apiKey: 'your-key',
  environment: 'production',
  user: { id: 'user-123', email: 'user@example.com' }
});

```

## License
MIT © Francis Ochieng