# UI Package Instructions

## shadcn Components and Stories

When adding a shadcn component to this package, also add or adapt its matching Storybook story from Lloyd Richards' registry.

- Run shadcn commands from `packages/ui`, where `components.json` defines the `@storybook` registry.
- Add the shadcn component first with `vpx shadcn add COMPONENT`.
- Then preview the matching story with `vpx shadcn add @storybook/COMPONENT-story --dry-run`.
- Do not blindly apply the story registry item if the dry run would overwrite an existing component file. Prefer adapting only the generated `*.stories.tsx` content.
- Keep stories colocated with components under `src/components`, using names like `button.stories.tsx`.
- After adding or adapting a component story, run `vp check` and any relevant Storybook or build checks.
