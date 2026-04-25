import {
  canTravelDirection,
  getCell,
  getDirectionOffset,
  getIntersection,
  getNextPosition,
  toPositionKey
} from '../../core/map.js';

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

  const vehicles = world.entities.vehicles.map((vehicle) => renderVehicle(world, vehicle, map, options));
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
  const isNorthSouthActive = lightPhase === 'north-south';
  const phaseLabel = isNorthSouthActive ? 'NS' : 'EW';

  return `
    <span class="traffic-light-cluster traffic-light-cluster--${escapeHtml(slugify(lightPhase))}" aria-label="traffic light ${escapeHtml(lightPhase)}">
      <span class="traffic-light-housing traffic-light-housing--vertical ${isNorthSouthActive ? 'traffic-light-housing--active' : 'traffic-light-housing--inactive'}"></span>
      <span class="traffic-light-housing traffic-light-housing--horizontal ${isNorthSouthActive ? 'traffic-light-housing--inactive' : 'traffic-light-housing--active'}"></span>
      <span class="traffic-light-phase-badge">${phaseLabel}</span>
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

function renderVehicle(world, vehicle, map, options = {}) {
  const renderState = getVehicleRenderState(world, vehicle, map, options);
  const color = vehicle.color ?? getVehicleColor(world, vehicle);
  const classes = ['vehicle', `vehicle--${escapeHtml(vehicle.direction)}`];

  if (renderState.motionKind === 'turn') {
    classes.push('vehicle--turning');
  }

  return `
    <span
      class="${classes.join(' ')}"
      data-motion-kind="${escapeHtml(renderState.motionKind)}"
      style="left:${renderState.position.x}%; top:${renderState.position.y}%; --vehicle-render-offset-x:${renderState.offset.x}px; --vehicle-render-offset-y:${renderState.offset.y}px; --vehicle-render-angle:${renderState.angle}deg; --vehicle-motion-progress:${renderState.progress.toFixed(3)}; --vehicle-color:${escapeHtml(color.fill)}; --vehicle-color-dark:${escapeHtml(color.shadow)}; --vehicle-color-light:${escapeHtml(color.highlight)};"
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

function getVehicleRenderState(world, vehicle, map, options) {
  const previousWorld = options.previousWorld;
  const baseProgress = clamp01(options.motionProgress ?? 1);
  const previousVehicle = previousWorld?.entities?.vehicles?.find((entry) => entry.id === vehicle.id) ?? null;
  const movedEvent = world.events.find((event) => event.type === 'vehicleMoved' && event.payload.vehicleId === vehicle.id);
  const turnEvent = world.events.find((event) => event.type === 'vehicleTurned' && event.payload.vehicleId === vehicle.id);
  const motionKind = turnEvent ? 'turn' : movedEvent ? 'straight' : 'idle';
  const fromDirection = turnEvent?.payload.from ?? previousVehicle?.direction ?? vehicle.direction;
  const startOffset = getVehicleRenderOffset(fromDirection);
  const endOffset = getVehicleRenderOffset(vehicle.direction);
  const shouldSlowDown = motionKind === 'straight' && shouldSlowDownAhead(world, vehicle);
  const progress = motionKind === 'straight' ? shapeStraightMotionProgress(baseProgress, shouldSlowDown) : baseProgress;

  if (!previousVehicle || motionKind === 'idle') {
    return {
      motionKind,
      progress,
      position: toPercentPoint({ x: vehicle.x + 0.5, y: vehicle.y + 0.5 }, map),
      offset: endOffset,
      angle: getDirectionAngle(vehicle.direction)
    };
  }

  const startPoint = { x: previousVehicle.x + 0.5, y: previousVehicle.y + 0.5 };
  const endPoint = { x: vehicle.x + 0.5, y: vehicle.y + 0.5 };

  if (motionKind === 'turn') {
    const curve = sampleTurnCurve(turnEvent, startPoint, endPoint, fromDirection, vehicle.direction, progress);
    return {
      motionKind,
      progress,
      position: toPercentPoint(curve.point, map),
      offset: interpolateOffset(startOffset, endOffset, progress),
      angle: curve.angle
    };
  }

  return {
    motionKind,
    progress,
    position: toPercentPoint(lerpPoint(startPoint, endPoint, progress), map),
    offset: interpolateOffset(startOffset, endOffset, progress),
    angle: getTurnAngles(fromDirection, vehicle.direction).to
  };
}

function getVehicleRenderOffset(direction) {
  const laneOffset = getDirectionOffset(direction);
  const queueOffset = {
    north: { x: 0, y: 4 },
    south: { x: 0, y: -4 },
    east: { x: -4, y: 0 },
    west: { x: 4, y: 0 }
  }[direction] ?? { x: 0, y: 0 };

  return {
    x: laneOffset.x + queueOffset.x,
    y: laneOffset.y + queueOffset.y
  };
}

function getDirectionAngle(direction) {
  return {
    north: -90,
    east: 0,
    south: 90,
    west: 180
  }[direction] ?? 0;
}

function getTurnAngles(fromDirection, toDirection) {
  const from = getDirectionAngle(fromDirection);
  const rawTo = getDirectionAngle(toDirection);
  const delta = normalizeAngleDelta(rawTo - from);

  return {
    from,
    to: from + delta
  };
}

function normalizeAngleDelta(delta) {
  let normalized = ((delta + 180) % 360 + 360) % 360 - 180;

  if (normalized === -180) {
    normalized = 180;
  }

  return normalized;
}

