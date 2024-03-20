<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/card.svelte';
  import type { PageData } from './$types';
  import { dndzone, type DndEvent, type Item } from 'svelte-dnd-action';
  import { timers } from '$lib/timers';

  export let data: PageData;
  let { board } = data;
  $: ({ board } = data);

  export const DndConsider = (e: CustomEvent<DndEvent<Item>>, laneId: bigint): void => {
    const targetLaneIndex = board?.Lanes.findIndex(lane => lane.id === laneId);
    if (
      targetLaneIndex === undefined ||
      targetLaneIndex === -1 ||
      !board?.Lanes[targetLaneIndex].Items
    )
      return;
    board.Lanes[targetLaneIndex].Items = e.detail.items;
  };
  export const DndFinalize = async (e: CustomEvent<DndEvent<Item>>, laneId: bigint) => {
    const targetLaneIndex = board?.Lanes.findIndex(lane => lane.id === laneId);
    if (targetLaneIndex === undefined || targetLaneIndex === -1 || !board) return;
    board.Lanes[targetLaneIndex].Items = e.detail.items;
    if (e.detail.info.trigger === 'droppedIntoZone') {
      await Promise.all(
        e.detail.items.map((item, i) => {
          if (item.row === BigInt(i) && item.id !== e.detail.info.id) return; //When the item is not moved
          const data = new FormData();
          data.append('id', String(item.id));
          data.append('lane', String(laneId));
          data.append('row', String(i));
          if (board?.Lanes[targetLaneIndex].runsTimer) {
            data.append('timerControl', 'start');
            if (!$timers[item.id]) {
              $timers[item.id] = {
                started_at: new Date(),
                sessionOffset: 0,
                duration: 0,
              };
            }
            $timers[item.id].started_at = new Date();
          } else {
            data.append('timerControl', 'stop');
            if ($timers[item.id]) {
              $timers[item.id].sessionOffset += $timers[item.id].duration;
              $timers[item.id].duration = 0;
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
<a href="/">ボード一覧に戻る</a>
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
              <Card {item} isRunning={lane.runsTimer} />
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

<form action="?/createLane" method="post" use:enhance>
  <label for="name">レーンを作成</label>
  <input type="text" name="name" required />
  <input type="checkbox" name="runsTimer" id="runsTimer" />
  <label for="runsTimer">タイマーを作動させるレーン</label>
  <input type="hidden" name="board" value={board?.id} />
  <input type="submit" value="作成" />
</form>

<style>
  .lanes {
    display: flex;
    flex-wrap: wrap;
  }
  .items {
    padding: 0 0 1em;
  }
</style>
