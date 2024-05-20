<script lang="ts">
  import { communication } from '$lib/globalStates.svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { boards, supabase } = $state(data);
  const ownerPromise = (async () => (await supabase.auth.getUser()).data.user?.id)();

  let boardName = $state('');
  const createBoard = async () => {
    await trpc($page).board.create.mutate(boardName);
    boardName = '';
    invalidateAll();
  };

  // $effect(communication().finish);
</script>

{#await ownerPromise then owner}
  {#if owner}
    {#if boards?.length}
      {#each boards as board}
        <a href="/board{board.id}">
          {board.name}
        </a>
      {/each}
    {/if}
    <form
      onsubmit={event => {
        event.preventDefault();

        createBoard();
      }}
    >
      <label for="name">ボードを作成</label>
      <input type="text" name="name" required bind:value={boardName} />
      <input type="submit" value="作成" />
    </form>
  {/if}
{/await}
