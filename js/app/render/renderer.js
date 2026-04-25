import { getDirectionOffset, toPositionKey } from '../../core/map.js';

export function createRenderer(rootElement) {
  return {
    status: 'world renderer ready',
    renderPlaceholder(payload) {
      if (!rootElement) {
        return;
      }

      const lines = (payload.lines || [])
        .map((line) => `<div>${escapeHtml(line)}</div>`)
        .join('');

      rootElement.innerHTML = `
        <div>
          <strong>${escapeHtml(payload.title || 'Renderer placeholder')}</strong>
          <div style="margin-top: 12px; display: grid; gap: 8px;">${lines}</div>
        </div>
      `;
    },
    renderWorld(world, options = {}) {
      if (!rootElement) {
        return;
      }

      rootElement.innerHTML = buildWorldHtml(world, options);
    }
  };
}

export function buildWorldHtml(world, options = {}) {
  const map = world.map;
  const vehiclesByPosition = new Map();

  for (const vehicle of world.entities.vehicles) {
    const key = toPositionKey(vehicle.x, vehicle.y);
    const vehiclesAtCell = vehiclesByPosition.get(key) ?? [];
    vehiclesAtCell.push(vehicle);
    vehiclesByPosition.set(key, vehiclesAtCell);
  }

  const intersectionsByPosition = new Map(
    map.intersections.map((intersection) => [toPositionKey(intersection.x, intersection.y), intersection])
  );
  const lightsById = new Map(world.entities.lights.map((light) => [light.id, light]));

  const cells = [];

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const positionKey = toPositionKey(x, y);
      const road = map.roadsByKey[positionKey];
      const vehicles = vehiclesByPosition.get(positionKey) ?? [];
      const intersection = intersectionsByPosition.get(positionKey);
      const light = intersection?.lightId ? lightsById.get(intersection.lightId) : null;
      const lightPhase = light?.phases?.[light.phaseIndex ?? 0]?.name ?? null;
      const spawnPoint = map.spawnPoints.find((entry) => entry.x === x && entry.y === y);

      const classes = ['map-cell'];
      if (road) classes.push('map-cell--road');
      if (intersection) classes.push('map-cell--intersection');
      if (spawnPoint) classes.push('map-cell--spawn');
      if (vehicles.length > 0) classes.push('map-cell--occupied');
      if (lightPhase) classes.push(`map-cell--light-${slugify(lightPhase)}`);

      let content = '';
      if (vehicles.length > 0) {
        content = vehicles
          .map((vehicle) => {
            const offset = getDirectionOffset(vehicle.direction);
            return `<span class="vehicle vehicle--${escapeHtml(vehicle.direction)}" style="--lane-offset-x:${offset.x}%; --lane-offset-y:${offset.y}%;" title="${escapeHtml(vehicle.id)} lane=${escapeHtml(vehicle.direction)}">${escapeHtml(directionGlyph(vehicle.direction))}</span>`;
          })
          .join('');
      } else if (spawnPoint) {
        content = `<span class="spawn-marker" title="spawn ${escapeHtml(spawnPoint.direction)}">◎</span>`;
      } else if (intersection) {
        content = `<span class="intersection-marker" title="${escapeHtml(formatDirections(road?.allowedDirections || []))}">╋</span>`;
      } else if (road) {
        content = `<span class="road-direction" title="${escapeHtml(formatDirections(road.allowedDirections || []))}">${escapeHtml(directionSetGlyph(road.allowedDirections || []))}</span>`;
      }

      cells.push(`
        <div
          class="${classes.join(' ')}"
          data-x="${x}"
          data-y="${y}"
          title="x=${x}, y=${y}${lightPhase ? `, light=${escapeHtml(lightPhase)}` : ''}"
        >${content}</div>
      `);
    }
  }

  const summary = options.summaryLines || [];

  return `
    <div class="world-view">
      <div class="world-summary">
        ${summary.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
      </div>
      <div
        class="world-grid"
        style="grid-template-columns: repeat(${map.width}, minmax(0, 1fr));"
      >
        ${cells.join('')}
      </div>
    </div>
  `;
}

function directionGlyph(direction) {
  return {
    north: '↑',
    east: '→',
    south: '↓',
    west: '←'
  }[direction] ?? '•';
}

function directionSetGlyph(directions) {
  if (directions.length === 0) {
    return '·';
  }

  return directions.map((direction) => directionGlyph(direction)).join('');
}

function formatDirections(directions) {
  return directions.length > 0 ? `allowed: ${directions.join(', ')}` : 'allowed: none';
}

function slugify(value) {
  return String(value).replaceAll(/[^a-z0-9]+/gi, '-').replaceAll(/^-|-$/g, '').toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