function shouldSlowDownAhead(world, vehicle) {
  const nextPosition = getNextPosition(vehicle, vehicle.direction);

  if (!getCell(world.map, nextPosition.x, nextPosition.y)) {
    return false;
  }

  if (!canTravelDirection(world.map, nextPosition.x, nextPosition.y, vehicle.direction)) {
    return true;
  }

  const occupied = world.entities.vehicles.some((other) => {
    if (other.id === vehicle.id) {
      return false;
    }

    if (getIntersection(world.map, nextPosition.x, nextPosition.y)) {
      return other.x === nextPosition.x && other.y === nextPosition.y;
    }

    return other.x === nextPosition.x && other.y === nextPosition.y && other.direction === vehicle.direction;
  });

  if (occupied) {
    return true;
  }

  const controlledIntersection = world.map.intersections.find(
    (intersection) => intersection.x === nextPosition.x && intersection.y === nextPosition.y && intersection.lightId
  );

  if (!controlledIntersection) {
    return false;
  }

  const light = world.entities.lights.find((entry) => entry.id === controlledIntersection.lightId);
  const phase = light?.phases?.[light.phaseIndex ?? 0];
  return !phase?.allowedDirections?.includes(vehicle.direction);
}

function shapeStraightMotionProgress(progress, shouldSlowDown) {
  if (!shouldSlowDown) {
    return progress;
  }

  const eased = 1 - (1 - progress) * (1 - progress);
  return Math.min(0.94, eased * 0.94);
}

function sampleTurnCurve(turnEvent, startPoint, endPoint, fromDirection, toDirection, progress) {
  const intersectionPoint = {
    x: (turnEvent?.payload?.x ?? startPoint.x) + 0.5,
    y: (turnEvent?.payload?.y ?? startPoint.y) + 0.5
  };
  const entryPoint = getIntersectionEntryPoint(intersectionPoint, fromDirection);
  const exitPoint = getIntersectionExitPoint(intersectionPoint, toDirection);
  const preArcRatio = 0.1;
  const postArcRatio = 0.1;

  if (progress <= preArcRatio) {
    const stageProgress = progress / preArcRatio;
    const point = lerpPoint(startPoint, entryPoint, stageProgress);
    const tangent = subtractPoint(entryPoint, startPoint);

    return {
      point,
      angle: Math.atan2(tangent.y, tangent.x) * (180 / Math.PI)
    };
  }

  if (progress >= 1 - postArcRatio) {
    const stageProgress = (progress - (1 - postArcRatio)) / postArcRatio;
    const point = lerpPoint(exitPoint, endPoint, stageProgress);
    const tangent = subtractPoint(endPoint, exitPoint);

    return {
      point,
      angle: Math.atan2(tangent.y, tangent.x) * (180 / Math.PI)
    };
  }

  const arcProgress = (progress - preArcRatio) / (1 - preArcRatio - postArcRatio);
  return sampleIntersectionTurnArc(intersectionPoint, fromDirection, toDirection, arcProgress);
}

function getIntersectionEntryPoint(intersectionCenter, direction) {
  const vector = getDirectionVector(direction);
  return {
    x: intersectionCenter.x - vector.x * 0.5,
    y: intersectionCenter.y - vector.y * 0.5
  };
}

function getIntersectionExitPoint(intersectionCenter, direction) {
  const vector = getDirectionVector(direction);
  return {
    x: intersectionCenter.x + vector.x * 0.5,
    y: intersectionCenter.y + vector.y * 0.5
  };
}

function sampleIntersectionTurnArc(intersectionCenter, fromDirection, toDirection, progress) {
  const fromVector = getDirectionVector(fromDirection);
  const toVector = getDirectionVector(toDirection);
  const startPoint = getIntersectionEntryPoint(intersectionCenter, fromDirection);
  const endPoint = getIntersectionExitPoint(intersectionCenter, toDirection);
  const arcCenter = {
    x: intersectionCenter.x + (toVector.x - fromVector.x) * 0.5,
    y: intersectionCenter.y + (toVector.y - fromVector.y) * 0.5
  };
  const startAngle = Math.atan2(startPoint.y - arcCenter.y, startPoint.x - arcCenter.x);
  const endAngle = Math.atan2(endPoint.y - arcCenter.y, endPoint.x - arcCenter.x);
  const delta = normalizeAngleDeltaRadians(endAngle - startAngle);
  const angle = startAngle + delta * progress;
  const radius = 0.5;
  const tangent = {
    x: -Math.sin(angle) * delta,
    y: Math.cos(angle) * delta
  };

  return {
    point: {
      x: arcCenter.x + Math.cos(angle) * radius,
      y: arcCenter.y + Math.sin(angle) * radius
    },
    angle: Math.atan2(tangent.y, tangent.x) * (180 / Math.PI)
  };
}

function getDirectionVector(direction) {
  return {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  }[direction] ?? { x: 0, y: 0 };
}

function normalizeAngleDeltaRadians(delta) {
  let normalized = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

  if (normalized === -Math.PI) {
    normalized = Math.PI;
  }

  return normalized;
}

function toPercentPoint(point, map) {
  return {
    x: (point.x / map.width) * 100,
    y: (point.y / map.height) * 100
  };
}

function interpolateOffset(startOffset, endOffset, progress) {
  return {
    x: startOffset.x + (endOffset.x - startOffset.x) * progress,
    y: startOffset.y + (endOffset.y - startOffset.y) * progress
  };
}

function lerpPoint(start, end, progress) {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress
  };
}

function subtractPoint(end, start) {
  return {
    x: end.x - start.x,
    y: end.y - start.y
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
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
