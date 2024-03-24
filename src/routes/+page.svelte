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

  async function handleSignInWithGoogle(response) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
      nonce: 'NONCE', // must be the same one as provided in data-nonce (if any)
    });
  }

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
  {:else}
    Google one tap

    <div
      id="g_id_onload"
      data-client_id="650013448486-ino6c33384tokd4jms1tprl1hi98mlm7.apps.googleusercontent.com"
      data-context="signin"
      data-ux_mode="popup"
      data-callback="handleSignInWithGoogle"
      data-nonce=""
      data-auto_select="true"
      data-itp_support="true"
    ></div>
  {/if}
{/await}
