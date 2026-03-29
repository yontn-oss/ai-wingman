# Templates

Each file in this directory owns the *content* of what gets written to the user's project.

- Edit a template file to change what generated code looks like.
- Edit the corresponding generator file (`src/generators/`) to change the logic that decides which template vars to pass.

Convention: one template file per generator. Template files export a `*Template(vars)` function and a `*Vars` interface.
