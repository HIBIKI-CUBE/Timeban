<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import { dndzone, type DndEvent, type Item } from 'svelte-dnd-action';
  interface timer {
    id: number;
    startedAt: number;
    stoppedAt: number | undefined;
    display: string | undefined;
    offset: number;
  }
  export let data: PageData;
  let { board } = data;
  let timers: timer[] = [];

  function findTimer(id: number): number | undefined {
    const index = timers.findIndex(item => item.id === id);
    return index === -1 ? undefined : index;
  }

  function updateTimer(id: number) {
    const targetIndex = findTimer(id);
    if (
      targetIndex === undefined ||
      !timers[targetIndex] ||
      timers[targetIndex].stoppedAt !== undefined
    )
      return;
    const diff = new Date().getTime() - timers[targetIndex].startedAt + timers[targetIndex].offset;
    timers[targetIndex].display = new Date(diff).toUTCString().match(/..:..:../)?.[0] ?? '';
    timers = timers;

    requestAnimationFrame(() => {
      updateTimer(id);
    });
  }

  export const DndConsider = (e: CustomEvent<DndEvent<Item>>, lane: bigint): void => {
    const domLaneIndex = Number(lane - 1n);
    if (board?.Lanes[domLaneIndex]?.Items) {
      board.Lanes[domLaneIndex].Items = e.detail.items;
    }
  };
  export const DndFinalize = async (e: CustomEvent<DndEvent<Item>>, lane: bigint) => {
    const domLaneIndex = Number(lane - 1n);
    if (board?.Lanes[domLaneIndex]?.Items) {
      board.Lanes[domLaneIndex].Items = e.detail.items;
    }
    if (e.detail.info.trigger === 'droppedIntoZone') {
      await Promise.all(
        e.detail.items.map((item, i) => {
          const idStr = String(item.id);
          if (item.row === BigInt(i) && item.id !== e.detail.info.id) return;
          const data = new FormData();
          data.append('id', idStr);
          data.append('lane', String(lane));
          data.append('row', String(i));
          if (item.id === e.detail.info.id) {
            if (board?.Lanes[domLaneIndex].runsTimer) {
              const timerIndex = findTimer(Number(item.id));
              if(timerIndex === undefined){
                timers.push({
                  id: Number(item.id),
                  startedAt: new Date().getTime(),
                  stoppedAt: undefined,
                  offset: 0,
                  display: '00:00:00',
                });
              }else{
                timers[timerIndex].startedAt = new Date().getTime();
                timers[timerIndex].stoppedAt = undefined;
              }
              timers = timers;
              console.log(timers);
              requestAnimationFrame(() => {
                updateTimer(Number(item.id));
              });
              data.append('timerControl', 'start');
            } else {
              const targetIndex = findTimer(Number(item.id));
              if (targetIndex === undefined || !timers[targetIndex] || timers[targetIndex]?.startedAt === undefined) return;
              timers[targetIndex].stoppedAt = new Date().getTime();
              timers[targetIndex].offset = timers[targetIndex].stoppedAt! - timers[targetIndex].startedAt;
              timers = timers;
              console.log('stop', item.name, timers);
            }
          }
          return fetch('?/updateItem', {
            method: 'POST',
            body: data,
          });
        }),
      );
    }
  };
</script>

<h1>
  {board?.name}
</h1>
{#if board?.Lanes}
  <div class="lanes">
    {#each board?.Lanes as lane}
      <div class="lane">
        <h2>
          {lane.name}
        </h2>
        {#if lane.Items}
          <div
            class="items"
            use:dndzone={{ items: lane.Items, flipDurationMs: 100 }}
            on:consider={e => {
              DndConsider(e, lane.id);
            }}
            on:finalize={e => {
              DndFinalize(e, lane.id);
            }}
          >
            {#each lane.Items as item (item.id)}
              <div>
                {item.name}
                {#if findTimer(Number(item.id)) !== undefined && timers[findTimer(Number(item.id))]}
                  {timers[findTimer(Number(item.id))].display}
                {/if}
              </div>
            {/each}
          </div>
        {/if}
        <form action="?/createItem" method="post" use:enhance>
          <input type="text" name="name" required />
          <input type="hidden" name="lane" value={lane.id} />
          <input type="submit" value="追加" />
        </form>
      </div>
    {/each}
  </div>
{/if}

<style>
  .lanes {
    display: flex;
    flex-wrap: wrap;
  }
  .items {
    padding: 0 0 1em;
  }
</style>
