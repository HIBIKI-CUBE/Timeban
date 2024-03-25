<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import AuthController from '$lib/components/authController.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from '../routes/$types';
  import { invalidate } from '$app/navigation';
  import { navigating } from '$app/stores';

  export let data: PageData;

  let { supabase, session } = data;
  $: ({ supabase, session } = data);

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth');
      }
    });

    return () => subscription.unsubscribe();
  });
</script>

<AuthController {data} />
{#if $navigating}
  <img class="loading" src="logoAnim.svg" alt="" />
{/if}
<slot />

<style lang="scss">
  :global(body) {
    margin: 0;
  }
  .loading {
    position: fixed;
    bottom: 1em;
    right: 1em;
    width: 3em;
    height: 3em;
    background-color: #2b2b2b;
    padding: 0.5em;
    box-sizing: border-box;
    border-radius: 0.5em;
    z-index: 9999;
  }
</style>
