import { getDirectionOffset, toPositionKey } from '../../core/map.js';

const ROAD_DIRECTION_SET = {
  horizontal: ['east', 'west'],
  vertical: ['north', 'south'],
  cross: ['north', 'east', 'south', 'west']
};

const LIGHT_PHASE_META = {
  'north-south': {
    north: 'green',
    south: 'green',
    east: 'red',
    west: 'red'
  },
  'east-west': {
    north: 'red',
    south: 'red',
    east: 'green',
    west: 'green'
  }
};

export function createRenderer(rootElement) {
  return {
    status: 'world renderer ready',
    renderPlaceholder(payload) {
      if (!rootElement) {
        return;
      }

      const lines = (payload.lines || []).map((line) => `<div>${escapeHtml(line)}</div>`).join('');

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
  const intersectionsByPosition = new Map(
    map.intersections.map((intersection) => [toPositionKey(intersection.x, intersection.y), intersection])
  );
  const lightsById = new Map(world.entities.lights.map((light) => [light.id, light]));

  const cells = [];

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const positionKey = toPositionKey(x, y);
      const road = map.roadsByKey[positionKey];
      const intersection = intersectionsByPosition.get(positionKey);
      const light = intersection?.lightId ? lightsById.get(intersection.lightId) : null;
      const lightPhase = light?.phases?.[light.phaseIndex ?? 0]?.name ?? null;
      const spawnPoint = map.spawnPoints.find((entry) => entry.x === x && entry.y === y);

      const classes = ['map-cell'];
      if (road) classes.push('map-cell--road');
      if (intersection) classes.push('map-cell--intersection');
      if (spawnPoint) classes.push('map-cell--spawn');
      if (lightPhase) classes.push(`map-cell--light-${slugify(lightPhase)}`);

      const content = road ? renderRoadSurface({ road, intersection, spawnPoint, lightPhase }) : '';

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

  const vehicles = world.entities.vehicles.map((vehicle) => renderVehicle(world, vehicle, map));
  const summary = options.summaryLines || [];

  const animationDurationMs = options.animationDurationMs ?? 240;

  return `
    <div class="world-view">
      <div class="world-summary">
        ${summary.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
      </div>
      <div class="world-grid-shell" style="--vehicle-animation-duration:${animationDurationMs}ms;">
        <div
          class="world-grid"
          style="grid-template-columns: repeat(${map.width}, minmax(0, 1fr));"
        >
          ${cells.join('')}
        </div>
        <div class="vehicle-layer" style="--grid-width:${map.width}; --grid-height:${map.height};">
          ${vehicles.join('')}
        </div>
      </div>
    </div>
  `;
}

function renderRoadSurface({ road, intersection, spawnPoint, lightPhase }) {
  const roadType = getRoadType(road?.allowedDirections || []);
  const laneMarkup = road ? renderLaneMarkers(roadType) : '';
  const intersectionMarkup = intersection ? '<span class="intersection-core"></span>' : '';
  const spawnMarkup = spawnPoint ? `<span class="spawn-marker" title="spawn ${escapeHtml(spawnPoint.direction)}"></span>` : '';
  const hintMarkup = road ? `<span class="road-direction road-direction--${roadType}" title="${escapeHtml(formatDirections(road.allowedDirections || []))}">${escapeHtml(directionSetGlyph(road.allowedDirections || []))}</span>` : '';
  const lightMarkup = intersection && lightPhase ? renderTrafficLight(lightPhase) : '';

  return `
    <span class="road-surface road-surface--${roadType}">
      ${laneMarkup}
      ${intersectionMarkup}
      ${spawnMarkup}
      ${hintMarkup}
      ${lightMarkup}
    </span>
  `;
}

function renderLaneMarkers(roadType) {
  if (roadType === 'horizontal') {
    return '<span class="lane-marker lane-marker--horizontal"></span>';
  }

  if (roadType === 'vertical') {
    return '<span class="lane-marker lane-marker--vertical"></span>';
  }

  return `
    <span class="lane-marker lane-marker--horizontal"></span>
    <span class="lane-marker lane-marker--vertical"></span>
  `;
}

function renderTrafficLight(lightPhase) {
  const meta = LIGHT_PHASE_META[lightPhase] ?? {};

  return `
    <span class="traffic-light-cluster" aria-label="traffic light ${escapeHtml(lightPhase)}">
      ${renderTrafficLightBulb('north', meta.north)}
      ${renderTrafficLightBulb('east', meta.east)}
      ${renderTrafficLightBulb('south', meta.south)}
      ${renderTrafficLightBulb('west', meta.west)}
    </span>
  `;
}

function renderTrafficLightBulb(direction, state = 'red') {
  return `<span class="traffic-light traffic-light--${escapeHtml(direction)} traffic-light--${escapeHtml(state)}"></span>`;
}

function renderVehicle(world, vehicle, map) {
  const offset = scaleOffset(getDirectionOffset(vehicle.direction), 0.7);
  const startPosition = getVehicleStartPosition(world, vehicle);
  const endX = toPercent(vehicle.x, map.width);
  const endY = toPercent(vehicle.y, map.height);
  const startX = toPercent(startPosition.x, map.width);
  const startY = toPercent(startPosition.y, map.height);
  const color = vehicle.color ?? getVehicleColor(world, vehicle);

  return `
    <span
      class="vehicle vehicle--${escapeHtml(vehicle.direction)}"
      style="--vehicle-x:${endX}%; --vehicle-y:${endY}%; --vehicle-start-x:${startX}%; --vehicle-start-y:${startY}%; --lane-offset-x:${offset.x}%; --lane-offset-y:${offset.y}%; --vehicle-color:${escapeHtml(color.fill)}; --vehicle-color-dark:${escapeHtml(color.shadow)}; --vehicle-color-light:${escapeHtml(color.highlight)};"
      title="${escapeHtml(vehicle.id)} lane=${escapeHtml(vehicle.direction)}"
      aria-label="${escapeHtml(vehicle.id)}"
    >
      <span class="vehicle-svg">
        <span class="vehicle-body"></span>
        <span class="vehicle-cabin"></span>
        <span class="vehicle-wheels vehicle-wheels--front"></span>
        <span class="vehicle-wheels vehicle-wheels--rear"></span>
        <span class="vehicle-windshield"></span>
      </span>
    </span>
  `;
}

function getVehicleStartPosition(world, vehicle) {
  const movedEvent = world.events.find((event) => event.type === 'vehicleMoved' && event.payload.vehicleId === vehicle.id);
  if (!movedEvent) {
    return { x: vehicle.x, y: vehicle.y };
  }

  const turnEvent = world.events.find((event) => event.type === 'vehicleTurned' && event.payload.vehicleId === vehicle.id);
  if (turnEvent) {
    return { x: turnEvent.payload.x, y: turnEvent.payload.y };
  }

  const backDelta = {
    north: { x: 0, y: 1 },
    east: { x: -1, y: 0 },
    south: { x: 0, y: -1 },
    west: { x: 1, y: 0 }
  }[vehicle.direction] ?? { x: 0, y: 0 };

  return {
    x: vehicle.x + backDelta.x,
    y: vehicle.y + backDelta.y
  };
}

function scaleOffset(offset, scale) {
  return {
    x: offset.x * scale,
    y: offset.y * scale
  };
}

function toPercent(index, size) {
  return ((index + 0.5) / size) * 100;
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

function getRoadType(directions) {
  if (matchesDirections(directions, ROAD_DIRECTION_SET.horizontal)) {
    return 'horizontal';
  }

  if (matchesDirections(directions, ROAD_DIRECTION_SET.vertical)) {
    return 'vertical';
  }

  if (matchesDirections(directions, ROAD_DIRECTION_SET.cross)) {
    return 'cross';
  }

  return 'stub';
}

function matchesDirections(actual, expected) {
  return actual.length === expected.length && expected.every((direction) => actual.includes(direction));
}

function getVehicleColor(world, vehicle) {
  const fallbackHue = 200 + ((world.simulationSeed + String(vehicle.id).length) % 40);
  return {
    fill: `hsl(${fallbackHue}, 70%, 58%)`,
    shadow: `hsl(${fallbackHue}, 55%, 36%)`,
    highlight: `hsl(${fallbackHue}, 88%, 80%)`
  };
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
