<script lang="ts">
  import { browser } from '$app/environment';
  import type { Items, Logs } from '@prisma/client';
  import { timers } from '$lib/timers';
  import { paused } from '$lib/paused';

  export let isRunning = false;
  export let item: { Logs: Logs[] } & Items;
  const { id } = item;

  const logSum = item.Logs.reduce(
    (sum, log) =>
      sum +
      (log.started_at && log.stopped_at
        ? log.stopped_at?.getTime() - log.started_at?.getTime()
        : 0),
    0,
  );
  $: {
    isRunning && !$paused && updateTimer();
  }
  $: formatted =
    (new Date(
      ((isRunning && !$paused && $timers[id]?.duration) || 0) +
        logSum +
        ($timers[id]?.sessionOffset || 0),
    )
      .toUTCString()
      .match(/..:..:../)?.[0] ??
      '') ||
    '';
  function updateTimer(): void {
    if ($timers[id]) {
      $timers[id].duration = new Date().getTime() - $timers[id].started_at.getTime();
    } else {
      const [lastLog] = item.Logs.slice(-1);
      const needsResume = lastLog?.id && !lastLog.stopped_at && isRunning && !$paused;
      if (needsResume) {
        $timers[id] = {
          started_at: lastLog.started_at,
          sessionOffset: 0,
          duration: 0,
        };
      }
    }
    if (isRunning && !$paused && browser) {
      requestAnimationFrame(updateTimer);
    }
  }
</script>

<div class="card">
  <div class="name">
    {item.name}
  </div>
  <div class="timer">
    {formatted}
  </div>
</div>

<style lang="scss">
  .card {
    background-color: #fff7c2;
    color: black;
    padding: 1ch 0.5em 1ch;
    border-radius: 1ch;
    margin-bottom: 0.5em;
  }
</style>
