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
  import type { Lanes, Items, Logs } from '@prisma/client';
  import TrashCanSolid from 'svelte-awesome-icons/TrashCanSolid.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { board } = $state(data);

  const flipDurationMs = 250;

  board?.paused ? masterTimer().pause() : masterTimer().resume();

  let dragging = $state(false);

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
    dragging = true;
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
      dragging = false;
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

  const DndDispose = async (e: CustomEvent<DndEvent<Items & { Logs: Logs[] }>>): Promise<void> => {
    if (e.detail.info.trigger === 'droppedIntoZone') {
      dragging = false;
      communication().start();
      await trpc($page).item.delete.mutate({
        itemId: Number(e.detail.info.id),
      });
      communication().finish();
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
    board.Lanes.push(lane);
    communication().finish();
  };
</script>

{#if board}
  <div class="board">
    <div class="header">
      <h1>
        {board?.name}
      </h1>
      <div
        class="disposer"
        class:dragging
        use:dndzone={{
          items: board?.Lanes.flatMap(lane => lane.Items),
          flipDurationMs,
        }}
        onconsider={() => {}}
        onfinalize={e => {
          DndDispose(e);
        }}
      >
        <TrashCanSolid />
      </div>
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
    gap: 1em;
    h1 {
      margin: 0;
    }
  }
  .disposer {
    display: grid;
    place-items: center;
    width: 100%;
    height: 2.5em;
    background-color: #ccc;
    border: dashed 2px #000;
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 0.25s ease;
    border-radius: 1ch;
    &.dragging {
      opacity: 1;
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
