<script>
  import CustomInput from "./CustomInput.svelte";
  import Toggle from "./Toggle.svelte";
  import { isValidEmail } from "./validation.js";

  let val = "Max";
  let price = 0;
  let selectedOption = 1;
  let agreed;
  let favColor = ["green"];
  let usernameInput;
  let customInput;
  let enteredEmail = "";
  let formIsValid = false;

  $: if (isValidEmail(enteredEmail)) {
    formIsValid = true;
  } else {
    formIsValid = false;
  }

  $: console.log(val);
  $: console.log(selectedOption);
  $: console.log(price);
  $: console.log(agreed);
  $: console.log(favColor);
  $: console.log(customInput);
</script>

<CustomInput bind:val />
<Toggle bind:chosenOption={selectedOption} />
<input type="number" bind:value={price} />

<label>
  <input type="checkbox" bind:checked={agreed} />
  Agree to terms?
</label>

<h1>Favorite Color?</h1>
<label>
  <input type="checkbox" name="color" value="red" bind:group={favColor} />
  Red
</label>
<label>
  <input type="checkbox" name="color" value="green" bind:group={favColor} />
  Green
</label>
<label>
  <input type="checkbox" name="color" value="blue" bind:group={favColor} />
  Blue
</label>

<input type="text" bind:this={usernameInput} />
<button on:click={() => console.log(usernameInput.value)}>Save</button>

<hr />

<form on:submit>
  <input
    type="email"
    bind:value={enteredEmail}
    class={isValidEmail(enteredEmail) ? "" : "invalid"}
  />
  <button type="submit" disabled={!formIsValid}>Save</button>
</form>

<style>
  .invalid {
    border: 1px solid red;
  }
</style>
