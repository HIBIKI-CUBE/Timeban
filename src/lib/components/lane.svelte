<script lang="ts">
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';
  import type { Lanes, Items, Logs } from '@prisma/client';
  import { timer, communication } from '$lib/globalStates.svelte';

  interface Props {
    lane: Lanes & { Items: (Items & { Logs?: Logs[] })[] };
    children?: import('svelte').Snippet;
  }

  let { lane, children }: Props = $props();

  interface newItemInput {
    name: string;
    estimateMinutes: number | undefined;
    nameInput: HTMLInputElement | null;
    estimateInput: HTMLInputElement | null;
  }

  let newItem: newItemInput = $state({
    name: '',
    estimateMinutes: undefined,
    nameInput: null,
    estimateInput: null,
  });
  const createItem = async () => {
    communication().start();
    const { id } = await trpc($page).item.create.mutate({
      name: newItem.name,
      laneId: lane.id,
      runsTimer: lane.runsTimer,
      estimateMinutes: newItem.estimateMinutes ?? 0,
    });
    if (lane.runsTimer) {
      timer(id).resumeOrCreate();
    }
    newItem = {
      ...newItem,
      name: '',
      estimateMinutes: undefined,
    };
    newItem.nameInput?.blur();
    newItem.estimateInput?.blur();
    const { item } = await trpc($page).item.get.query(id);
    lane.Items.push(item);
    communication().finish();
  };
</script>

<div class="lane">
  <h2 class="title">
    {lane.name}
  </h2>
  {#if lane.Items && children}
    {@render children()}
  {/if}
  <form
    onsubmit={event => {
      event.preventDefault();
      createItem();
    }}
  >
    <div class="inputs">
      <input
        type="text"
        name="name"
        placeholder=""
        required
        bind:value={newItem.name}
        bind:this={newItem.nameInput}
      />
      <input
        type="number"
        name="estimate"
        placeholder="見積もり(分)"
        bind:value={newItem.estimateMinutes}
        bind:this={newItem.estimateInput}
      />
    </div>
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
    border-radius: 0 0 1ch 1ch;
    overflow: hidden;

    $base-height: 30px;
    .inputs {
      transform: translateY($base-height);
      transition: transform 0.5s cubic-bezier(0.87, 0, 0.13, 1);
      &:has(input:focus) {
        transform: translateY(0);
      }
      input {
        outline: none;
        border: none;
        box-sizing: border-box;
        margin: 0;
        width: 100%;
        height: $base-height;
        padding: 0 1.5ch;
        &:last-child {
          width: 70%;
        }
      }
    }
    input[type='submit'] {
      position: absolute;
      bottom: 0;
      right: 0;
      outline: none;
      border: none;
      box-sizing: border-box;
      background-color: #fd0;
      font-weight: bold;
      margin: 0;
      max-width: 10ch;
      width: 30%;
      height: $base-height;
      color: #000;
    }
  }
</style>
