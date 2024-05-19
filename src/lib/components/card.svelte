<script lang="ts">
  import { browser } from '$app/environment';
  import type { Items, Logs } from '@prisma/client';
  import { masterTimer, timer } from '$lib/globalStates.svelte';

  interface Props {
    isRunning?: boolean;
    item: { Logs: Logs[] } & Items;
  }

  let { isRunning = false, item }: Props = $props();
  const { id } = item;

  $effect(() => {
    if (isRunning && masterTimer().isRunning) {
      updateTimer();
    }
  });

  let formatted = $derived.by(() => {
    const logSum = item.Logs?.reduce(
      (sum, log) =>
        sum +
        (log.started_at && log.stopped_at
          ? log.stopped_at.getTime() - log.started_at.getTime()
          : 0),
      0,
    ) ?? 0;

    const duration =
      ((isRunning && masterTimer().isRunning && timer(id).duration) || 0) +
      logSum +
      (timer(id).sessionOffset || 0);

    return new Date(duration).toUTCString().match(/..:..:../)?.[0] || '';
  });

  function updateTimer(): void {
    timer(id).updateIfExists();

    if (!timer(id).exists && item.Logs?.length > 0) {
      const [lastLog] = item.Logs.slice(-1);
      const needsResume =
        lastLog?.id && !lastLog.stopped_at && isRunning && masterTimer().isRunning;
      if (needsResume) {
        timer(id).resumeOrCreate(lastLog.started_at);
      }
    }

    if (isRunning && masterTimer().isRunning && browser) {
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
