<script lang="ts">
  import { paused } from '$lib/paused';
  import PauseSolid from 'svelte-awesome-icons/PauseSolid.svelte';
  import PlaySolid from 'svelte-awesome-icons/PlaySolid.svelte';
  import type { Boards, Items } from '@prisma/client';
  import { communicating } from '$lib/communicating';
  import { timers } from '$lib/timers';
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';

  export let items: Items[] = [];
  export let board: Boards;

  async function togglePause() {
    $paused = !$paused;
    $communicating = true;
    await trpc($page).board.masterTimer.mutate({
      boardId: board.id,
      paused: $paused,
    });
    await Promise.all(
      items.map(async item => {
        if ($paused) {
          if ($timers[item.id]) {
            $timers[item.id].sessionOffset += $timers[item.id].duration;
            $timers[item.id].duration = 0;
          }
        } else {
          if (!$timers[item.id]) {
            $timers[item.id] = {
              started_at: new Date(),
              sessionOffset: 0,
              duration: 0,
            };
          }
          $timers[item.id].started_at = new Date();
        }

        await trpc($page).item.update.mutate({
          itemId: item.id,
          runsTimer: !$paused,
        });
      }),
    );
    $communicating = false;
  }
</script>

<button type="button" class:paused={$paused} on:click={togglePause}>
  {#if $paused}
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
