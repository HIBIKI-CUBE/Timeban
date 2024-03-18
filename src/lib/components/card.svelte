<script lang="ts">
  import type { Items, Logs } from '@prisma/client';

  export let isRunning = false;
  export let item: { Logs: Logs[] } & Items;
  let id = Number(item.id),
    startedAt = item?.Logs.findLast(
      log => log.started_at !== undefined && log.stopped_at === null,
    )?.started_at?.getTime(),
    stoppedAt: number | undefined,
    offset = item?.Logs.reduce((sum, log) => {
      if (log.started_at && log.stopped_at) {
        sum += log.stopped_at?.getTime() - log.started_at?.getTime();
      }
      return sum;
    }, 0);

  $: diff = (startedAt !== undefined ? new Date().getTime() - startedAt : 0) + offset;
  $: formatted = new Date(diff).toUTCString().match(/..:..:../)?.[0] ?? '';
</script>

<svelte:options accessors={true}/>

<div>
  {item.name}
  {formatted}
</div>
