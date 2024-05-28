<script lang="ts">
  import PauseSolid from 'svelte-awesome-icons/PauseSolid.svelte';
  import PlaySolid from 'svelte-awesome-icons/PlaySolid.svelte';
  import type { Boards, Items } from '@prisma/client';
  import { masterTimer, communication, timer } from '$lib/globalStates.svelte';
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';

  interface Props {
    items?: Items[];
    board: Boards;
  }

  let { items = [], board }: Props = $props();

  async function togglePause() {
    masterTimer().toggle();
    communication().start();
    await trpc($page).board.masterTimer.mutate({
      boardId: board.id,
      paused: masterTimer().isPaused,
    });
    await Promise.all(
      items.map(async item => {
        if (masterTimer().isPaused) {
          timer(item.id).pauseIfExists();
        }

        if (masterTimer().isRunning) {
          timer(item.id).resumeOrCreate();
        }

        await trpc($page).item.update.mutate({
          itemId: item.id,
          runsTimer: masterTimer().isRunning,
        });
      }),
    );
    communication().finish();
  }
</script>

<button type="button" class:paused={masterTimer().isPaused} onclick={togglePause}>
  {#if masterTimer().isPaused}
    <PlaySolid size="2em" />
  {:else}
    <PauseSolid size="2em" />
  {/if}
</button>

<style lang="scss">
  button {
    display: grid;
    place-items: center;
    height: 3em;
    width: 3em;
    border-radius: 1ch;
    box-sizing: border-box;
    padding: 0;
    border: none;
    background-color: #4aff6a;
    color: #000;
    flex-shrink: 0;
    &.paused {
      background-color: #ff4b4b;
      animation: blink 1s ease infinite;
    }
  }
  @keyframes blink {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.5;
    }
  }
</style>
