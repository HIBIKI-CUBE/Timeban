<script lang="ts">
  import { enhance } from '$app/forms';
  import { flip } from 'svelte/animate';
  import Card from '$lib/components/card.svelte';
  import type { PageData } from './$types';
  import { dndzone, type DndEvent, type Item } from 'svelte-dnd-action';
  import { timers } from '$lib/timers';
  import Lane from '$lib/components/lane.svelte';
  import { communicating } from '$lib/communicating';
  import PauseButton from '$lib/components/pauseButton.svelte';
  import { paused } from '$lib/paused';
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;
  let { board } = data;
  $: ({ board } = data);

  const flipDurationMs = 250;

  $paused = board?.paused ?? false;

  export const DndConsider = (e: CustomEvent<DndEvent<Item>>, laneId: number): void => {
    const targetLaneIndex = board?.Lanes.findIndex(lane => lane.id === laneId);
    if (
      targetLaneIndex === undefined ||
      targetLaneIndex === -1 ||
      !board?.Lanes[targetLaneIndex].Items
    )
      return;
    board.Lanes[targetLaneIndex].Items = e.detail.items;
  };
  export const DndFinalize = async (e: CustomEvent<DndEvent<Item>>, laneId: number) => {
    const targetLaneIndex = board?.Lanes.findIndex(lane => lane.id === laneId);
    if (targetLaneIndex === undefined || targetLaneIndex === -1 || !board) return;
    board.Lanes[targetLaneIndex].Items = e.detail.items;
    if (e.detail.info.trigger === 'droppedIntoZone') {
      await Promise.all(
        e.detail.items.map((item, i) => {
          if (
            (item.row === BigInt(i) && item.id !== e.detail.info.id) ||
            (e.detail.items.length === 1 && e.detail.items[0].lane === laneId)
          )
            return; //When the item is not moved
          // console.log(item, e.detail, targetLaneIndex, laneId);
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
          $communicating = true;

          fetch('?/updateItem', {
            method: 'POST',
            body: data,
          }).then(() => {
            $communicating = false;
          });
          return;
        }),
      );
    }
  };

  let newLaneName = '', newLaneRunsTimer = false;
  const createLane = async () => {
    await trpc($page).lane.create.mutate({
      name: newLaneName,
      runsTimer: newLaneRunsTimer,
      boardId: board.id,
    });
    newLaneName = '';
    newLaneRunsTimer = false;
    invalidateAll();
  };
</script>

{#if board}
  <div class="board">
    <div class="header">
      <h1>
        {board?.name}
      </h1>
      <PauseButton
        items={board?.Lanes.filter(lane => lane.runsTimer)
          .map(lane => lane.Items)
          .flat()}
        {board}
      />
    </div>
    {#if board?.Lanes}
      <div class="lanes">
        {#each board?.Lanes as lane}
          <Lane {lane}>
            <div
              class="items"
              use:dndzone={{ items: lane.Items, flipDurationMs }}
              on:consider={e => {
                DndConsider(e, lane.id);
              }}
              on:finalize={e => {
                DndFinalize(e, lane.id);
              }}
            >
              {#each lane.Items as item (item.id)}
                <div animate:flip={{ duration: flipDurationMs }}>
                  <Card {item} isRunning={lane.runsTimer} />
                </div>
              {/each}
            </div>
          </Lane>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<form on:submit|preventDefault={createLane}>
  <label for="name">レーンを作成</label>
  <input type="text" name="name" required bind:value={newLaneName} />
  <input type="checkbox" name="runsTimer" id="runsTimer" bind:checked={newLaneRunsTimer} />
  <label for="runsTimer">このレーンでタイマーを作動させる</label>
  <input type="submit" value="作成" />
</form>

<style lang="scss">
  :global(body:has(.lanes)) {
    background-color: #ddd;
  }
  .board {
    padding: 0 1em 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em 0;
    h1 {
      margin: 0;
    }
  }
  .lanes {
    display: flex;
    height: calc(100vh - 4em - 3.34em - 1em - 3em);
    overflow-x: scroll;
  }
  .items {
    padding: 0;
    height: calc(100% - 3.16em - 0.5em - 0.5ch);
    box-sizing: border-box;
    overflow: scroll;
  }
</style>
