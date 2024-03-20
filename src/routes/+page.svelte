<script lang="ts">
  import { browser } from '$app/environment';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let { boards, session } = data;
  $: ({ boards, session } = data);
  let reloadedAfterSignIn = false;

  $: {
    if (browser && session?.user.id && !reloadedAfterSignIn) {
      invalidateAll();
      reloadedAfterSignIn = true;
    }
  }

</script>

{#if session?.user.id}
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
