<script lang="ts">
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';
  import { invalidateAll } from '$app/navigation';
  import type { Lanes, Items, Logs } from '@prisma/client';

  let newItemName = '';
  const createItem = async () => {
    await trpc($page).item.create.mutate({
      name: newItemName,
      laneId: lane.id,
      runsTimer: lane.runsTimer,
    });
    newItemName = '';
    invalidateAll();
  };

  export let lane: Lanes & { Items: (Items & { Logs: Logs[] })[] };
</script>

<div class="lane">
  <h2 class="title">
    {lane.name}
  </h2>
  {#if lane.Items}
    <slot />
  {/if}
  <form on:submit|preventDefault={createItem}>
    <input type="text" name="name" required bind:value={newItemName} />
    <input type="submit" value="追加" />
  </form>
</div>

<style lang="scss">
  .lane {
    background-color: #f5f5f5;
    min-width: 25ch;
    max-width: 25ch;
    border-radius: 1ch;
    position: relative;
    padding: 0.5ch 0.5ch 1em;
    box-sizing: border-box;
    overflow: hidden;
    &:not(:last-child) {
      margin: 0 1em 0 0;
    }
  }

  .title {
    margin: 0 0 0.5em;
    padding: 0 0.5ch;
  }

  form {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    border-radius: 0 0 1ch 1ch;
    overflow: hidden;
    height: 2em;
    input[type='text'] {
      outline: none;
      border: none;
      box-sizing: border-box;
      margin: 0;
      width: 100%;
      padding: 0 1.5ch;
    }
    input[type='submit'] {
      border: none;
      box-sizing: border-box;
      background-color: #fd0;
      font-weight: bold;
      margin: 0;
      width: 15ch;
      color: #000;
    }
  }
</style>
