<script lang="ts">
  import { communicating } from '$lib/communicating';
  import type { PageData } from './$types';
  import { afterUpdate } from 'svelte';
  import { page } from '$app/stores';
  import { trpc } from '$lib/trpc/client';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;

  let { boards, supabase } = data;
  $: ({ boards, supabase } = data);
  $: ownerPromise = (async () => (await supabase.auth.getUser()).data.user?.id)();

  let boardName = '';
  const createBoard = async () => {
    trpc($page).board.create.mutate(boardName);
    boardName = '';
    invalidateAll();
  };

  afterUpdate(() => {
    $communicating = false;
  });
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
    <form on:submit|preventDefault={createBoard}>
      <label for="name">ボードを作成</label>
      <input type="text" name="name" required bind:value={boardName} />
      <input type="submit" value="作成" />
    </form>
  {/if}
{/await}
