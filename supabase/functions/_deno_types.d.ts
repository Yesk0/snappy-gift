// Minimal Deno type declarations for VS Code IntelliSense without the Deno extension.
// These types are only used for IDE support — actual runtime types come from the Deno runtime.

declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
  function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}
