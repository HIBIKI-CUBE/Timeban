<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { communication } from '$lib/globalStates.svelte';
  import type { PageData } from '../../routes/$types';
  import type { accounts } from 'google-one-tap';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { supabase, session } = $state(data);

  const handleSignOut = async () => {
    communication().start();
    await supabase.auth.signOut();
    await invalidateAll();
    await showGoogleOneTap();
    await goto('/', { invalidateAll: true });
    communication().finish();
  };

  async function handleSignInWithGoogle(response) {
    communication().start();
    await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
      nonce: 'NONCE', // must be the same one as provided in data-nonce (if any)
    });
    await invalidateAll();
    communication().finish();
  }

  let oneTapButton: HTMLDivElement | undefined = $state();

  function showGoogleOneTap() {
    supabase.auth.getUser().then(auth => {
      if (!auth.data.user?.id) {
        const GoogleAccountController = google?.accounts as accounts;
        GoogleAccountController.id.initialize({
          client_id: import.meta.env.VITE_DEV_GOOGLE_CLIENT_ID,
          callback: handleSignInWithGoogle,
          ux_mode: 'popup',
          auto_select: true,
          context: 'signin',
          itp_support: true,
        });

        if(!oneTapButton) return;
        GoogleAccountController.id.renderButton(oneTapButton, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'circle',
        });
      }
    });
  }

  $effect(showGoogleOneTap);
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<header>
  <nav>
    <img class="logo" src="logoTypeOpt.svg" alt="Board" />
    <a href="/">ボード一覧</a>
  </nav>

  <div class="controls">
    {#if !session?.user.id}
      <div class="oneTap" bind:this={oneTapButton}></div>
    {/if}
    {#if session?.user.user_metadata}
      <img
        class="icon"
        src={session.user.user_metadata.avatar_url}
        alt="アカウントのアイコン"
        title="クリックしてログアウト"
        onclick={handleSignOut}
      />
    {/if}
  </div>
</header>

<style lang="scss">
  header {
    background-color: #2b2b2b;
    width: 100%;
    height: 4em;
    display: flex;
    justify-content: space-between;
  }

  nav {
    display: flex;
    width: 100%;
    a {
      display: flex;
      align-items: center;
      background-color: #3b3b3b;
      text-decoration: none;
      color: white;
      padding: 0 2ch;
      box-sizing: border-box;
      height: 100%;
      flex-wrap: nowrap;
    }
  }

  .logo {
    padding: 1em;
    box-sizing: border-box;
    height: 100%;
  }

  .controls {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 1em;
    gap: 1em;
    height: 100%;
  }
  .icon {
    border-radius: 999px;
    box-sizing: border-box;
    height: 100%;
    width: auto;
  }
</style>
