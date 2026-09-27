import { Canvas, Circle, Group, Path } from '@shopify/react-native-skia';
import { type Ref, useCallback, useImperativeHandle, useState } from 'react';
import {
  Extrapolation,
  interpolate,
  type SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { useLogoDrawProgress } from '../hooks/useLogoDrawProgress';
import {
  CROWN_NODE_RADIUS,
  HUB_OVERSHOOT_RANGE,
  HUB_OVERSHOOT_SCALE,
  HUB_RADIUS,
  LOGO_ASPECT_RATIO,
  LOGO_DRAW_SEGMENTS,
  LOGO_VIEWBOX_HEIGHT,
  SHADOW_NODE_RADIUS,
  SHADOW_NODE_RING_WIDTH,
  SPOKE_STROKE_WIDTH,
} from '../utils/constants';
import { segmentProgress } from '../utils/logoDrawMath';
import { logoBrandColors } from '../utils/logoPalette';
import {
  CROWN_NODES,
  CROWN_SPOKES,
  HEX_CENTER,
  HEX_FILL,
  SHADOW_NODES,
  SHADOW_SPOKES,
} from '../utils/logoPaths';

export type LogoDrawAnimationRef = {
  /** (Re)start the draw animation from the beginning. */
  play: () => void;
  /** Alias of play; reads better at call sites restarting a finished run. */
  replay: () => void;
};

export type LogoDrawAnimationProps = {
  /** Rendered logo height in dp; width follows the logo aspect ratio. */
  size: number;
  /** Play the draw animation on mount. Ignored when `progress` is supplied. */
  autoPlay?: boolean;
  /**
   * External progress (0→1) for scrubbing or pager-driven reveals. Supplying
   * it disables the internal timeline and the at-rest unmasked fast path.
   */
  progress?: SharedValue<number>;
  /** Called on the JS thread once the draw reaches the end. */
  onFinish?: () => void;
  /** Imperative play/replay handle. */
  ref?: Ref<LogoDrawAnimationRef>;
};

/**
 * Paint-on reveal of The Boss mark: the six spokes draw outward from the
 * hub as one continuous gesture (crown then shadow), the hexagon fill
 * settles into place, and the center hub lands with a spring. The spokes
 * are real strokes, so their reveal trims the path itself (Skia `end`);
 * all per-frame work stays on the UI thread via Skia's Reanimated
 * integration.
 */
export function LogoDrawAnimation({
  size,
  autoPlay = true,
  progress,
  onFinish,
  ref,
}: LogoDrawAnimationProps) {
  const internalProgress = useSharedValue(0);
  const controlled = progress !== undefined;
  const master = progress ?? internalProgress;
  const [finished, setFinished] = useState(false);

  const handleSettle = useCallback(() => {
    // Controlled progress can scrub back below 1, so the unmasked fast path
    // only engages for the internal timeline.
    if (!controlled) {
      setFinished(true);
    }
    onFinish?.();
  }, [controlled, onFinish]);

  const play = useLogoDrawProgress({
    progress: master,
    controlled,
    autoPlay,
    onSettle: handleSettle,
  });

  const replay = useCallback(() => {
    setFinished(false);
    play();
  }, [play]);

  useImperativeHandle(ref, () => ({ play: replay, replay }), [replay]);

  const crownTrim = useDerivedValue(
    () =>
      segmentProgress(
        master.value,
        LOGO_DRAW_SEGMENTS.crownSpokes.from,
        LOGO_DRAW_SEGMENTS.crownSpokes.to,
      ),
    [master],
  );
  const shadowTrim = useDerivedValue(
    () =>
      segmentProgress(
        master.value,
        LOGO_DRAW_SEGMENTS.shadowSpokes.from,
        LOGO_DRAW_SEGMENTS.shadowSpokes.to,
      ),
    [master],
  );
  const hexTrim = useDerivedValue(
    () =>
      segmentProgress(master.value, LOGO_DRAW_SEGMENTS.hexagon.from, LOGO_DRAW_SEGMENTS.hexagon.to),
    [master],
  );
  const hubTrim = useDerivedValue(
    () => segmentProgress(master.value, LOGO_DRAW_SEGMENTS.hub.from, LOGO_DRAW_SEGMENTS.hub.to),
    [master],
  );
  // The landing spring overshoots past 1; the hub converts that tail into a
  // small scale rebound around the hub's own center.
  const hubTransform = useDerivedValue(() => {
    const scale = interpolate(
      master.value,
      [1, 1 + HUB_OVERSHOOT_RANGE],
      [1, HUB_OVERSHOOT_SCALE],
      Extrapolation.CLAMP,
    );
    return [
      { translateX: HEX_CENTER.x },
      { translateY: HEX_CENTER.y },
      { scale: hubTrim.value * scale },
      { translateX: -HEX_CENTER.x },
      { translateY: -HEX_CENTER.y },
    ];
  }, [master, hubTrim]);

  const height = size;
  const width = size * LOGO_ASPECT_RATIO;
  const fitTransform = [{ scale: height / LOGO_VIEWBOX_HEIGHT }];

  return (
    <Canvas pointerEvents="none" style={{ height, width }}>
      <Group transform={fitTransform}>
        {finished ? (
          <>
            <Path color={logoBrandColors.hex} path={HEX_FILL} />
            <Path
              color={logoBrandColors.crown}
              path={CROWN_SPOKES}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={SPOKE_STROKE_WIDTH}
              style="stroke"
            />
            <Path
              color={logoBrandColors.shadow}
              path={SHADOW_SPOKES}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={SPOKE_STROKE_WIDTH}
              style="stroke"
            />
            {CROWN_NODES.map((node) => (
              <Circle
                color={logoBrandColors.crown}
                cx={node.x}
                cy={node.y}
                key={`crown-${node.x}-${node.y}`}
                r={CROWN_NODE_RADIUS}
              />
            ))}
            {SHADOW_NODES.map((node) => (
              <Group key={`shadow-${node.x}-${node.y}`}>
                <Circle
                  color={logoBrandColors.shadow}
                  cx={node.x}
                  cy={node.y}
                  r={SHADOW_NODE_RADIUS}
                />
                <Circle
                  color={logoBrandColors.shadowRing}
                  cx={node.x}
                  cy={node.y}
                  r={SHADOW_NODE_RADIUS}
                  strokeWidth={SHADOW_NODE_RING_WIDTH}
                  style="stroke"
                />
              </Group>
            ))}
            <Circle
              color={logoBrandColors.hub}
              cx={HEX_CENTER.x}
              cy={HEX_CENTER.y}
              opacity={0.95}
              r={HUB_RADIUS}
            />
          </>
        ) : (
          <>
            <Group opacity={hexTrim}>
              <Path color={logoBrandColors.hex} path={HEX_FILL} />
            </Group>
            <Path
              color={logoBrandColors.crown}
              end={crownTrim}
              path={CROWN_SPOKES}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={SPOKE_STROKE_WIDTH}
              style="stroke"
            />
            <Path
              color={logoBrandColors.shadow}
              end={shadowTrim}
              path={SHADOW_SPOKES}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={SPOKE_STROKE_WIDTH}
              style="stroke"
            />
            <Group opacity={crownTrim}>
              {CROWN_NODES.map((node) => (
                <Circle
                  color={logoBrandColors.crown}
                  cx={node.x}
                  cy={node.y}
                  key={`crown-${node.x}-${node.y}`}
                  r={CROWN_NODE_RADIUS}
                />
              ))}
            </Group>
            <Group opacity={shadowTrim}>
              {SHADOW_NODES.map((node) => (
                <Group key={`shadow-${node.x}-${node.y}`}>
                  <Circle
                    color={logoBrandColors.shadow}
                    cx={node.x}
                    cy={node.y}
                    r={SHADOW_NODE_RADIUS}
                  />
                  <Circle
                    color={logoBrandColors.shadowRing}
                    cx={node.x}
                    cy={node.y}
                    r={SHADOW_NODE_RADIUS}
                    strokeWidth={SHADOW_NODE_RING_WIDTH}
                    style="stroke"
                  />
                </Group>
              ))}
            </Group>
            <Group transform={hubTransform}>
              <Circle
                color={logoBrandColors.hub}
                cx={HEX_CENTER.x}
                cy={HEX_CENTER.y}
                opacity={0.95}
                r={HUB_RADIUS}
              />
            </Group>
          </>
        )}
      </Group>
    </Canvas>
  );
}
