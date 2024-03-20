<script lang="ts">
  import { browser } from '$app/environment';
  import type { Items, Logs } from '@prisma/client';
  import { timers } from '$lib/timers';

  export let isRunning = false;
  export let item: { Logs: Logs[] } & Items;
  const id = Number(item?.id);
  const [lastLog] = item?.Logs.slice(-1) ?? undefined;
  if (lastLog && lastLog.started_at && !lastLog.stopped_at && isRunning) {
    $timers[id] = {
      started_at: lastLog.started_at,
      sessionOffset: 0,
      duration: 0,
    };
  }
  let logSum = item?.Logs.reduce(
    (sum, log) =>
      sum +
      (log.started_at && log.stopped_at
        ? log.stopped_at?.getTime() - log.started_at?.getTime()
        : 0),
    0,
  );

  $: {
    isRunning && updateTimer();
  }
  $: formatted =
    (new Date(
      ((isRunning && $timers[id]?.duration) || 0) + logSum + ($timers[id]?.sessionOffset || 0),
    )
      .toUTCString()
      .match(/..:..:../)?.[0] ??
      '') ||
    '';
  function updateTimer(): void {
    if (!$timers[id]) return;
    $timers[id].duration = new Date().getTime() - $timers[id].started_at.getTime();
    if (isRunning && browser) {
      requestAnimationFrame(updateTimer);
    }
  }
</script>

<div>
  {item.name}
  {formatted}
</div>
