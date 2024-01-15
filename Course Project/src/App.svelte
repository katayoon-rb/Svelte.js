<script>
  import meetups from "./Meetups/meetups-store.js";
  import Header from "./UI/Header.svelte";
  import MeetupGrid from "./Meetups/MeetupGrid.svelte";
  import LoadingSpinner from "./UI/LoadingSpinner.svelte";
  import EditMeetup from "./Meetups/EditMeetup.svelte";
  import MeetupDetail from "./Meetups/MeetupDetail.svelte";
  import Error from "./UI/Error.svelte";

  let editMode;
  let editId;
  let page = "overview";
  let pageData = {};
  let isLoading = true;
  let error;

  fetch("https://svelte-course-prj-default-rtdb.firebaseio.com/meetups.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Fetching meetups failed, please try again later!");
      }
      return res.json();
    })
    .then((data) => {
      const loadedMeetups = [];
      for (const key in data) {
        loadedMeetups.push({ ...data[key], id: key });
      }
      setTimeout(() => {
        isLoading = false;
        meetups.setMeetups(loadedMeetups.reverse());
      }, 800);
    })
    .catch((err) => {
      error = err;
      isLoading = false;
      console.log(err);
    });

  function saveMeetups(e) {
    editMode = null;
    editId = null;
  }
  function cancelEdit() {
    editMode = null;
    editId = null;
  }
  function showDetails(e) {
    page = "details";
    pageData.id = e.detail;
  }
  function closeDetails() {
    page = "overview";
    pageData = {};
  }
  function startEdit(e) {
    editMode = "edit";
    editId = e.detail;
  }
  function clearError() {
    error = null;
  }
</script>

{#if error}
  <Error message={error.message} on:cancel={clearError} />
{/if}
<Header />
<main>
  {#if page === "overview"}
    <div class="meetup-controls"></div>
    {#if editMode === "edit"}
      <EditMeetup id={editId} on:save={saveMeetups} on:cancel={cancelEdit} />
    {/if}
    {#if isLoading}
      <LoadingSpinner />
    {:else}
      <MeetupGrid
        meetups={$meetups}
        on:showDetails={showDetails}
        on:edit={startEdit}
        on:add={() => {
          editMode = "edit";
        }}
      />
    {/if}
  {:else}
    <MeetupDetail id={pageData.id} on:close={closeDetails} />
  {/if}
</main>

<style>
  main {
    margin-top: 5rem;
  }
  .meetup-controls {
    margin: 1rem;
  }
</style>
