# Adding a Module

Use `raven add` to install a new module into the project.

## Command

```bash
raven add <module-name>
```

## Automatic dependency resolution

`raven add` resolves module dependencies automatically. For example, `raven add jtd-validator` will install `core` first if it is not already present.

## Output

On success, the command returns JSON with a `modifiedFiles` field listing every file that was created or updated. Inspect those paths to confirm the module landed in the right location.

## After adding

**1. Confirm installation**

Run `raven status` and verify the module appears in `modules` with `installed: true`.

**2. Check and install package dependencies**

The `raven add` output includes a `dependencies` field listing the packages the module requires. Cross-reference this list against the user's `package.json`:

- For each dependency, check whether it appears in `dependencies` or `devDependencies` and whether the installed version satisfies the required range.
- If any dependency is missing or out of range, detect the project's package manager and run the appropriate install/update command.

**3. Learn the module API**

Follow [Learning a module](./learn-module.md) to study the API before writing code.
