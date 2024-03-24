<script lang="ts">
  import { browser } from '$app/environment';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let { boards, supabase } = data;
  $: ({ boards, supabase } = data);
  let reloadedAfterSignIn = false;
  $: ownerPromise = (async () => (await supabase.auth.getUser()).data.user?.id)();

  $: {
    (async () => {
      if (browser && (await ownerPromise) && !reloadedAfterSignIn) {
        invalidateAll();
        reloadedAfterSignIn = true;
      }
    })();
  }
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

{#await ownerPromise then owner}
  {#if owner}
    {#if boards?.length}
      {#each boards as board}
        <a href="/board{board.id}">
          {board.name}
        </a>
      {/each}
    {/if}
    <form action="?/createBoard" method="post" use:enhance>
      <label for="name">ボードを作成</label>
      <input type="text" name="name" required />
      <input type="submit" value="作成" />
    </form>
  {/if}
{/await}
