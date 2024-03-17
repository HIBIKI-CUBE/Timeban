<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  const { boards } = data;
  // $: ({ boards } = data);
</script>

{boards?.length}

{#if boards?.length}
  {#each boards as board}
    <a href="/board{board.id}">
      {board.name}
    </a>
  {/each}
{/if}
