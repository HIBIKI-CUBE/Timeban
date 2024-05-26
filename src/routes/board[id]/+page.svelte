<script lang="ts">
  import { flip } from 'svelte/animate';
  import Card from '$lib/components/card.svelte';
  import type { PageData } from './$types';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import Lane from '$lib/components/lane.svelte';
  import { communication, timer } from '$lib/globalStates.svelte';
  import PauseButton from '$lib/components/pauseButton.svelte';
  import { masterTimer } from '$lib/globalStates.svelte';
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';
  import type { Lanes,Items, Logs } from '@prisma/client';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { board } = $state(data);

  const flipDurationMs = 250;

  board?.paused ? masterTimer().pause() : masterTimer().resume();

  export const DndConsider = (
    e: CustomEvent<DndEvent<Items & { Logs: Logs[] }>>,
    laneId: number,
  ): void => {
    const targetLaneIndex = board?.Lanes.findIndex(lane => lane.id === laneId);
    if (
      targetLaneIndex === undefined ||
      targetLaneIndex === -1 ||
      !board?.Lanes[targetLaneIndex].Items
    )
      return;
    board.Lanes[targetLaneIndex].Items = e.detail.items;
  };
  export const DndFinalize = async (
    e: CustomEvent<DndEvent<Items & { Logs: Logs[] }>>,
    laneId: number,
  ) => {
    const targetLaneIndex = board?.Lanes.findIndex(lane => lane.id === laneId);
    if (targetLaneIndex === -1) return;
    board.Lanes[targetLaneIndex].Items = e.detail.items;
    if (e.detail.info.trigger === 'droppedIntoZone') {
      await Promise.all(
        e.detail.items.map((item, i) => {
          if (
            (item.row === i && item.id !== Number(e.detail.info.id)) ||
            (e.detail.items.length === 1 && e.detail.items[0].lane === laneId)
          )
            return; //When the item is not moved
          if (board?.Lanes[targetLaneIndex].runsTimer) {
            timer(item.id).resumeOrCreate();
          } else {
            timer(item.id).pauseIfExists();
          }

          communication().start();
          trpc($page)
            .item.update.mutate({
              itemId: item.id,
              laneId: laneId,
              row: i,
              runsTimer: board?.Lanes[targetLaneIndex].runsTimer,
            })
            .then(communication().finish);
          return;
        }),
      );
    }
  };

  let newLaneName = $state(''),
    newLaneRunsTimer = $state(false);
  const createLane = async () => {
    communication().start();
    const { id } = await trpc($page).lane.create.mutate({
      name: newLaneName,
      runsTimer: newLaneRunsTimer,
      boardId: board.id,
    });
    newLaneName = '';
    newLaneRunsTimer = false;
    const { lane } = await trpc($page).lane.get.query(id);
    board.Lanes.push(lane );
    communication().finish();
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
              onconsider={e => {
                DndConsider(e, lane.id);
              }}
              onfinalize={e => {
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

<form
  onsubmit={event => {
    event.preventDefault();
    createLane();
  }}
>
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
