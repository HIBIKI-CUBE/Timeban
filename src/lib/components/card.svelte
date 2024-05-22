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

  const logSum =
    item.Logs?.reduce(
      (sum, log) =>
        sum +
        (log.started_at && log.stopped_at
          ? log.stopped_at.getTime() - log.started_at.getTime()
          : 0),
      0,
    ) ?? 0;

  const duration = $derived(
    ((isRunning && masterTimer().isRunning && timer(id).duration) || 0) +
      logSum +
      (timer(id).sessionOffset || 0),
  );

  const formatted = $derived(new Date(duration).toUTCString().match(/..:..:../)?.[0] || '');

  const estimateMs = item.estimate_minutes * 60 * 1000;

  const estimateMinutesFormatted = new Date(estimateMs).toUTCString().match(/..:..:../)?.[0] || '';

  const isInTime = $derived(estimateMs * 0.95 <= duration && duration <= estimateMs * 1.05);

  const finishAt = $derived.by(() => {
    const now = new Date;
    const finishAt = new Date(now.getTime() + estimateMs - duration);
    return finishAt.toUTCString().match(/..:..:../)?.[0] || ''
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

<div class="card" title="{finishAt}">
  <div class="name">
    {item.name}
  </div>
  <div class="timer">
    {formatted}
    {#if estimateMs > 0}
      / {estimateMinutesFormatted}
    {/if}
  </div>
  {#if estimateMs > 0}
    <div
      class="gauge {duration > estimateMs ? 'over' : ''} {isInTime? 'in-time' : ''}"
      style="width: {duration / estimateMs * 100}%;"
    ></div>
  {/if}
</div>

<style lang="scss">
  .card {
    background-color: #fff7c2;
    color: black;
    padding: 1ch 0.5em 1ch;
    border-radius: 1ch;
    margin-bottom: 0.5em;
    position: relative;
    overflow: hidden;

    .gauge {
      position: absolute;
      background-color: #fd0;
      bottom: 0;
      left: 0;
      height: 0.5ch;
      max-width: 100%;
      &.over {
        background-color: #f20;
      }
      &.in-time {
        background-color: #0f2;
      }
    }
  }
</style>
