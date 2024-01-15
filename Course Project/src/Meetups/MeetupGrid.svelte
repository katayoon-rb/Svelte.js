<script>
  import { createEventDispatcher } from "svelte";
  import { scale } from "svelte/transition";
  import { flip } from "svelte/animate";
  import MeetupItem from "./MeetupItem.svelte";
  import MeetupFilter from "./MeetupFilter.svelte";
  import Button from "../UI/Button.svelte";

  export let meetups;
  const dispatch = createEventDispatcher();
  let favsOnly = false;

  $: filteredMeetups = favsOnly ? meetups.filter((m) => m.isFavorite) : meetups;

  function setFilter(e) {
    favsOnly = e.detail === 1;
  }
</script>

<section id="meetup-controls">
  <MeetupFilter on:select={setFilter} />
  <Button on:click={() => dispatch("add")}>New Meetup</Button>
</section>
{#if filteredMeetups.length === 0}
  <p id="no-meetups">No meetups found, you can start adding some.</p>
{/if}
<section id="meetups">
  {#each filteredMeetups as meetup (meetup.id)}
    <div transition:scale animate:flip={{ duration: 300 }}>
      <MeetupItem
        id={meetup.id}
        title={meetup.title}
        subtitle={meetup.subtitle}
        description={meetup.description}
        imageUrl={meetup.imageUrl}
        email={meetup.contactEmail}
        address={meetup.address}
        isFav={meetup.isFavorite}
        on:showDetails
        on:edit
      />
    </div>
  {/each}
</section>

<style>
  #meetups {
    width: 100%;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  #meetup-controls {
    margin: 1rem;
    display: flex;
    justify-content: space-between;
  }

  #no-meetups {
    margin: 1rem;
  }
</style>
