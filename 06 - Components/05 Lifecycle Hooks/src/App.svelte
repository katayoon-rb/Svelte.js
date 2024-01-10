<script>
  import { tick, afterUpdate } from "svelte";
  import Product from "./Product.svelte";
  import Modal from "./Modal.svelte";

  let products = [
    {
      id: "p1",
      title: "A book",
      price: 9.99,
    },
  ];

  let text = "This is some dummy text!";
  let showModal = false;
  let closeable = false;

  function addToCart(event) {
    console.log(event);
  }
  function deleteProduct(event) {
    console.log(event.detail);
  }

  function transform(e) {
    if (e.which !== 9) return;
    e.preventDefault();

    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    const value = e.target.value;

    text =
      value.slice(0, selectionStart) +
      value.slice(selectionStart, selectionEnd).toUpperCase() +
      value.slice(selectionEnd);

    tick().then(() => {
      e.target.selectionStart = selectionStart;
      e.target.selectionEnd = selectionEnd;
    });
  }

  afterUpdate(() => {});
</script>

{#each products as product}
  <Product {...product} on:add-to-cart={addToCart} on:delete={deleteProduct} />
{/each}

<button on:click={() => (showModal = true)}>Show Modal</button>

{#if showModal}
  <Modal
    on:cancel={() => (showModal = false)}
    on:close={() => (showModal = false)}
    let:didAgree={closeable}
  >
    <h1 slot="header">Hello!</h1>
    <p>This works!</p>
    <button
      slot="footer"
      on:click={() => (showModal = false)}
      disabled={!closeable}>Confirm</button
    >
  </Modal>
{/if}

<textarea rows="5" value={text} on:keydown={transform}></textarea>
