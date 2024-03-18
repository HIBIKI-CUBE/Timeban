<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import AuthController from '$lib/authController.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from '../routes/$types';
  import { invalidate } from '$app/navigation';

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

<AuthController {data}/>
<slot />
