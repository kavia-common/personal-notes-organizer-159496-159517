# Angular Notes Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:3000/` (port is set in angular.json). The application will automatically reload whenever you modify any of the source files.

## Runtime configuration

The app supports runtime configuration via `public/assets/env.js`. By default we include:

```js
window.__env = window.__env || {};
window.__env.NOTES_API_BASE_URL = '';
```

- Set `NOTES_API_BASE_URL` to your backend API base URL (e.g., `https://api.example.com`) to enable REST persistence.
- Leave it empty to use localStorage for all notes.

You can also set an environment variable for SSR deployments:
- `NOTES_API_BASE_URL` (same semantics as above).

See `.env.example` for reference.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory.

## Tests

Run unit tests with:

```bash
ng test
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
