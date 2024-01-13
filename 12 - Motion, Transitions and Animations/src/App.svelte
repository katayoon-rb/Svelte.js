<script>
  import Card from "./card.svelte";

  // Tweened
  import { tweened } from "svelte/motion";
  import { cubicIn } from "svelte/easing";

  const progress = tweened(0, {
    delay: 0,
    duration: 700,
    easing: cubicIn,
  });
  setTimeout(() => {
    progress.set(0.5);
  }, 1500);

  //
  // Spring
  import Spring from "./Spring.svelte";

  //
  // Element Transitions
  import { fade, fly, slide, scale } from "svelte/transition";

  let boxInput;
  let boxes = [];
  let showParagraph = false;
  function addBox() {
    boxes = [...boxes, boxInput.value];
  }
  function discard(value) {
    boxes = boxes.filter((el) => el !== value);
  }
  function showText() {
    showParagraph = !showParagraph;
  }
</script>

<!--  -->
<!-- Tweened -->
<Card>
  <progress value={$progress} />
</Card>

<!-- Spring -->
<Card>
  <Spring />
</Card>

<!-- Element Transitions -->
<Card>
  <div>
    <input type="text" bind:this={boxInput} />
    <button on:click={addBox}>Add</button>
  </div>
  {#each boxes as box (box)}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="wrap" transition:slide on:click={discard.bind(this, box)}>
      {box}
    </div>
  {/each}

  <button on:click={showText}> Toggle </button>

  {#if showParagraph}
    <p in:scale out:fly={{ x: 300 }}>Can you see me?</p>
  {/if}
</Card>

<!--  -->

<style>
  .wrap {
    width: 10rem;
    height: 5rem;
    background: #ccc;
    margin: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    border-radius: 5px;
    padding: 1rem;
  }
</style>
