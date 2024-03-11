<script lang="ts">
  import type { PageData } from './$types';
  import { dndzone, type DndEvent, type Item } from 'svelte-dnd-action';

  export let data: PageData;
  let { board } = data;

  export const DndConsider = (e: CustomEvent<DndEvent<Item>>, lane_id: bigint): void => {
    const domLaneIndex = Number(lane_id - 1n);
    if (board?.Lanes[domLaneIndex]?.Items) {
      board.Lanes[domLaneIndex].Items = e.detail.items;
    }
  };
  export const DndFinalize = async (e: CustomEvent<DndEvent<Item>>, lane_id: bigint) => {
    const domLaneIndex = Number(lane_id - 1n);
    if (board?.Lanes[domLaneIndex]?.Items) {
      board.Lanes[domLaneIndex].Items = e.detail.items;
    }
    if (e.detail.info.trigger === 'droppedIntoZone') {
      await Promise.all(
        e.detail.items.map(item => {
          if (item.id !== e.detail.info.id) return;
          const data = new FormData();
          data.append('id', item.id);
          data.append('lane_id', String(lane_id));
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
{#if board.Lanes}
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
              </div>
            {/each}
          </div>
        {/if}
        <form action="?/createItem" method="post">
          <input type="text" name="name" />
          <input type="hidden" name="lane_id" value={lane.id} />
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
