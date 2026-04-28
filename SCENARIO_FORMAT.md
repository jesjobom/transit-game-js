# Scenario JSON format

A scenario file is a JSON object with this overall shape:

```json
{
  "id": "my-scenario",
  "name": "My Scenario",
  "description": "Optional description shown in the app.",
  "recommendedMode": "sandbox",
  "benchmarkDefaults": {
    "durationTicks": 40,
    "spawnRate": 0.2
  },
  "worldOptions": {
    "seed": 20260428,
    "mapId": "my-map",
    "mapMode": "custom",
    "map": {
      "id": "my-map",
      "width": 5,
      "height": 5,
      "roads": [
        { "x": 2, "y": 0, "allowedDirections": ["south"] },
        { "x": 2, "y": 1, "allowedDirections": ["north", "south"] },
        { "x": 2, "y": 2, "allowedDirections": ["north", "south", "east", "west"] }
      ],
      "intersections": [
        { "x": 2, "y": 2 }
      ],
      "spawnPoints": []
    },
    "lights": [],
    "vehicles": []
  },
  "sandboxVehicles": [
    { "id": "car-1", "x": 2, "y": 0, "direction": "south", "status": "active", "spawnedAtTick": 0 }
  ]
}
```

## Notes

- `id` and `name` are required.
- `worldOptions` is required.
- For custom maps, `map.width`, `map.height`, and at least one road cell are required.
- `sandboxVehicles` is optional. If omitted, sandbox mode uses `worldOptions.vehicles`.
- `benchmarkDefaults` seeds the UI defaults, but the active benchmark duration/spawn rate still come from the current control values.
