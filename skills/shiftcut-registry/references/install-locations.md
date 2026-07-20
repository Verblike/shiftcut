# Install Locations

## Default paths

| Item type | Default install path                  | Configured by                    |
| --------- | ------------------------------------- | -------------------------------- |
| Block     | `compositions/<name>.html`            | `shiftcut.json#paths.blocks`     |
| Component | `compositions/components/<name>.html` | `shiftcut.json#paths.components` |

## How path remapping works

The `target` field in each item's `registry-item.json` specifies a default install path. The `add` command remaps the prefix based on `shiftcut.json#paths`:

- Block targets starting with `compositions/` get remapped to `<paths.blocks>/`
- Component targets starting with `compositions/components/` get remapped to `<paths.components>/`

## shiftcut.json

Created automatically by `shiftcut init`. If it doesn't exist when you run `add`, the CLI creates it with defaults:

```json
{
  "$schema": "https://shiftcut.verblike.com/schema/shiftcut.json",
  "registry": "https://raw.githubusercontent.com/Vadagon/shiftcut/main/registry",
  "paths": {
    "blocks": "compositions",
    "components": "compositions/components",
    "assets": "assets"
  }
}
```

## Custom layouts

To install blocks into a `scenes/` directory instead of `compositions/`:

```json
{
  "paths": {
    "blocks": "scenes"
  }
}
```

Then `shiftcut add data-chart` writes to `scenes/data-chart.html` instead of `compositions/data-chart.html`. The snippet output reflects the remapped path.
