<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import AuthController from '$lib/components/authController.svelte';
  import type { SvelteHTMLElementEvent } from 'svelte-html-event';
  import { onMount } from 'svelte';
  import type { PageData } from '../routes/$types';
  import { invalidate } from '$app/navigation';
  import { navigating } from '$app/stores';
  import { communicating } from '$lib/communicating';

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

  function beforeUnload(e: SvelteHTMLElementEvent<'svelte:window', 'on:beforeunload'>) {
    if ($communicating) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
  }
</script>

<AuthController {data} />
<img class="indicator {$navigating || $communicating ? 'loading' : ''}" src="logoAnim.svg" alt="" />

<svelte:window on:beforeunload={beforeUnload}/>
<slot />

<style lang="scss">
  :global(body) {
    margin: 0;
    font-family: -apple-system, 'BlinkMacSystemFont', 'Hiragino Kaku Gothic ProN', 'メイリオ',
      'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  }
  .indicator {
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
    transition: opacity 0.2s;
    opacity: 1;
    &:not(.loading) {
      opacity: 0;
    }
  }
</style>
