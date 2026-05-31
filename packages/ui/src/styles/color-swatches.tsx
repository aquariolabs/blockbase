import { Check, Clipboard } from "lucide-react";
import * as React from "react";

type ColorSwatchContextValue = {
  values: Record<string, string>;
};

const ColorSwatchContext = React.createContext<ColorSwatchContextValue>({
  values: {},
});

export function ColorSwatch({ children }: { children: React.ReactNode }) {
  const swatchRef = React.useRef<HTMLDivElement>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const swatch = swatchRef.current;

    if (!swatch) {
      return;
    }

    const styles = getComputedStyle(swatch);
    const tokens = Array.from(swatch.querySelectorAll<HTMLElement>("[data-color-token]"));

    setValues(
      Object.fromEntries(
        tokens.map((token) => {
          const name = token.dataset.colorToken || "";
          return [name, styles.getPropertyValue(`--${name}`).trim()];
        }),
      ),
    );
  }, []);

  return (
    <ColorSwatchContext.Provider value={{ values }}>
      <div ref={swatchRef} className="not-prose grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </ColorSwatchContext.Provider>
  );
}

export function ColorSwatchItem({
  description,
  foreground,
  name,
}: {
  description?: string;
  foreground?: string;
  name: string;
}) {
  const { values } = React.useContext(ColorSwatchContext);
  const [copied, setCopied] = React.useState(false);
  const variable = `--${name}`;
  const foregroundVariable = foreground ? `--${foreground}` : undefined;
  const value = values[name] || "";
  const copyValue = value ? value : variable;

  React.useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1400);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <div className="grid w-full grid-cols-1 overflow-hidden text-left sm:grid-cols-[minmax(13rem,0.82fr)_1fr]">
      <button
        className="relative flex aspect-square min-h-28 items-end rounded-lg p-4"
        style={{ backgroundColor: `var(${variable})` }}
        type="button"
        data-color-token={name}
        onClick={() => {
          void navigator.clipboard?.writeText(copyValue);
          setCopied(true);
        }}
      >
        <span
          className="absolute top-3 right-3"
          style={{ color: foregroundVariable ? `var(${foregroundVariable})` : undefined }}
        >
          {copied ? (
            <Check className="size-4 text-current" aria-hidden />
          ) : (
            <Clipboard
              className="size-4 text-current opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden
            />
          )}
        </span>
        {foreground ? (
          <span
            className="max-w-48 text-base leading-snug font-bold"
            data-color-token={foreground}
            style={{ color: `var(${foregroundVariable})` }}
          >
            Sample copy
          </span>
        ) : null}
      </button>
      <span className="flex min-w-0 flex-col gap-2 self-center px-4 py-3">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <code className="font-mono text-sm font-semibold tabular-nums">{name}</code>
          {foreground ? (
            <code className="text-muted-foreground font-mono text-xs tabular-nums">
              with {foreground}
            </code>
          ) : null}
        </span>
        {description ? (
          <span className="text-muted-foreground text-sm leading-relaxed">{description}</span>
        ) : null}
      </span>
    </div>
  );
}
